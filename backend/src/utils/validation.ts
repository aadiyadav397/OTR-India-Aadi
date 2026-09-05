// Simple, dependency-free validation helpers for this prototype.
// No validation library - the field set is small and unlikely to grow
// fast enough to justify one yet.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
// Simplified demo assumption: 10-digit mobile number, digits only.
const MOBILE_PATTERN = /^\d{10}$/;
const MIN_PASSWORD_LENGTH = 8;

export function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && EMAIL_PATTERN.test(value.trim());
}

export function isValidPassword(value: unknown): value is string {
  return typeof value === "string" && value.length >= MIN_PASSWORD_LENGTH;
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isValidDateOfBirth(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
}

export function isValidMobileNumber(value: unknown): value is string {
  return typeof value === "string" && MOBILE_PATTERN.test(value.trim());
}

export interface RegistrationInput {
  email: string;
  password: string;
  fullName: string;
  dateOfBirth: string;
  mobileNumber: string;
}

export function validateRegistrationInput(body: unknown): {
  valid: boolean;
  errors: string[];
  data?: RegistrationInput;
} {
  const errors: string[] = [];
  const b = (body ?? {}) as Record<string, unknown>;

  if (!isValidEmail(b.email)) errors.push("A valid email is required.");
  if (!isValidPassword(b.password)) {
    errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
  if (!isNonEmptyString(b.fullName)) errors.push("Full name is required.");
  if (!isValidDateOfBirth(b.dateOfBirth)) {
    errors.push("Date of birth must be a valid date in YYYY-MM-DD format.");
  }
  if (!isValidMobileNumber(b.mobileNumber)) {
    errors.push("Mobile number must be exactly 10 digits.");
  }

  if (errors.length > 0) return { valid: false, errors };

  return {
    valid: true,
    errors: [],
    data: {
      email: (b.email as string).trim().toLowerCase(),
      password: b.password as string,
      fullName: (b.fullName as string).trim(),
      dateOfBirth: b.dateOfBirth as string,
      mobileNumber: (b.mobileNumber as string).trim(),
    },
  };
}

export interface LoginInput {
  email: string;
  password: string;
}

export function validateLoginInput(body: unknown): {
  valid: boolean;
  errors: string[];
  data?: LoginInput;
} {
  const errors: string[] = [];
  const b = (body ?? {}) as Record<string, unknown>;

  if (!isValidEmail(b.email)) errors.push("A valid email is required.");
  if (!isNonEmptyString(b.password)) errors.push("Password is required.");

  if (errors.length > 0) return { valid: false, errors };

  return {
    valid: true,
    errors: [],
    data: {
      email: (b.email as string).trim().toLowerCase(),
      password: b.password as string,
    },
  };
}

export interface ProfileUpdateInput {
  fullName?: string;
  dateOfBirth?: string;
  mobileNumber?: string;
}

/**
 * Validates a PATCH /api/profile body. Every field is optional, but any
 * field that IS present must be valid. Only these three basic fields may
 * be updated in this milestone - otrId, email, and userId are immutable
 * through this endpoint.
 */
export function validateProfileUpdateInput(body: unknown): {
  valid: boolean;
  errors: string[];
  data?: ProfileUpdateInput;
} {
  const errors: string[] = [];
  const b = (body ?? {}) as Record<string, unknown>;
  const data: ProfileUpdateInput = {};

  if (b.fullName !== undefined) {
    if (!isNonEmptyString(b.fullName)) errors.push("Full name cannot be empty.");
    else data.fullName = (b.fullName as string).trim();
  }
  if (b.dateOfBirth !== undefined) {
    if (!isValidDateOfBirth(b.dateOfBirth)) {
      errors.push("Date of birth must be a valid date in YYYY-MM-DD format.");
    } else data.dateOfBirth = b.dateOfBirth as string;
  }
  if (b.mobileNumber !== undefined) {
    if (!isValidMobileNumber(b.mobileNumber)) {
      errors.push("Mobile number must be exactly 10 digits.");
    } else data.mobileNumber = (b.mobileNumber as string).trim();
  }

  if (Object.keys(data).length === 0 && errors.length === 0) {
    errors.push("At least one field (fullName, dateOfBirth, mobileNumber) must be provided.");
  }

  if (errors.length > 0) return { valid: false, errors };

  return { valid: true, errors: [], data };
}

// ---------------------------------------------------------------------
// Milestone 3: education, credentials, documents (reusable OTR records)
// ---------------------------------------------------------------------

import { isValidRecordStatus, DEFAULT_RECORD_STATUS, type RecordStatus } from "./recordStatus";

const MIN_YEAR = 1900;
const MAX_YEAR = new Date().getFullYear() + 1;

function isValidYear(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= MIN_YEAR &&
    value <= MAX_YEAR
  );
}

function isValidIsoDate(value: unknown): value is string {
  return DATE_PATTERN.test(String(value)) && !Number.isNaN(new Date(String(value)).getTime());
}

export interface EducationInput {
  institution: string;
  degreeOrQualification: string;
  fieldOfStudy: string;
  startYear: number;
  endYear: number | null;
  status: RecordStatus;
}

export function validateEducationInput(
  body: unknown,
  { partial }: { partial: boolean }
): { valid: boolean; errors: string[]; data?: Partial<EducationInput> } {
  const errors: string[] = [];
  const b = (body ?? {}) as Record<string, unknown>;
  const data: Partial<EducationInput> = {};

  const has = (key: string) => Object.prototype.hasOwnProperty.call(b, key);

  if (!partial || has("institution")) {
    if (!isNonEmptyString(b.institution)) errors.push("Institution is required.");
    else data.institution = (b.institution as string).trim();
  }
  if (!partial || has("degreeOrQualification")) {
    if (!isNonEmptyString(b.degreeOrQualification)) {
      errors.push("Degree or qualification is required.");
    } else data.degreeOrQualification = (b.degreeOrQualification as string).trim();
  }
  if (!partial || has("fieldOfStudy")) {
    if (!isNonEmptyString(b.fieldOfStudy)) errors.push("Field of study is required.");
    else data.fieldOfStudy = (b.fieldOfStudy as string).trim();
  }
  if (!partial || has("startYear")) {
    if (!isValidYear(b.startYear)) errors.push(`Start year must be between ${MIN_YEAR} and ${MAX_YEAR}.`);
    else data.startYear = b.startYear as number;
  }
  if (has("endYear")) {
    if (b.endYear !== null && !isValidYear(b.endYear)) {
      errors.push(`End year must be null or between ${MIN_YEAR} and ${MAX_YEAR}.`);
    } else {
      data.endYear = (b.endYear as number | null) ?? null;
    }
  }
  if (has("status")) {
    if (!isValidRecordStatus(b.status)) errors.push("Status is not a recognized value.");
    else data.status = b.status;
  } else if (!partial) {
    data.status = DEFAULT_RECORD_STATUS;
  }

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, errors: [], data };
}

export interface CredentialInput {
  title: string;
  type: string;
  issuer: string;
  credentialId: string | null;
  issueDate: string;
  expiryDate: string | null;
  status: RecordStatus;
}

export function validateCredentialInput(
  body: unknown,
  { partial }: { partial: boolean }
): { valid: boolean; errors: string[]; data?: Partial<CredentialInput> } {
  const errors: string[] = [];
  const b = (body ?? {}) as Record<string, unknown>;
  const data: Partial<CredentialInput> = {};

  const has = (key: string) => Object.prototype.hasOwnProperty.call(b, key);

  if (!partial || has("title")) {
    if (!isNonEmptyString(b.title)) errors.push("Title is required.");
    else data.title = (b.title as string).trim();
  }
  if (!partial || has("type")) {
    if (!isNonEmptyString(b.type)) errors.push("Type is required.");
    else data.type = (b.type as string).trim();
  }
  if (!partial || has("issuer")) {
    if (!isNonEmptyString(b.issuer)) errors.push("Issuer is required.");
    else data.issuer = (b.issuer as string).trim();
  }
  if (has("credentialId")) {
    data.credentialId = b.credentialId === null ? null : String(b.credentialId).trim();
  }
  if (!partial || has("issueDate")) {
    if (!isValidIsoDate(b.issueDate)) errors.push("Issue date must be a valid date in YYYY-MM-DD format.");
    else data.issueDate = b.issueDate as string;
  }
  if (has("expiryDate")) {
    if (b.expiryDate !== null && !isValidIsoDate(b.expiryDate)) {
      errors.push("Expiry date must be null or a valid date in YYYY-MM-DD format.");
    } else {
      data.expiryDate = (b.expiryDate as string | null) ?? null;
    }
  }
  if (has("status")) {
    if (!isValidRecordStatus(b.status)) errors.push("Status is not a recognized value.");
    else data.status = b.status;
  } else if (!partial) {
    data.status = DEFAULT_RECORD_STATUS;
  }

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, errors: [], data };
}

export interface DocumentInput {
  documentType: string;
  documentName: string;
  fileName: string | null;
  fileReference: string | null;
  mimeType: string | null;
  fileSize: number | null;
  verificationStatus: RecordStatus;
}

export function validateDocumentInput(
  body: unknown,
  { partial }: { partial: boolean }
): { valid: boolean; errors: string[]; data?: Partial<DocumentInput> } {
  const errors: string[] = [];
  const b = (body ?? {}) as Record<string, unknown>;
  const data: Partial<DocumentInput> = {};

  const has = (key: string) => Object.prototype.hasOwnProperty.call(b, key);

  if (!partial || has("documentType")) {
    if (!isNonEmptyString(b.documentType)) errors.push("Document type is required.");
    else data.documentType = (b.documentType as string).trim();
  }
  if (!partial || has("documentName")) {
    if (!isNonEmptyString(b.documentName)) errors.push("Document name is required.");
    else data.documentName = (b.documentName as string).trim();
  }
  if (has("fileName")) {
    data.fileName = b.fileName === null ? null : String(b.fileName).trim();
  }
  if (has("fileReference")) {
    data.fileReference = b.fileReference === null ? null : String(b.fileReference).trim();
  }
  if (has("mimeType")) {
    data.mimeType = b.mimeType === null ? null : String(b.mimeType).trim();
  }
  if (has("fileSize")) {
    if (b.fileSize !== null && !(typeof b.fileSize === "number" && b.fileSize >= 0)) {
      errors.push("File size must be null or a non-negative number.");
    } else {
      data.fileSize = (b.fileSize as number | null) ?? null;
    }
  }
  // verificationStatus is intentionally NOT settable on create - every
  // new document always defaults to USER_PROVIDED regardless of what
  // the client sends. It can only be changed afterwards via PATCH.
  if (!partial) {
    data.verificationStatus = DEFAULT_RECORD_STATUS;
  } else if (has("verificationStatus")) {
    if (!isValidRecordStatus(b.verificationStatus)) {
      errors.push("Verification status is not a recognized value.");
    } else data.verificationStatus = b.verificationStatus;
  }

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, errors: [], data };
}
