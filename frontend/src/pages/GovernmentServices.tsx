import { useEffect, useState } from "react";
import {
  ApiError,
  listPortals,
  grantConsent,
  previewApplication,
  submitApplication,
  type Portal,
  type ApplicationPreview,
} from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useRouter } from "../router";

type Step =
  | { kind: "selectPortal" }
  | { kind: "consent"; portal: Portal }
  | { kind: "review"; portal: Portal; preview: ApplicationPreview }
  | { kind: "success"; applicationNumber: string };

// Human-readable labels for the reusable OTR data categories shown on
// the consent screen. Informational only - consent in this prototype
// is a single grant/revoke per portal, not per-category.
const SHARED_CATEGORIES = [
  "Basic profile",
  "Contact information",
  "Address",
  "Education records",
  "Selected credentials",
];

// Fields specific to each mock portal that are NOT part of reusable OTR
// data - entered fresh for every application, never stored on the OTR
// profile itself.
const APPLICATION_SPECIFIC_FIELDS: Record<string, { key: string; label: string }[]> = {
  SCHOLARSHIP: [
    { key: "scholarshipType", label: "Scholarship Type" },
    { key: "annualIncome", label: "Annual Family Income (INR)" },
    { key: "preferredInstitution", label: "Preferred Institution" },
  ],
  EMPLOYMENT: [
    { key: "jobRole", label: "Job Role" },
    { key: "yearsOfExperience", label: "Years of Experience" },
    { key: "preferredLocation", label: "Preferred Location" },
  ],
};

export function GovernmentServices() {
  const { token } = useAuth();
  const { navigate } = useRouter();

  const [portals, setPortals] = useState<Portal[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>({ kind: "selectPortal" });
  const [isBusy, setIsBusy] = useState(false);
  const [appSpecificValues, setAppSpecificValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!token) return;
    listPortals(token)
      .then(({ portals }) => setPortals(portals))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load services."));
  }, [token]);

  function selectPortal(portal: Portal) {
    setError(null);
    setStep({ kind: "consent", portal });
  }

  async function handleConsentAndContinue(portal: Portal) {
    if (!token) return;
    setIsBusy(true);
    setError(null);
    try {
      await grantConsent(token, portal.id);
      const preview = await previewApplication(token, portal.id);
      setAppSpecificValues({});
      setStep({ kind: "review", portal, preview });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSubmit(portal: Portal, preview: ApplicationPreview) {
    if (!token) return;
    setIsBusy(true);
    setError(null);
    try {
      const applicationData = { ...preview.prefilled, ...appSpecificValues };
      const { application } = await submitApplication(token, portal.id, applicationData);
      setStep({ kind: "success", applicationNumber: application.applicationNumber });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem", maxWidth: 560, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Government Services</h1>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <a href="/dashboard" onClick={(e) => { e.preventDefault(); navigate("/dashboard"); }}>
            Dashboard
          </a>
          <a href="/profile" onClick={(e) => { e.preventDefault(); navigate("/profile"); }}>
            Back to Profile
          </a>
        </div>
      </div>

      <p style={{ color: "#666", fontSize: "0.85rem" }}>
        Fictional demo portals only. No real government integration, Aadhaar, or DigiLocker is
        used anywhere in this prototype.
      </p>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {step.kind === "selectPortal" && (
        <>
          {portals === null && <p>Loading services...</p>}
          {portals !== null &&
            portals.map((p) => (
              <div key={p.id} style={cardStyle}>
                <div>
                  <strong>{p.name}</strong>
                  <div style={{ color: "#666", fontSize: "0.85rem" }}>{p.description}</div>
                </div>
                <button onClick={() => selectPortal(p)} style={{ cursor: "pointer" }}>
                  Select
                </button>
              </div>
            ))}
        </>
      )}

      {step.kind === "consent" && (
        <div style={cardStyle}>
          <div style={{ width: "100%" }}>
            <h2 style={{ marginTop: 0 }}>{step.portal.name}</h2>
            <p>The following OTR information will be shared:</p>
            <ul>
              {SHARED_CATEGORIES.map((c) => (
                <li key={c}>✓ {c}</li>
              ))}
            </ul>

            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
              <button onClick={() => setStep({ kind: "selectPortal" })} style={{ cursor: "pointer" }}>
                Back
              </button>
              <button
                onClick={() => handleConsentAndContinue(step.portal)}
                disabled={isBusy}
                style={{ cursor: "pointer" }}
              >
                {isBusy ? "Processing..." : "I Consent & Continue"}
              </button>
            </div>
          </div>
        </div>
      )}

      {step.kind === "review" && (
        <div>
          <h2>{step.portal.name} — Application</h2>

          <h3 style={{ marginBottom: "0.25rem" }}>Prefilled from OTR</h3>
          <div style={{ ...cardStyle, flexDirection: "column", alignItems: "stretch" }}>
            {Object.entries(step.preview.prefilled).map(([key, value]) => (
              <div key={key} style={{ marginBottom: "0.5rem" }}>
                <div style={{ fontSize: "0.75rem", color: "#666", textTransform: "uppercase" }}>
                  {key}
                </div>
                <div style={{ fontSize: "0.95rem" }}>
                  {Array.isArray(value) ? (
                    <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: "0.8rem" }}>
                      {JSON.stringify(value, null, 2)}
                    </pre>
                  ) : (
                    String(value ?? "")
                  )}
                </div>
              </div>
            ))}
          </div>

          <h3 style={{ marginBottom: "0.25rem" }}>Application-specific information</h3>
          <div style={{ ...cardStyle, flexDirection: "column", alignItems: "stretch" }}>
            {(APPLICATION_SPECIFIC_FIELDS[step.portal.code] ?? []).map((field) => (
              <label key={field.key} style={{ marginBottom: "0.5rem" }}>
                {field.label}
                <input
                  type="text"
                  value={appSpecificValues[field.key] ?? ""}
                  onChange={(e) =>
                    setAppSpecificValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  style={inputStyle}
                />
              </label>
            ))}
          </div>

          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
            <button onClick={() => setStep({ kind: "selectPortal" })} style={{ cursor: "pointer" }}>
              Cancel
            </button>
            <button
              onClick={() => handleSubmit(step.portal, step.preview)}
              disabled={isBusy}
              style={{ cursor: "pointer" }}
            >
              {isBusy ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </div>
      )}

      {step.kind === "success" && (
        <div style={{ ...cardStyle, flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <h2>Application Submitted Successfully</h2>
          <p>Application Number:</p>
          <p style={{ fontSize: "1.25rem", fontWeight: "bold" }}>{step.applicationNumber}</p>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={() => setStep({ kind: "selectPortal" })} style={{ cursor: "pointer" }}>
              Back to Government Services
            </button>
            <button
              onClick={() => navigate("/applications")}
              style={{ cursor: "pointer" }}
            >
              View My Applications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  border: "1px solid #e5e5e5",
  borderRadius: 4,
  padding: "0.75rem",
  marginBottom: "0.75rem",
};

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "0.5rem",
  marginTop: "0.25rem",
  boxSizing: "border-box",
};
