import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode]     = useState("login"); // "login" | "register"
  const [form, setForm]     = useState({ email: "", password: "", name: "", confirm: "" });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (mode === "register") {
      if (!form.name.trim())                     return setError("Name is required.");
      if (form.password.length < 8)              return setError("Password must be at least 8 characters.");
      if (form.password !== form.confirm)        return setError("Passwords do not match.");
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        await register(form.email, form.password, form.name.trim());
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setMode(m => m === "login" ? "register" : "login");
    setError("");
    setForm({ email: "", password: "", name: "", confirm: "" });
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="logo-icon">🧠</div>
          <span className="logo-text">DocuMind Chat</span>
        </div>

        <h2 className="auth-title">
          {mode === "login" ? "Welcome back" : "Create account"}
        </h2>
        <p className="auth-subtitle">
          {mode === "login"
            ? "Sign in to your account to continue"
            : "Start chatting with your documents"}
        </p>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <div className="form-group">
              <label className="form-label">Full name</label>
              <input
                className="form-input"
                type="text"
                name="name"
                placeholder="Jane Doe"
                value={form.name}
                onChange={handleChange}
                required
                autoComplete="name"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email address</label>
            <input
              className="form-input"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              name="password"
              placeholder={mode === "register" ? "At least 8 characters" : "••••••••"}
              value={form.password}
              onChange={handleChange}
              required
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>

          {mode === "register" && (
            <div className="form-group">
              <label className="form-label">Confirm password</label>
              <input
                className="form-input"
                type="password"
                name="confirm"
                placeholder="••••••••"
                value={form.confirm}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
            </div>
          )}

          <button className="auth-submit-btn" type="submit" disabled={loading}>
            {loading
              ? <span className="auth-spinner" />
              : (mode === "login" ? "Sign in" : "Create account")}
          </button>
        </form>

        <div className="auth-switch">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}
          <button className="auth-switch-btn" onClick={switchMode} type="button">
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}