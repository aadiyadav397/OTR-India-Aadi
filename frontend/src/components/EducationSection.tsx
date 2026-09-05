import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  ApiError,
  createEducation,
  deleteEducation,
  listEducation,
  updateEducation,
  type EducationInput,
  type EducationRecord,
  type RecordStatus,
} from "../api/client";
import { RECORD_STATUSES } from "../api/client";

const EMPTY_FORM: EducationInput = {
  institution: "",
  degreeOrQualification: "",
  fieldOfStudy: "",
  startYear: new Date().getFullYear(),
  endYear: null,
  status: "USER_PROVIDED",
};

export function EducationSection({ token }: { token: string }) {
  const [records, setRecords] = useState<EducationRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<EducationInput>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  function refresh() {
    listEducation(token)
      .then(({ education }) => setRecords(education))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load education records."));
  }

  useEffect(refresh, [token]);

  function startAdd() {
    setForm(EMPTY_FORM);
    setFormErrors([]);
    setEditingId(null);
    setIsAdding(true);
  }

  function startEdit(record: EducationRecord) {
    setForm({
      institution: record.institution,
      degreeOrQualification: record.degreeOrQualification,
      fieldOfStudy: record.fieldOfStudy,
      startYear: record.startYear,
      endYear: record.endYear,
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
        await updateEducation(token, editingId, form);
      } else {
        await createEducation(token, form);
      }
      cancelForm();
      refresh();
    } catch (err) {
      setFormErrors(err instanceof ApiError && err.details ? err.details : [(err as Error).message]);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this education record?")) return;
    try {
      await deleteEducation(token, id);
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete record.");
    }
  }

  return (
    <section style={sectionStyle}>
      <div style={headerRow}>
        <h2 style={{ margin: 0 }}>Education</h2>
        {!isAdding && editingId === null && (
          <button onClick={startAdd} style={{ cursor: "pointer" }}>
            + Add Education
          </button>
        )}
      </div>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {records === null && <p>Loading...</p>}
      {records !== null && records.length === 0 && !isAdding && (
        <p style={{ color: "#666" }}>No education records yet.</p>
      )}

      {records !== null &&
        records.map((r) =>
          editingId === r.id ? (
            <EducationForm
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
                <strong>{r.degreeOrQualification}</strong> — {r.fieldOfStudy}
                <div style={{ color: "#666", fontSize: "0.85rem" }}>
                  {r.institution} · {r.startYear}
                  {r.endYear ? `–${r.endYear}` : " – present"}
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
        <EducationForm
          form={form}
          setForm={setForm}
          errors={formErrors}
          onSubmit={handleSubmit}
          onCancel={cancelForm}
          submitLabel="Add Education"
        />
      )}
    </section>
  );
}

function EducationForm({
  form,
  setForm,
  errors,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  form: EducationInput;
  setForm: (f: EducationInput) => void;
  errors: string[];
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  return (
    <form onSubmit={onSubmit} style={{ ...cardStyle, flexDirection: "column", gap: "0.5rem" }}>
      <label>
        Institution
        <input
          type="text"
          value={form.institution}
          onChange={(e) => setForm({ ...form, institution: e.target.value })}
          required
          style={inputStyle}
        />
      </label>
      <label>
        Degree / Qualification
        <input
          type="text"
          value={form.degreeOrQualification}
          onChange={(e) => setForm({ ...form, degreeOrQualification: e.target.value })}
          required
          style={inputStyle}
        />
      </label>
      <label>
        Field of Study
        <input
          type="text"
          value={form.fieldOfStudy}
          onChange={(e) => setForm({ ...form, fieldOfStudy: e.target.value })}
          required
          style={inputStyle}
        />
      </label>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <label style={{ flex: 1 }}>
          Start Year
          <input
            type="number"
            value={form.startYear}
            onChange={(e) => setForm({ ...form, startYear: Number(e.target.value) })}
            required
            style={inputStyle}
          />
        </label>
        <label style={{ flex: 1 }}>
          End Year (optional)
          <input
            type="number"
            value={form.endYear ?? ""}
            onChange={(e) => setForm({ ...form, endYear: e.target.value ? Number(e.target.value) : null })}
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

export function StatusBadge({ status }: { status: RecordStatus }) {
  return (
    <span
      style={{
        display: "inline-block",
        marginTop: "0.25rem",
        padding: "0.1rem 0.5rem",
        borderRadius: 999,
        fontSize: "0.7rem",
        background: "#f0f0f0",
        color: "#444",
      }}
    >
      {status.replace(/_/g, " ")}
    </span>
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
