import { useEffect, useState } from "react";
import { getHealth, type HealthResponse } from "../api/client";

type LoadState =
  | { kind: "loading" }
  | { kind: "success"; data: HealthResponse }
  | { kind: "error"; message: string };

export function HealthCheck() {
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;

    getHealth()
      .then((data) => {
        if (!cancelled) setState({ kind: "success", data });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            kind: "error",
            message: err instanceof Error ? err.message : "Unknown error",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem", maxWidth: 480 }}>
      <h1>OTR-India (Prototype)</h1>
      <p style={{ color: "#666" }}>
        Independent Smart India Hackathon prototype. Not a production
        government system. Uses synthetic/demo data only.
      </p>

      <h2>Backend connectivity</h2>
      {state.kind === "loading" && <p>Checking backend...</p>}
      {state.kind === "error" && (
        <p style={{ color: "crimson" }}>
          Could not reach backend: {state.message}
        </p>
      )}
      {state.kind === "success" && (
        <ul>
          <li>Status: {state.data.status}</li>
          <li>Service: {state.data.service}</li>
          <li>Database: {state.data.db}</li>
          <li>Timestamp: {state.data.timestamp}</li>
        </ul>
      )}
    </div>
  );
}
