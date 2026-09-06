import { useEffect, useState } from "react";
import {
  ApiError,
  getProfile,
  listEducation,
  listCredentials,
  listDocuments,
  listApplications,
  listPortals,
  type OtrProfile,
  type EducationRecord,
  type CredentialRecord,
  type DocumentRecord,
  type Application,
  type Portal,
} from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useRouter } from "../router";

type LoadState =
  | { kind: "loading" }
  | {
      kind: "success";
      profile: OtrProfile;
      education: EducationRecord[];
      credentials: CredentialRecord[];
      documents: DocumentRecord[];
      applications: Application[];
      portals: Portal[];
    }
  | { kind: "error"; message: string };

/**
 * Profile fields considered for the completion percentage. Deliberately
 * limited to fields already returned by GET /api/profile - no new
 * backend endpoint is introduced for this calculation, it's purely
 * frontend-derived from data already on hand.
 */
function calculateProfileCompletion(profile: OtrProfile): number {
  const fields: Array<string | null> = [
    profile.fullName,
    profile.dateOfBirth,
    profile.mobileNumber,
    profile.address,
  ];
  const filled = fields.filter((f) => f !== null && f.trim() !== "").length;
  return Math.round((filled / fields.length) * 100);
}

export function Dashboard() {
  const { token, user, logout } = useAuth();
  const { navigate } = useRouter();
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    Promise.all([
      getProfile(token),
      listEducation(token),
      listCredentials(token),
      listDocuments(token),
      listApplications(token),
      listPortals(token),
    ])
      .then(([profileRes, eduRes, credRes, docRes, appRes, portalRes]) => {
        if (cancelled) return;
        setState({
          kind: "success",
          profile: profileRes.profile,
          education: eduRes.education,
          credentials: credRes.credentials,
          documents: docRes.documents,
          applications: appRes.applications,
          portals: portalRes.portals,
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({
          kind: "error",
          message: err instanceof ApiError ? err.message : "Could not load your dashboard.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function go(to: string) {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      navigate(to);
    };
  }

  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem", maxWidth: 900, margin: "0 auto" }}>
      <div style={navBarStyle}>
        <h1 style={{ margin: 0 }}>Dashboard</h1>
        <nav style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <a href="/profile" onClick={go("/profile")}>Profile</a>
          <a href="/services" onClick={go("/services")}>Government Services</a>
          <a href="/applications" onClick={go("/applications")}>My Applications</a>
          <button onClick={handleLogout} style={{ cursor: "pointer" }}>Log Out</button>
        </nav>
      </div>

      {state.kind === "loading" && <p>Loading your dashboard...</p>}
      {state.kind === "error" && <p style={{ color: "crimson" }}>{state.message}</p>}

      {state.kind === "success" && (
        <>
          <OtrIdentityCard profile={state.profile} email={user?.email ?? state.profile.email} />

          <ProfileCompletion profile={state.profile} onEdit={go("/profile")} />

          <ReusableDataSummary
            profile={state.profile}
            education={state.education}
            credentials={state.credentials}
            documents={state.documents}
            onManage={go("/profile")}
          />

          <ApplicationsSummary
            applications={state.applications}
            portals={state.portals}
            onViewAll={go("/applications")}
          />

          <QuickActions onNavigate={go} />
        </>
      )}
    </div>
  );
}

function OtrIdentityCard({ profile, email }: { profile: OtrProfile; email: string }) {
  return (
    <section
      style={{
        ...cardStyle,
        background: "#eef6ff",
        border: "1px solid #cfe3ff",
        display: "flex",
        flexDirection: "column",
        gap: "0.25rem",
      }}
    >
      <span style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "#1a4d8f", fontWeight: 600 }}>
        Reusable OTR Identity
      </span>
      <span style={{ fontSize: "1.5rem", fontWeight: "bold", letterSpacing: "0.05em" }}>
        {profile.otrId}
      </span>
      <span style={{ fontSize: "1.1rem" }}>{profile.fullName}</span>
      <span style={{ color: "#666", fontSize: "0.85rem" }}>{email}</span>
      <p style={{ color: "#1a4d8f", fontSize: "0.8rem", margin: "0.5rem 0 0" }}>
        This is your One-Time Registration identity. It stays with you across every government
        service in this prototype and is never re-issued per portal.
      </p>
    </section>
  );
}

function ProfileCompletion({
  profile,
  onEdit,
}: {
  profile: OtrProfile;
  onEdit: (e: React.MouseEvent) => void;
}) {
  const percent = calculateProfileCompletion(profile);
  return (
    <section style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Profile Completion</h2>
        <span style={{ fontWeight: "bold" }}>{percent}%</span>
      </div>
      <div
        style={{
          background: "#eee",
          borderRadius: 999,
          height: 10,
          marginTop: "0.5rem",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${percent}%`,
            background: percent === 100 ? "#2e9e44" : "#3b82f6",
            height: "100%",
            transition: "width 0.3s ease",
          }}
        />
      </div>
      {percent < 100 && (
        <p style={{ fontSize: "0.85rem", color: "#666", marginBottom: 0 }}>
          {profile.address === null || profile.address.trim() === ""
            ? "Add your address to complete your basic profile."
            : "A few basic details are still missing."}{" "}
          <a href="/profile" onClick={onEdit}>
            Complete profile
          </a>
        </p>
      )}
    </section>
  );
}

function ReusableDataSummary({
  profile,
  education,
  credentials,
  documents,
  onManage,
}: {
  profile: OtrProfile;
  education: EducationRecord[];
  credentials: CredentialRecord[];
  documents: DocumentRecord[];
  onManage: (e: React.MouseEvent) => void;
}) {
  return (
    <section style={{ marginTop: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h2 style={{ margin: "0 0 0.25rem" }}>Reusable OTR Data</h2>
        <a href="/profile" onClick={onManage} style={{ fontSize: "0.85rem" }}>
          Manage
        </a>
      </div>
      <p style={{ color: "#666", fontSize: "0.8rem", marginTop: 0 }}>
        Maintained once, reused across every portal you apply to below.
      </p>

      <div style={gridStyle}>
        <SummaryTile label="Basic Profile">
          <div style={{ fontSize: "0.85rem", color: "#444" }}>
            <div>{profile.mobileNumber}</div>
            <div>{profile.address ?? <em style={{ color: "#999" }}>No address on file</em>}</div>
          </div>
        </SummaryTile>

        <SummaryTile label="Education Records" count={education.length}>
          {education.length === 0 ? (
            <EmptyHint text="No education records yet." />
          ) : (
            <div style={{ fontSize: "0.85rem", color: "#444" }}>
              {education[0].degreeOrQualification} — {education[0].institution}
              {education.length > 1 && (
                <div style={{ color: "#999" }}>+{education.length - 1} more</div>
              )}
            </div>
          )}
        </SummaryTile>

        <SummaryTile label="Credentials" count={credentials.length}>
          {credentials.length === 0 ? (
            <EmptyHint text="No credentials yet." />
          ) : (
            <div style={{ fontSize: "0.85rem", color: "#444" }}>
              {credentials[0].title} — {credentials[0].issuer}
              {credentials.length > 1 && (
                <div style={{ color: "#999" }}>+{credentials.length - 1} more</div>
              )}
            </div>
          )}
        </SummaryTile>

        <SummaryTile label="Documents" count={documents.length}>
          {documents.length === 0 ? (
            <EmptyHint text="No documents yet." />
          ) : (
            <div style={{ fontSize: "0.85rem", color: "#444" }}>
              {documents[0].documentName}
              {documents.length > 1 && (
                <div style={{ color: "#999" }}>+{documents.length - 1} more</div>
              )}
            </div>
          )}
        </SummaryTile>
      </div>
    </section>
  );
}

function ApplicationsSummary({
  applications,
  portals,
  onViewAll,
}: {
  applications: Application[];
  portals: Portal[];
  onViewAll: (e: React.MouseEvent) => void;
}) {
  const submittedCount = applications.filter((a) => a.status === "SUBMITTED").length;
  const recent = applications.slice(0, 5);

  function portalName(portalId: number): string {
    return portals.find((p) => p.id === portalId)?.name ?? `Portal #${portalId}`;
  }

  return (
    <section style={{ marginTop: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h2 style={{ margin: "0 0 0.25rem" }}>Applications</h2>
        <a href="/applications" onClick={onViewAll} style={{ fontSize: "0.85rem" }}>
          View all
        </a>
      </div>
      <p style={{ color: "#666", fontSize: "0.8rem", marginTop: 0 }}>
        Separate, portal-specific submissions — not part of your reusable OTR data.
      </p>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "0.75rem" }}>
        <StatBox label="Total" value={applications.length} />
        <StatBox label="Submitted" value={submittedCount} />
      </div>

      {applications.length === 0 ? (
        <EmptyHint text="No applications submitted yet. Visit Government Services to get started." />
      ) : (
        recent.map((app) => (
          <div key={app.id} style={{ ...cardStyle, padding: "0.6rem 0.75rem", marginBottom: "0.4rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <strong>{app.applicationNumber}</strong>
                <div style={{ color: "#666", fontSize: "0.8rem" }}>{portalName(app.portalId)}</div>
              </div>
              <StatusPill status={app.status} />
            </div>
          </div>
        ))
      )}
    </section>
  );
}

function QuickActions({
  onNavigate,
}: {
  onNavigate: (to: string) => (e: React.MouseEvent) => void;
}) {
  const actions: Array<{ label: string; to: string }> = [
    { label: "Complete / Edit Profile", to: "/profile" },
    { label: "Education, Credentials & Documents", to: "/profile" },
    { label: "Government Services", to: "/services" },
    { label: "My Applications", to: "/applications" },
  ];
  return (
    <section style={{ marginTop: "1.5rem" }}>
      <h2 style={{ margin: "0 0 0.5rem" }}>Quick Actions</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        {actions.map((a) => (
          <a
            key={a.label}
            href={a.to}
            onClick={onNavigate(a.to)}
            style={{
              padding: "0.5rem 0.9rem",
              border: "1px solid #ccc",
              borderRadius: 4,
              textDecoration: "none",
              color: "#222",
              fontSize: "0.85rem",
            }}
          >
            {a.label}
          </a>
        ))}
      </div>
    </section>
  );
}

function SummaryTile({
  label,
  count,
  children,
}: {
  label: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#666" }}>{label}</span>
        {count !== undefined && (
          <span style={{ fontWeight: "bold", fontSize: "1.1rem" }}>{count}</span>
        )}
      </div>
      <div style={{ marginTop: "0.35rem" }}>{children}</div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ ...cardStyle, textAlign: "center", flex: "0 0 auto", minWidth: 90 }}>
      <div style={{ fontSize: "1.4rem", fontWeight: "bold" }}>{value}</div>
      <div style={{ fontSize: "0.75rem", color: "#666", textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

function StatusPill({ status }: { status: "DRAFT" | "SUBMITTED" }) {
  return (
    <span
      style={{
        alignSelf: "flex-start",
        padding: "0.15rem 0.6rem",
        borderRadius: 999,
        fontSize: "0.75rem",
        background: status === "SUBMITTED" ? "#e6f6ea" : "#f0f0f0",
        color: status === "SUBMITTED" ? "#1e7a34" : "#555",
      }}
    >
      {status}
    </span>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <p style={{ color: "#999", fontSize: "0.85rem", margin: 0 }}>{text}</p>;
}

const cardStyle: React.CSSProperties = {
  border: "1px solid #e5e5e5",
  borderRadius: 6,
  padding: "1rem",
  marginBottom: "0.75rem",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "0.75rem",
};

const navBarStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "0.75rem",
  marginBottom: "1.5rem",
};
