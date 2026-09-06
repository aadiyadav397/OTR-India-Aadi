import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { getProfile, updateProfile, ApiError, type OtrProfile } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useRouter } from "../router";
import { EducationSection } from "../components/EducationSection";
import { CredentialsSection } from "../components/CredentialsSection";
import { DocumentsSection } from "../components/DocumentsSection";

type LoadState =
  | { kind: "loading" }
  | { kind: "success"; profile: OtrProfile }
  | { kind: "error"; message: string };

export function Profile() {
  const { token, logout } = useAuth();
  const { navigate } = useRouter();

  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [address, setAddress] = useState("");
  const [saveErrors, setSaveErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    getProfile(token)
      .then(({ profile }) => {
        if (cancelled) return;
        setState({ kind: "success", profile });
        setFullName(profile.fullName);
        setDateOfBirth(profile.dateOfBirth);
        setMobileNumber(profile.mobileNumber);
        setAddress(profile.address ?? "");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({
          kind: "error",
          message: err instanceof ApiError ? err.message : "Could not load profile.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!token) return;

    setSaveErrors([]);
    setIsSaving(true);
    try {
      const { profile } = await updateProfile(token, {
        fullName,
        dateOfBirth,
        mobileNumber,
        address: address.trim() === "" ? null : address,
      });
      setState({ kind: "success", profile });
      setIsEditing(false);
    } catch (err) {
      if (err instanceof ApiError) {
        setSaveErrors(err.details && err.details.length > 0 ? err.details : [err.message]);
      } else {
        setSaveErrors(["Something went wrong. Please try again."]);
      }
    } finally {
      setIsSaving(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>OTR Profile</h1>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <a href="/dashboard" onClick={(e) => { e.preventDefault(); navigate("/dashboard"); }}>
            Dashboard
          </a>
          <a href="/services" onClick={(e) => { e.preventDefault(); navigate("/services"); }}>
            Government Services
          </a>
          <a href="/applications" onClick={(e) => { e.preventDefault(); navigate("/applications"); }}>
            My Applications
          </a>
          <button onClick={handleLogout} style={{ cursor: "pointer" }}>
            Log Out
          </button>
        </div>
      </div>

      <p
        style={{
          background: "#eef6ff",
          border: "1px solid #cfe3ff",
          padding: "0.75rem",
          borderRadius: 4,
          fontSize: "0.85rem",
          color: "#1a4d8f",
        }}
      >
        Your OTR ID is your reusable identity for this prototype. It is not derived from
        Aadhaar or any other government identifier.
      </p>

      {state.kind === "loading" && <p>Loading profile...</p>}
      {state.kind === "error" && <p style={{ color: "crimson" }}>{state.message}</p>}

      {state.kind === "success" && !isEditing && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <Field label="OTR ID" value={state.profile.otrId} />
          <Field label="Full Name" value={state.profile.fullName} />
          <Field label="Date of Birth" value={state.profile.dateOfBirth} />
          <Field label="Mobile Number" value={state.profile.mobileNumber} />
          <Field label="Address" value={state.profile.address ?? "(not set)"} />
          <Field label="Email" value={state.profile.email} />

          <button onClick={() => setIsEditing(true)} style={{ marginTop: "0.75rem", cursor: "pointer" }}>
            Edit Profile
          </button>
        </div>
      )}

      {state.kind === "success" && isEditing && (
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <label>
            Full Name
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={inputStyle}
            />
          </label>
          <label>
            Date of Birth
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              style={inputStyle}
            />
          </label>
          <label>
            Mobile Number
            <input
              type="tel"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              style={inputStyle}
            />
          </label>
          <label>
            Address
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 221B Model Town, Delhi"
              style={inputStyle}
            />
          </label>

          {saveErrors.length > 0 && (
            <ul style={{ color: "crimson", fontSize: "0.85rem", margin: 0, paddingLeft: "1.2rem" }}>
              {saveErrors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          )}

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="submit" disabled={isSaving} style={{ cursor: "pointer" }}>
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
            <button type="button" onClick={() => setIsEditing(false)} style={{ cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {state.kind === "success" && token && (
        <>
          <EducationSection token={token} />
          <CredentialsSection token={token} />
          <DocumentsSection token={token} />
        </>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: "0.75rem", color: "#666", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: "1rem" }}>{value}</div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "0.5rem",
  marginTop: "0.25rem",
  boxSizing: "border-box",
};
