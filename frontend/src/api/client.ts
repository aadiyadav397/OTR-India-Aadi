const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export interface HealthResponse {
  status: "ok" | "degraded";
  service: string;
  db: "connected" | "unreachable";
  timestamp: string;
}

export interface SafeUser {
  id: number;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface OtrProfile {
  otrId: string;
  fullName: string;
  dateOfBirth: string;
  mobileNumber: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  dateOfBirth: string;
  mobileNumber: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ProfileUpdateInput {
  fullName?: string;
  dateOfBirth?: string;
  mobileNumber?: string;
}

export class ApiError extends Error {
  status: number;
  details?: string[];

  constructor(message: string, status: number, details?: string[]) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/**
 * Minimal fetch wrapper for the prototype.
 * No retry/interceptor logic - kept intentionally simple.
 */
async function request<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const { token, headers, ...rest } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      (body as { error?: string }).error ?? `Request failed: ${response.status}`,
      response.status,
      (body as { details?: string[] }).details
    );
  }

  return body as T;
}

export async function getHealth(): Promise<HealthResponse> {
  return request<HealthResponse>("/api/health");
}

export async function registerUser(
  input: RegisterInput
): Promise<{ token: string; user: SafeUser; profile: Omit<OtrProfile, "email"> }> {
  return request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function loginUser(input: LoginInput): Promise<{ token: string; user: SafeUser }> {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getMe(token: string): Promise<{ user: SafeUser }> {
  return request("/api/auth/me", { token });
}

export async function getProfile(token: string): Promise<{ profile: OtrProfile }> {
  return request("/api/profile", { token });
}

export async function updateProfile(
  token: string,
  input: ProfileUpdateInput
): Promise<{ profile: OtrProfile }> {
  return request("/api/profile", {
    method: "PATCH",
    token,
    body: JSON.stringify(input),
  });
}
