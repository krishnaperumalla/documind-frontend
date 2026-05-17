import { useAuth } from "../hooks/useAuth";

export default function Sidebar({
  chats,
  activeChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  isOpen,
  onToggle,
  onOpenProfile,
}) {
  const { user } = useAuth();

  return (
    <aside className={`sidebar ${isOpen ? "" : "collapsed"}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">🧠</div>
          <span className="logo-text">DocuMind Chat</span>
        </div>
        <button className="btn-icon" onClick={onToggle} title="Close sidebar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <button className="new-chat-btn" onClick={onNewChat}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
        </svg>
        New Chat
      </button>

      {chats.length > 0 && <div className="chat-list-label">Recent</div>}

      <div className="chat-list">
        {chats.map(chat => (
          <div
            key={chat.id}
            className={`chat-item ${chat.id === activeChatId ? "active" : ""}`}
            onClick={() => onSelectChat(chat.id)}
          >
            <span className="chat-item-title" title={chat.title}>
              {chat.title || "New Chat"}
            </span>
            <button
              className="chat-item-del"
              onClick={e => { e.stopPropagation(); onDeleteChat(chat.id); }}
              title="Delete chat"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        ))}
        {chats.length === 0 && (
          <div style={{ padding: "20px 10px", color: "var(--text-muted)", fontSize: 13, textAlign: "center" }}>
            No chats yet.<br />Start a new one!
          </div>
        )}
      </div>

      {/* Profile section — replaces old sidebar footer */}
      <button className="sidebar-profile-btn" onClick={onOpenProfile}>
        <div className="sidebar-profile-avatar">
          {(user?.name || user?.email || "?")[0].toUpperCase()}
        </div>
        <div className="sidebar-profile-info">
          <div className="sidebar-profile-name">{user?.name || "User"}</div>
          <div className="sidebar-profile-email">{user?.email}</div>
        </div>
        <svg
          className="sidebar-profile-chevron"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </aside>
  );
}