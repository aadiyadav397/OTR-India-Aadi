import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  ApiError,
  createCredential,
  deleteCredential,
  listCredentials,
  updateCredential,
  RECORD_STATUSES,
  type CredentialInput,
  type CredentialRecord,
  type RecordStatus,
} from "../api/client";
import { StatusBadge } from "./EducationSection";

const EMPTY_FORM: CredentialInput = {
  title: "",
  type: "",
  issuer: "",
  credentialId: null,
  issueDate: "",
  expiryDate: null,
  status: "USER_PROVIDED",
};

export function CredentialsSection({ token }: { token: string }) {
  const [records, setRecords] = useState<CredentialRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CredentialInput>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  function refresh() {
    listCredentials(token)
      .then(({ credentials }) => setRecords(credentials))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load credentials."));
  }

  useEffect(refresh, [token]);

  function startAdd() {
    setForm(EMPTY_FORM);
    setFormErrors([]);
    setEditingId(null);
    setIsAdding(true);
  }

  function startEdit(record: CredentialRecord) {
    setForm({
      title: record.title,
      type: record.type,
      issuer: record.issuer,
      credentialId: record.credentialId,
      issueDate: record.issueDate,
      expiryDate: record.expiryDate,
      status: record.status,
    });
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
        await updateCredential(token, editingId, form);
      } else {
        await createCredential(token, form);
      }
      cancelForm();
      refresh();
    } catch (err) {
      setFormErrors(err instanceof ApiError && err.details ? err.details : [(err as Error).message]);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this credential?")) return;
    try {
      await deleteCredential(token, id);
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete credential.");
    }
  }

  return (
    <section style={sectionStyle}>
      <div style={headerRow}>
        <h2 style={{ margin: 0 }}>Credentials</h2>
        {!isAdding && editingId === null && (
          <button onClick={startAdd} style={{ cursor: "pointer" }}>
            + Add Credential
          </button>
        )}
      </div>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {records === null && <p>Loading...</p>}
      {records !== null && records.length === 0 && !isAdding && (
        <p style={{ color: "#666" }}>No credentials yet.</p>
      )}

      {records !== null &&
        records.map((r) =>
          editingId === r.id ? (
            <CredentialForm
              key={r.id}
              form={form}
              setForm={setForm}
              errors={formErrors}
              onSubmit={handleSubmit}
              onCancel={cancelForm}
              submitLabel="Save Changes"
            />
          ) : (
            <div key={r.id} style={cardStyle}>
              <div>
                <strong>{r.title}</strong> ({r.type})
                <div style={{ color: "#666", fontSize: "0.85rem" }}>
                  Issued by {r.issuer} · {r.issueDate}
                  {r.expiryDate ? ` – expires ${r.expiryDate}` : ""}
                  {r.credentialId ? ` · ID: ${r.credentialId}` : ""}
                </div>
                <StatusBadge status={r.status} />
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
        <CredentialForm
          form={form}
          setForm={setForm}
          errors={formErrors}
          onSubmit={handleSubmit}
          onCancel={cancelForm}
          submitLabel="Add Credential"
        />
      )}
    </section>
  );
}

function CredentialForm({
  form,
  setForm,
  errors,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  form: CredentialInput;
  setForm: (f: CredentialInput) => void;
  errors: string[];
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  return (
    <form onSubmit={onSubmit} style={{ ...cardStyle, flexDirection: "column", gap: "0.5rem" }}>
      <label>
        Title
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
          style={inputStyle}
        />
      </label>
      <label>
        Type
        <input
          type="text"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          placeholder="e.g. Certification, License, Award"
          required
          style={inputStyle}
        />
      </label>
      <label>
        Issuer
        <input
          type="text"
          value={form.issuer}
          onChange={(e) => setForm({ ...form, issuer: e.target.value })}
          required
          style={inputStyle}
        />
      </label>
      <label>
        Credential ID (optional)
        <input
          type="text"
          value={form.credentialId ?? ""}
          onChange={(e) => setForm({ ...form, credentialId: e.target.value || null })}
          style={inputStyle}
        />
      </label>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <label style={{ flex: 1 }}>
          Issue Date
          <input
            type="date"
            value={form.issueDate}
            onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
            required
            style={inputStyle}
          />
        </label>
        <label style={{ flex: 1 }}>
          Expiry Date (optional)
          <input
            type="date"
            value={form.expiryDate ?? ""}
            onChange={(e) => setForm({ ...form, expiryDate: e.target.value || null })}
            style={inputStyle}
          />
        </label>
      </div>
      <label>
        Status
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as RecordStatus })}
          style={inputStyle}
        >
          {RECORD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

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
  marginBottom: "0.75rem",
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
