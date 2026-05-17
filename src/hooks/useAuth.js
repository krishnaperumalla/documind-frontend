import { createContext, useContext, useState, useCallback, useRef } from "react";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

const AuthContext = createContext(null);

function getStoredAuth() {
  try {
    return {
      accessToken:  sessionStorage.getItem("access_token"),
      refreshToken: sessionStorage.getItem("refresh_token"),
      tokenHash:    sessionStorage.getItem("token_hash"),
      user:         JSON.parse(sessionStorage.getItem("user") || "null"),
    };
  } catch {
    return { accessToken: null, refreshToken: null, tokenHash: null, user: null };
  }
}

function storeAuth({ access_token, refresh_token, token_hash, user }) {
  sessionStorage.setItem("access_token",  access_token);
  sessionStorage.setItem("refresh_token", refresh_token);
  sessionStorage.setItem("token_hash",    token_hash);
  sessionStorage.setItem("user",          JSON.stringify(user));
}

function clearAuth() {
  sessionStorage.removeItem("access_token");
  sessionStorage.removeItem("refresh_token");
  sessionStorage.removeItem("token_hash");
  sessionStorage.removeItem("user");
  sessionStorage.removeItem("session_id");
}

export function AuthProvider({ children }) {
  const stored                    = getStoredAuth();
  const [user, setUser]           = useState(stored.user);
  const [accessToken, setAccessToken] = useState(stored.accessToken);
  const refreshingRef             = useRef(false);

  // Authenticated fetch — auto-refreshes on 401
  const authFetch = useCallback(async (url, options = {}) => {
    const stored = getStoredAuth();
    const token  = stored.accessToken;

    const res = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(!(options.body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : {}),
      },
    });

    if (res.status === 401 && !refreshingRef.current) {
      refreshingRef.current = true;
      try {
        const { refresh_token, token_hash } = getStoredAuth();
        if (!refresh_token || !token_hash) throw new Error("No refresh token");

        const rr = await fetch(`${API}/auth/refresh-with-hash`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token, token_hash }),
        });

        if (!rr.ok) throw new Error("Refresh failed");

        const data = await rr.json();
        const prevUser = JSON.parse(sessionStorage.getItem("user") || "null");
        storeAuth({ ...data, user: prevUser });
        setAccessToken(data.access_token);

        // Retry original request with new token
        return fetch(url, {
          ...options,
          headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${data.access_token}`,
            ...(!(options.body instanceof FormData)
              ? { "Content-Type": "application/json" }
              : {}),
          },
        });
      } catch {
        clearAuth();
        setUser(null);
        setAccessToken(null);
        throw new Error("Session expired. Please log in again.");
      } finally {
        refreshingRef.current = false;
      }
    }

    return res;
  }, []);

  async function register(email, password, name) {
    const res = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Registration failed");
    }
    const data = await res.json();
    storeAuth(data);
    setUser(data.user);
    setAccessToken(data.access_token);
    return data.user;
  }

  async function login(email, password) {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Login failed");
    }
    const data = await res.json();
    storeAuth(data);
    setUser(data.user);
    setAccessToken(data.access_token);
    return data.user;
  }

  async function logout(sessionId) {
    const { refresh_token } = getStoredAuth();
    try {
      await authFetch(`${API}/auth/logout`, {
        method: "POST",
        body: JSON.stringify({
          refresh_token: refresh_token || "",
          session_id:    sessionId || null,
        }),
      });
    } catch { /* ignore network errors on logout */ }
    clearAuth();
    setUser(null);
    setAccessToken(null);
  }

  async function deleteAccount() {
    await authFetch(`${API}/auth/me`, { method: "DELETE" });
    clearAuth();
    setUser(null);
    setAccessToken(null);
  }

  async function updateProfile(name) {
    const res = await authFetch(`${API}/auth/me`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error("Profile update failed");
    const updated = { ...user, name };
    sessionStorage.setItem("user", JSON.stringify(updated));
    setUser(updated);
  }

  return (
    <AuthContext.Provider value={{
      user, accessToken, authFetch,
      register, login, logout, deleteAccount, updateProfile,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}