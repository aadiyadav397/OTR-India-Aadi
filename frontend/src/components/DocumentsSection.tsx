import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  ApiError,
  createDocument,
  deleteDocument,
  listDocuments,
  updateDocument,
  RECORD_STATUSES,
  type DocumentInput,
  type DocumentRecord,
  type RecordStatus,
} from "../api/client";
import { StatusBadge } from "./EducationSection";

const EMPTY_FORM: DocumentInput = {
  documentType: "",
  documentName: "",
  fileName: null,
  fileReference: null,
  mimeType: null,
  fileSize: null,
};

export function DocumentsSection({ token }: { token: string }) {
  const [records, setRecords] = useState<DocumentRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<DocumentInput>(EMPTY_FORM);
  const [editStatus, setEditStatus] = useState<RecordStatus>("USER_PROVIDED");
  const [formErrors, setFormErrors] = useState<string[]>([]);

  function refresh() {
    listDocuments(token)
      .then(({ documents }) => setRecords(documents))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load documents."));
  }

  useEffect(refresh, [token]);

  function startAdd() {
    setForm(EMPTY_FORM);
    setFormErrors([]);
    setEditingId(null);
    setIsAdding(true);
  }

  function startEdit(record: DocumentRecord) {
    setForm({
      documentType: record.documentType,
      documentName: record.documentName,
      fileName: record.fileName,
      fileReference: record.fileReference,
      mimeType: record.mimeType,
      fileSize: record.fileSize,
    });
    setEditStatus(record.verificationStatus);
    setFormErrors([]);
    setIsAdding(false);
    setEditingId(record.id);
  }

  function cancelForm() {
    setIsAdding(false);
    setEditingId(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormErrors([]);
    try {
      if (editingId !== null) {
        await updateDocument(token, editingId, { ...form, verificationStatus: editStatus });
      } else {
        // verificationStatus is intentionally not sent on create - the
        // backend always starts new documents at USER_PROVIDED.
        await createDocument(token, form);
      }
      cancelForm();
      refresh();
    } catch (err) {
      setFormErrors(err instanceof ApiError && err.details ? err.details : [(err as Error).message]);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this document metadata record?")) return;
    try {
      await deleteDocument(token, id);
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete document.");
    }
  }

  return (
    <section style={sectionStyle}>
      <div style={headerRow}>
        <h2 style={{ margin: 0 }}>Documents</h2>
        {!isAdding && editingId === null && (
          <button onClick={startAdd} style={{ cursor: "pointer" }}>
            + Add Document
          </button>
        )}
      </div>

      <p style={{ color: "#666", fontSize: "0.8rem", marginTop: 0 }}>
        Metadata only for this prototype - no actual files are uploaded or stored.
      </p>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {records === null && <p>Loading...</p>}
      {records !== null && records.length === 0 && !isAdding && (
        <p style={{ color: "#666" }}>No documents yet.</p>
      )}

      {records !== null &&
        records.map((r) =>
          editingId === r.id ? (
            <DocumentForm
              key={r.id}
              form={form}
              setForm={setForm}
              status={editStatus}
              setStatus={setEditStatus}
              showStatus
              errors={formErrors}
              onSubmit={handleSubmit}
              onCancel={cancelForm}
              submitLabel="Save Changes"
            />
          ) : (
            <div key={r.id} style={cardStyle}>
              <div>
                <strong>{r.documentName}</strong> ({r.documentType})
                <div style={{ color: "#666", fontSize: "0.85rem" }}>
                  {r.fileName ? `${r.fileName} · ` : ""}
                  {r.mimeType ? `${r.mimeType} · ` : ""}
                  {r.fileSize !== null ? `${r.fileSize} bytes` : ""}
                </div>
                <StatusBadge status={r.verificationStatus} />
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={() => startEdit(r)} style={{ cursor: "pointer" }}>
                  Edit
                </button>
                <button onClick={() => handleDelete(r.id)} style={{ cursor: "pointer" }}>
                  Delete
                </button>
              </div>
            </div>
          )
        )}

      {isAdding && (
        <DocumentForm
          form={form}
          setForm={setForm}
          status="USER_PROVIDED"
          setStatus={() => {}}
          showStatus={false}
          errors={formErrors}
          onSubmit={handleSubmit}
          onCancel={cancelForm}
          submitLabel="Add Document"
        />
      )}
    </section>
  );
}

function DocumentForm({
  form,
  setForm,
  status,
  setStatus,
  showStatus,
  errors,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  form: DocumentInput;
  setForm: (f: DocumentInput) => void;
  status: RecordStatus;
  setStatus: (s: RecordStatus) => void;
  showStatus: boolean;
  errors: string[];
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  return (
    <form onSubmit={onSubmit} style={{ ...cardStyle, flexDirection: "column", gap: "0.5rem" }}>
      <label>
        Document Type
        <input
          type="text"
          value={form.documentType}
          onChange={(e) => setForm({ ...form, documentType: e.target.value })}
          placeholder="e.g. Marksheet, ID Proof, Address Proof"
          required
          style={inputStyle}
        />
      </label>
      <label>
        Document Name
        <input
          type="text"
          value={form.documentName}
          onChange={(e) => setForm({ ...form, documentName: e.target.value })}
          required
          style={inputStyle}
        />
      </label>
      <label>
        File Name (optional, reference only)
        <input
          type="text"
          value={form.fileName ?? ""}
          onChange={(e) => setForm({ ...form, fileName: e.target.value || null })}
          style={inputStyle}
        />
      </label>
      <label>
        File Reference (optional, reference only)
        <input
          type="text"
          value={form.fileReference ?? ""}
          onChange={(e) => setForm({ ...form, fileReference: e.target.value || null })}
          style={inputStyle}
        />
      </label>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <label style={{ flex: 1 }}>
          MIME Type (optional)
          <input
            type="text"
            value={form.mimeType ?? ""}
            onChange={(e) => setForm({ ...form, mimeType: e.target.value || null })}
            style={inputStyle}
          />
        </label>
        <label style={{ flex: 1 }}>
          File Size in bytes (optional)
          <input
            type="number"
            value={form.fileSize ?? ""}
            onChange={(e) => setForm({ ...form, fileSize: e.target.value ? Number(e.target.value) : null })}
            style={inputStyle}
          />
        </label>
      </div>

      {showStatus && (
        <label>
          Verification Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as RecordStatus)}
            style={inputStyle}
          >
            {RECORD_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      )}
      {!showStatus && (
        <p style={{ color: "#666", fontSize: "0.8rem", margin: 0 }}>
          New documents always start as USER_PROVIDED.
        </p>
      )}

      {errors.length > 0 && (
        <ul style={{ color: "crimson", fontSize: "0.85rem", margin: 0, paddingLeft: "1.2rem" }}>
          {errors.map((err) => (
            <li key={err}>{err}</li>
          ))}
        </ul>
      )}

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button type="submit" style={{ cursor: "pointer" }}>
          {submitLabel}
        </button>
        <button type="button" onClick={onCancel} style={{ cursor: "pointer" }}>
          Cancel
        </button>
      </div>
    </form>
  );
}

const sectionStyle: React.CSSProperties = {
  marginTop: "2rem",
  paddingTop: "1.5rem",
  borderTop: "1px solid #e5e5e5",
};

const headerRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "0.25rem",
};

const cardStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  border: "1px solid #e5e5e5",
  borderRadius: 4,
  padding: "0.75rem",
  marginBottom: "0.5rem",
};

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "0.5rem",
  marginTop: "0.25rem",
  boxSizing: "border-box",
};
