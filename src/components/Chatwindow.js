import { useEffect, useRef, useState } from "react";
import { Pencil, Copy, Square } from "lucide-react";

const SUGGESTIONS = [
  { label: "Summarize my documents", sub: "Get a quick overview" },
  { label: "What does this policy say about refunds?", sub: "Extract key info" },
  { label: "Find all mentions of privacy", sub: "Search documents" },
  { label: "Compare sections across files", sub: "Cross-document analysis" },
];

const FRIENDLY_SEND_ERROR    = "I'm having trouble answering that right now. Please try again in a moment.";
const FRIENDLY_NETWORK_ERROR = "Unable to reach the server. Please check your connection and try again.";

export default function ChatWindow({
  chat,
  loading,
  onSend,
  onEditMessage,
  onStop,
  onOpenDocs,
  onNewChat,
  documentCount,
  sidebarOpen,
  setSidebarOpen,
}) {
  const [input, setInput]               = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingText, setEditingText]   = useState("");
  const messagesEndRef  = useRef(null);
  const textareaRef     = useRef(null);
  const editTextareaRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages, loading]);

  useEffect(() => {
    if (editingIndex !== null && editTextareaRef.current) {
      editTextareaRef.current.focus();
      const len = editTextareaRef.current.value.length;
      editTextareaRef.current.setSelectionRange(len, len);
    }
  }, [editingIndex]);

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleSend() {
    if (!input.trim() || loading || !chat) return;
    const text = input.trim();
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    onSend(text);
  }

  function handleInput(e) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
  }

  function startEdit(index, content) {
    setEditingIndex(index);
    setEditingText(content);
  }

  function cancelEdit() {
    setEditingIndex(null);
    setEditingText("");
  }

  function saveEdit() {
    if (!editingText.trim() || loading) return;
    const text = editingText.trim();
    setEditingIndex(null);
    setEditingText("");
    onEditMessage(editingIndex, text);
  }

  function handleEditKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      saveEdit();
    }
    if (e.key === "Escape") cancelEdit();
  }

  function formatTime(ts) {
    if (!ts) return "";
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function isErrorMessage(content) {
    return (
      content === FRIENDLY_SEND_ERROR ||
      content === FRIENDLY_NETWORK_ERROR
    );
  }

  const TopBar = () => (
    <div className="chat-topbar">
      {!sidebarOpen && (
        <button className="btn-icon" onClick={() => setSidebarOpen(true)} title="Open sidebar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" />
          </svg>
        </button>
      )}
      <span className="topbar-title">{chat?.title || "DocuMind Chat"}</span>
      <div className="topbar-actions">
        <button className="doc-badge" onClick={onOpenDocs}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          {documentCount} doc{documentCount !== 1 ? "s" : ""}
        </button>
        {chat && (
          <button className="btn-icon" onClick={onNewChat} title="New chat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );

  if (!chat) {
    return (
      <div className="chat-window">
        <TopBar />
        <div className="no-chat-selected">
          <div className="big-icon">🧠</div>
          <h2>DocuMind Chat Assistant</h2>
          <p>Upload documents and ask questions about them. I'll retrieve the most relevant context and answer precisely.</p>
          <button className="start-btn" onClick={onNewChat}>Start New Chat</button>
        </div>
      </div>
    );
  }

  const messages = chat?.messages || [];
  const isEmpty  = messages.length === 0;

  return (
    <div className="chat-window">
      <TopBar />

      <div className="messages-area">
        {isEmpty ? (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <div className="empty-title">What would you like to know?</div>
            <div className="empty-sub">Ask me anything about your uploaded documents, or any general question.</div>
            <div className="empty-suggestions">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  className="suggestion-chip"
                  onClick={() => { setInput(s.label); textareaRef.current?.focus(); }}
                >
                  <strong>{s.label}</strong>
                  {s.sub}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div key={i} className={`message-row ${msg.role}`}>
                <div className={`msg-avatar ${msg.role}`}>
                  {msg.role === "assistant" ? "🧠" : "👤"}
                </div>

                <div className="msg-body">
                  <div className={`msg-bubble ${isErrorMessage(msg.content) ? "msg-bubble--error" : ""}`}>
                    {editingIndex === i ? (
                      <div className="inline-edit-container">
                        <textarea
                          ref={editTextareaRef}
                          className="inline-edit-textarea"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onKeyDown={handleEditKeyDown}
                          rows={3}
                        />
                        <div className="inline-edit-actions">
                          <button
                            className="save-edit-btn"
                            onClick={saveEdit}
                            disabled={!editingText.trim() || loading}
                          >
                            Save & Submit
                          </button>
                          <button className="cancel-edit-btn" onClick={cancelEdit}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="msg-content">{msg.content}</div>
                    )}
                  </div>

                  {editingIndex !== i && (
                    <div className="msg-footer">
                      <div className="msg-time">{formatTime(msg.timestamp)}</div>
                      <div className="msg-actions">
                        {!isErrorMessage(msg.content) && (
                          <button
                            className="icon-action-btn"
                            onClick={() => navigator.clipboard.writeText(msg.content)}
                            title="Copy"
                          >
                            <Copy size={14} />
                          </button>
                        )}
                        {msg.role === "user" && (
                          <button
                            className="icon-action-btn"
                            onClick={() => startEdit(i, msg.content)}
                            title="Edit"
                            disabled={loading}
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="typing-row">
                <div className="msg-avatar assistant">🧠</div>
                <div className="typing-dots">
                  <span /><span /><span />
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <div className="input-form">
          <textarea
            ref={textareaRef}
            className="input-textarea"
            placeholder={editingIndex !== null ? "Editing message above..." : "Ask anything about your documents..."}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={loading || editingIndex !== null}
          />
          <div className="input-actions">
            {loading ? (
              <button className="stop-btn" onClick={onStop} title="Stop generating">
                <Square size={16} fill="currentColor" />
              </button>
            ) : (
              <button
                className="send-btn"
                onClick={handleSend}
                disabled={!input.trim() || editingIndex !== null}
                title="Send (Enter)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>
        </div>
        <div className="input-hint">
          {editingIndex !== null
            ? "Enter to save edit · Escape to cancel"
            : "Press Enter to send · Shift+Enter for new line"}
        </div>
      </div>
    </div>
  );
}