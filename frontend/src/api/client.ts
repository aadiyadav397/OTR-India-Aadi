const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export interface HealthResponse {
  status: "ok" | "degraded";
  service: string;
  db: "connected" | "unreachable";
  timestamp: string;
}

/**
 * Minimal fetch wrapper for the prototype.
 * No retry/interceptor logic yet - kept intentionally simple.
 */
export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/health`);

  if (!response.ok && response.status !== 503) {
    throw new Error(`Health check request failed: ${response.status}`);
  }

  return response.json();
}
