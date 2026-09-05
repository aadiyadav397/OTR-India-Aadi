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
