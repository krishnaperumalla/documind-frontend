import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

export default function ProfilePanel({ onClose, sessionId }) {
  const { user, logout, deleteAccount, updateProfile } = useAuth();
  const [tab, setTab]           = useState("profile"); // "profile" | "danger"
  const [editName, setEditName] = useState(false);
  const [name, setName]         = useState(user?.name || "");
  const [nameLoading, setNameLoading] = useState(false);
  const [nameError, setNameError]     = useState("");
  const [nameSuccess, setNameSuccess] = useState(false);
  const [logoutLoading, setLogoutLoading]   = useState(false);
  const [deleteLoading, setDeleteLoading]   = useState(false);
  const [deleteConfirm, setDeleteConfirm]   = useState("");
  const [deleteError, setDeleteError]       = useState("");

  function formatDate(ts) {
    if (!ts) return "";
    return new Date(ts).toLocaleDateString([], {
      year: "numeric", month: "long", day: "numeric",
    });
  }

  async function handleSaveName() {
    if (!name.trim() || name.trim() === user?.name) {
      setEditName(false);
      return;
    }
    setNameLoading(true);
    setNameError("");
    try {
      await updateProfile(name.trim());
      setNameSuccess(true);
      setEditName(false);
      setTimeout(() => setNameSuccess(false), 2500);
    } catch (e) {
      setNameError(e.message || "Failed to update name");
    } finally {
      setNameLoading(false);
    }
  }

  async function handleLogout() {
    setLogoutLoading(true);
    await logout(sessionId);
    // Auth context will unmount this component
  }

  async function handleDelete() {
    if (deleteConfirm !== user?.email) {
      setDeleteError("Email does not match.");
      return;
    }
    setDeleteLoading(true);
    setDeleteError("");
    try {
      await deleteAccount();
    } catch (e) {
      setDeleteError(e.message || "Deletion failed");
      setDeleteLoading(false);
    }
  }

  return (
    <div className="doc-panel-overlay" onClick={onClose}>
      <div className="doc-panel profile-panel" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="doc-panel-header">
          <div className="doc-panel-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
            Account
          </div>
          <button className="btn-icon" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          <button
            className={`profile-tab ${tab === "profile" ? "active" : ""}`}
            onClick={() => setTab("profile")}
          >Profile</button>
          <button
            className={`profile-tab ${tab === "danger" ? "active" : ""}`}
            onClick={() => setTab("danger")}
          >Danger Zone</button>
        </div>

        <div className="profile-body">
          {tab === "profile" && (
            <>
              {/* Avatar */}
              <div className="profile-avatar-row">
                <div className="profile-avatar">
                  {(user?.name || user?.email || "?")[0].toUpperCase()}
                </div>
                <div className="profile-avatar-info">
                  <div className="profile-display-name">{user?.name}</div>
                  <div className="profile-email">{user?.email}</div>
                </div>
              </div>

              {/* Name edit */}
              <div className="profile-field">
                <div className="profile-field-label">Display name</div>
                {editName ? (
                  <div className="profile-field-edit">
                    <input
                      className="form-input"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") handleSaveName();
                        if (e.key === "Escape") { setEditName(false); setName(user?.name || ""); }
                      }}
                      autoFocus
                    />
                    <div className="profile-edit-actions">
                      <button
                        className="auth-submit-btn"
                        style={{ padding: "8px 16px", fontSize: 13 }}
                        onClick={handleSaveName}
                        disabled={nameLoading}
                      >
                        {nameLoading ? <span className="auth-spinner" /> : "Save"}
                      </button>
                      <button
                        className="cancel-edit-btn"
                        onClick={() => { setEditName(false); setName(user?.name || ""); }}
                      >Cancel</button>
                    </div>
                    {nameError && <div className="auth-error" style={{ marginTop: 6 }}>{nameError}</div>}
                  </div>
                ) : (
                  <div className="profile-field-value">
                    <span>{user?.name}</span>
                    <button
                      className="btn-icon"
                      onClick={() => { setEditName(true); setName(user?.name || ""); }}
                      title="Edit name"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                  </div>
                )}
                {nameSuccess && (
                  <div style={{ color: "var(--accent)", fontSize: 12, marginTop: 4 }}>
                    ✓ Name updated
                  </div>
                )}
              </div>

              {/* Email (read-only) */}
              <div className="profile-field">
                <div className="profile-field-label">Email address</div>
                <div className="profile-field-value readonly">
                  <span>{user?.email}</span>
                </div>
              </div>

              {/* Member since */}
              <div className="profile-field">
                <div className="profile-field-label">Member since</div>
                <div className="profile-field-value readonly">
                  <span>{formatDate(user?.created_at)}</span>
                </div>
              </div>

              {/* Logout */}
              <button
                className="logout-btn"
                onClick={handleLogout}
                disabled={logoutLoading}
              >
                {logoutLoading ? <span className="auth-spinner" /> : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Sign out
                  </>
                )}
              </button>
            </>
          )}

          {tab === "danger" && (
            <div className="danger-zone">
              <div className="danger-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Delete Account
              </div>
              <p className="danger-desc">
                This action is <strong>permanent and irreversible</strong>. All your chats,
                messages, and documents will be permanently deleted.
              </p>
              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label">
                  Type your email <strong>{user?.email}</strong> to confirm
                </label>
                <input
                  className="form-input danger-input"
                  type="email"
                  placeholder={user?.email}
                  value={deleteConfirm}
                  onChange={e => { setDeleteConfirm(e.target.value); setDeleteError(""); }}
                />
              </div>
              {deleteError && (
                <div className="auth-error">{deleteError}</div>
              )}
              <button
                className="delete-account-btn"
                onClick={handleDelete}
                disabled={deleteLoading || deleteConfirm !== user?.email}
              >
                {deleteLoading ? <span className="auth-spinner" /> : "Permanently delete account"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}