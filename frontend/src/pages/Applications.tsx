import { useEffect, useState } from "react";
import { ApiError, listApplications, listPortals, type Application, type Portal } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useRouter } from "../router";

export function Applications() {
  const { token } = useAuth();
  const { navigate } = useRouter();

  const [applications, setApplications] = useState<Application[] | null>(null);
  const [portals, setPortals] = useState<Portal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    Promise.all([listApplications(token), listPortals(token)])
      .then(([appsRes, portalsRes]) => {
        setApplications(appsRes.applications);
        setPortals(portalsRes.portals);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load applications."));
  }, [token]);

  function portalName(portalId: number): string {
    return portals.find((p) => p.id === portalId)?.name ?? `Portal #${portalId}`;
  }

  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem", maxWidth: 560, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>My Applications</h1>
        <a href="/profile" onClick={(e) => { e.preventDefault(); navigate("/profile"); }}>
          Back to Profile
        </a>
      </div>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {applications === null && <p>Loading...</p>}
      {applications !== null && applications.length === 0 && (
        <p style={{ color: "#666" }}>
          No applications yet.{" "}
          <a href="/services" onClick={(e) => { e.preventDefault(); navigate("/services"); }}>
            Browse Government Services
          </a>
        </p>
      )}

      {applications !== null &&
        applications.map((app) => (
          <div key={app.id} style={cardStyle}>
            <div
              style={{ display: "flex", justifyContent: "space-between", cursor: "pointer" }}
              onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
            >
              <div>
                <strong>{app.applicationNumber}</strong>
                <div style={{ color: "#666", fontSize: "0.85rem" }}>
                  {portalName(app.portalId)} · {app.status}
                  {app.submittedAt ? ` · submitted ${new Date(app.submittedAt).toLocaleString()}` : ""}
                </div>
              </div>
              <span>{expandedId === app.id ? "▲" : "▼"}</span>
            </div>

            {expandedId === app.id && (
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  background: "#f7f7f7",
                  padding: "0.75rem",
                  borderRadius: 4,
                  fontSize: "0.8rem",
                  marginTop: "0.75rem",
                }}
              >
                {JSON.stringify(app.applicationData, null, 2)}
              </pre>
            )}
          </div>
        ))}
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  border: "1px solid #e5e5e5",
  borderRadius: 4,
  padding: "0.75rem",
  marginBottom: "0.5rem",
};
