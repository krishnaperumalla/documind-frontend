import { useRef, useState } from "react";

export default function DocumentPanel({ documents, onUpload, onDelete, onClose }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef();

  function formatDate(ts) {
    if (!ts) return "";
    return new Date(ts).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  }

  async function handleFile(file) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are supported.");
      return;
    }
    setError("");
    setUploading(true);
    setUploadMsg(`Uploading ${file.name}...`);
    try {
      const doc = await onUpload(file);
      setUploadMsg(`✓ ${doc.name} — ${doc.chunk_count} chunks indexed`);
      setTimeout(() => setUploadMsg(""), 3000);
    } catch (e) {
      setError(`Upload failed: ${e.message}`);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }

  return (
    <div className="doc-panel-overlay" onClick={onClose}>
      <div className="doc-panel" onClick={e => e.stopPropagation()}>
        <div className="doc-panel-header">
          <div className="doc-panel-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            Documents
          </div>
          <button className="btn-icon" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Upload zone */}
        <div
          className={`upload-zone ${dragging ? "drag-over" : ""}`}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            onChange={e => handleFile(e.target.files[0])}
          />
          <div className="upload-icon">📄</div>
          <div className="upload-text"><strong>Click to upload</strong> or drag & drop</div>
          <div className="upload-sub">PDF files only</div>
        </div>

        {/* Upload status */}
        {uploading && (
          <div className="upload-progress">
            <div className="spinner" />
            {uploadMsg}
          </div>
        )}
        {!uploading && uploadMsg && (
          <div className="upload-progress" style={{ color: "var(--accent)" }}>
            {uploadMsg}
          </div>
        )}
        {error && (
          <div className="upload-progress" style={{ color: "var(--danger)" }}>
            ⚠ {error}
          </div>
        )}

        {/* Document list */}
        <div className="doc-list">
          <div className="doc-list-label">
            {documents.length} document{documents.length !== 1 ? "s" : ""} indexed
          </div>

          {documents.length === 0 ? (
            <div className="empty-docs">
              No documents uploaded yet.<br />
              Upload a PDF to get started.
            </div>
          ) : (
            documents.map(doc => (
              <div key={doc.id} className="doc-item">
                <div className="doc-file-icon">📕</div>
                <div className="doc-info">
                  <div className="doc-name" title={doc.name}>{doc.name}</div>
                  <div className="doc-meta">
                    {doc.chunk_count} chunks · {formatDate(doc.uploaded_at)}
                  </div>
                </div>
                <button className="doc-del" onClick={() => onDelete(doc.id)} title="Remove document">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}