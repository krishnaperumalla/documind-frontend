import { useEffect, useRef, useState } from "react";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import AuthPage       from "./components/AuthPage";
import Sidebar        from "./components/Sidebar";
import ChatWindow     from "./components/Chatwindow";
import DocumentPanel  from "./components/Documentpanel";
import ProfilePanel   from "./components/ProfilePanel";
import "./App.css";
import "./auth.css";
const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Stable session ID per browser tab (survives component re-mounts but NOT new tabs)
function getSessionId() {
  let id = sessionStorage.getItem("session_id");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("session_id", id);
  }
  return id;
}

function AppInner() {
  const { isAuthenticated, authFetch, logout } = useAuth();
  const sessionId = getSessionId();

  const [chats, setChats]             = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeChat, setActiveChat]   = useState(null);
  const [loading, setLoading]         = useState(false);
  const [docPanelOpen, setDocPanelOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [documents, setDocuments]     = useState([]);
  const abortControllerRef            = useRef(null);

  // ── Cleanup on tab/window close ─────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;

    async function handleUnload() {
      // sendBeacon is the only reliable way to fire on tab close
      const { access_token } = {
        access_token: sessionStorage.getItem("access_token"),
      };
      if (!access_token) return;

      const payload = JSON.stringify({ session_id: sessionId });
      navigator.sendBeacon(
        `${API}/documents/cleanup-session`,
        new Blob([payload], { type: "application/json" })
      );
      // Note: sendBeacon doesn't support custom headers, so we rely on
      // a separate lightweight endpoint that reads user from body token.
      // The backend verifies via a special beacon endpoint below.
    }

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [isAuthenticated, sessionId]);

  // ── Data fetching ────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchChats();
    fetchDocuments();
  }, [isAuthenticated]);

  useEffect(() => {
    if (activeChatId) fetchChat(activeChatId);
  }, [activeChatId]);

  async function fetchChats() {
    try {
      const res  = await authFetch(`${API}/chats`);
      const data = await res.json();
      setChats(data);
    } catch (e) { console.error(e); }
  }

  async function fetchChat(id) {
    try {
      const res  = await authFetch(`${API}/chats/${id}`);
      const data = await res.json();
      setActiveChat(data);
    } catch (e) { console.error(e); }
  }

  async function fetchDocuments() {
    try {
      const res  = await authFetch(`${API}/documents?session_id=${sessionId}`);
      const data = await res.json();
      setDocuments(data);
    } catch (e) { console.error(e); }
  }

  async function newChat() {
    try {
      const res  = await authFetch(`${API}/chats`, {
        method: "POST",
        body:   JSON.stringify({ title: "New Chat" }),
      });
      const chat = await res.json();
      setChats(prev => [chat, ...prev]);
      setActiveChatId(chat.id);
      setActiveChat(chat);
    } catch (e) { console.error(e); }
  }

  async function deleteChat(id) {
    try {
      await authFetch(`${API}/chats/${id}`, { method: "DELETE" });
      setChats(prev => prev.filter(c => c.id !== id));
      if (activeChatId === id) {
        setActiveChatId(null);
        setActiveChat(null);
      }
    } catch (e) { console.error(e); }
  }

  function stopGeneration() {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setLoading(false);
  }

  async function sendMessage(query) {
    if (!activeChatId || !query.trim()) return;

    const tempUserMsg = { role: "user", content: query, timestamp: new Date().toISOString() };
    setActiveChat(prev => ({ ...prev, messages: [...(prev?.messages || []), tempUserMsg] }));
    setLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res  = await authFetch(`${API}/query`, {
        method: "POST",
        body:   JSON.stringify({ chat_id: activeChatId, query, session_id: sessionId }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (data?.chat) {
        setActiveChat(data.chat);
        setChats(prev =>
          prev.map(c => c.id === activeChatId ? { ...c, title: data.chat?.title || c.title } : c)
        );
      }
    } catch (e) {
      if (e.name === "AbortError") return;
      const errMsg = {
        role: "assistant",
        content: "Failed to get a response. Is the backend running?",
        timestamp: new Date().toISOString(),
      };
      setActiveChat(prev => ({ ...prev, messages: [...(prev?.messages || []), errMsg] }));
    } finally {
      abortControllerRef.current = null;
      setLoading(false);
    }
  }

  async function editMessage(messageIndex, newContent) {
    if (!activeChatId || !newContent.trim()) return;

    const truncatedMessages = activeChat.messages.slice(0, messageIndex);
    const editedUserMsg = { role: "user", content: newContent, timestamp: new Date().toISOString() };
    setActiveChat(prev => ({ ...prev, messages: [...truncatedMessages, editedUserMsg] }));
    setLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      await authFetch(`${API}/chats/${activeChatId}/truncate`, {
        method: "PATCH",
        body:   JSON.stringify({ keep_count: messageIndex }),
        signal: controller.signal,
      });

      const res  = await authFetch(`${API}/query`, {
        method: "POST",
        body:   JSON.stringify({ chat_id: activeChatId, query: newContent, session_id: sessionId }),
        signal: controller.signal,
      });
      const data = await res.json();
      setActiveChat(data.chat);
      setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, title: data.chat.title } : c));
    } catch (e) {
      if (e.name === "AbortError") return;
      const errMsg = {
        role: "assistant",
        content: "Failed to regenerate response.",
        timestamp: new Date().toISOString(),
      };
      setActiveChat(prev => ({ ...prev, messages: [...(prev?.messages || []), errMsg] }));
    } finally {
      abortControllerRef.current = null;
      setLoading(false);
    }
  }

  async function uploadDocument(file) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await authFetch(`${API}/documents/upload`, {
      method:  "POST",
      body:    formData,
      headers: { "X-Session-Id": sessionId },
    });
    if (!res.ok) throw new Error(await res.text());
    const doc = await res.json();
    setDocuments(prev => [...prev, doc]);
    return doc;
  }

  async function deleteDocument(id) {
    await authFetch(`${API}/documents/${id}`, { method: "DELETE" });
    setDocuments(prev => prev.filter(d => d.id !== id));
  }

  if (!isAuthenticated) return <AuthPage />;

  return (
    <div className="app-shell">
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onNewChat={newChat}
        onSelectChat={setActiveChatId}
        onDeleteChat={deleteChat}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(p => !p)}
        onOpenProfile={() => setProfileOpen(true)}
      />

      <main className={`main-area ${sidebarOpen ? "sidebar-open" : ""}`}>
        <ChatWindow
          chat={activeChat}
          loading={loading}
          onSend={sendMessage}
          onEditMessage={editMessage}
          onStop={stopGeneration}
          onOpenDocs={() => setDocPanelOpen(true)}
          onNewChat={newChat}
          documentCount={documents.length}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
      </main>

      {docPanelOpen && (
        <DocumentPanel
          documents={documents}
          onUpload={uploadDocument}
          onDelete={deleteDocument}
          onClose={() => setDocPanelOpen(false)}
        />
      )}

      {profileOpen && (
        <ProfilePanel
          sessionId={sessionId}
          onClose={() => setProfileOpen(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}