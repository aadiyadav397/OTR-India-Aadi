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

// ---------------------------------------------------------------------
// Milestone 3: reusable education, credentials, and document metadata.
// These are OTR records tied to the user only, not to any government
// application.
// ---------------------------------------------------------------------

export const RECORD_STATUSES = [
  "USER_PROVIDED",
  "PENDING_VERIFICATION",
  "VERIFIED",
  "REJECTED",
  "EXPIRED",
  "REVOKED",
] as const;

export type RecordStatus = (typeof RECORD_STATUSES)[number];

export interface EducationRecord {
  id: number;
  institution: string;
  degreeOrQualification: string;
  fieldOfStudy: string;
  startYear: number;
  endYear: number | null;
  status: RecordStatus;
  createdAt: string;
  updatedAt: string;
}

export type EducationInput = Omit<EducationRecord, "id" | "createdAt" | "updatedAt">;

export async function listEducation(token: string): Promise<{ education: EducationRecord[] }> {
  return request("/api/education", { token });
}
export async function createEducation(
  token: string,
  input: EducationInput
): Promise<{ education: EducationRecord }> {
  return request("/api/education", { method: "POST", token, body: JSON.stringify(input) });
}
export async function updateEducation(
  token: string,
  id: number,
  input: Partial<EducationInput>
): Promise<{ education: EducationRecord }> {
  return request(`/api/education/${id}`, { method: "PATCH", token, body: JSON.stringify(input) });
}
export async function deleteEducation(token: string, id: number): Promise<void> {
  await request(`/api/education/${id}`, { method: "DELETE", token });
}

export interface CredentialRecord {
  id: number;
  title: string;
  type: string;
  issuer: string;
  credentialId: string | null;
  issueDate: string;
  expiryDate: string | null;
  status: RecordStatus;
  createdAt: string;
  updatedAt: string;
}

export type CredentialInput = Omit<CredentialRecord, "id" | "createdAt" | "updatedAt">;

export async function listCredentials(token: string): Promise<{ credentials: CredentialRecord[] }> {
  return request("/api/credentials", { token });
}
export async function createCredential(
  token: string,
  input: CredentialInput
): Promise<{ credential: CredentialRecord }> {
  return request("/api/credentials", { method: "POST", token, body: JSON.stringify(input) });
}
export async function updateCredential(
  token: string,
  id: number,
  input: Partial<CredentialInput>
): Promise<{ credential: CredentialRecord }> {
  return request(`/api/credentials/${id}`, { method: "PATCH", token, body: JSON.stringify(input) });
}
export async function deleteCredential(token: string, id: number): Promise<void> {
  await request(`/api/credentials/${id}`, { method: "DELETE", token });
}

export interface DocumentRecord {
  id: number;
  documentType: string;
  documentName: string;
  fileName: string | null;
  fileReference: string | null;
  mimeType: string | null;
  fileSize: number | null;
  verificationStatus: RecordStatus;
  uploadedAt: string;
  updatedAt: string;
}

export type DocumentInput = Omit<
  DocumentRecord,
  "id" | "verificationStatus" | "uploadedAt" | "updatedAt"
>;

export async function listDocuments(token: string): Promise<{ documents: DocumentRecord[] }> {
  return request("/api/documents", { token });
}
export async function createDocument(
  token: string,
  input: DocumentInput
): Promise<{ document: DocumentRecord }> {
  return request("/api/documents", { method: "POST", token, body: JSON.stringify(input) });
}
export async function updateDocument(
  token: string,
  id: number,
  input: Partial<DocumentInput> & { verificationStatus?: RecordStatus }
): Promise<{ document: DocumentRecord }> {
  return request(`/api/documents/${id}`, { method: "PATCH", token, body: JSON.stringify(input) });
}
export async function deleteDocument(token: string, id: number): Promise<void> {
  await request(`/api/documents/${id}`, { method: "DELETE", token });
}
