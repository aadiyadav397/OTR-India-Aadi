import bcrypt from "bcryptjs";

// Cost factor kept modest - this is a local demo prototype, not a
// production auth system. 10 is bcrypt's common default.
const SALT_ROUNDS = 10;

export function hashPassword(plainTextPassword: string): string {
  return bcrypt.hashSync(plainTextPassword, SALT_ROUNDS);
}

export function verifyPassword(plainTextPassword: string, passwordHash: string): boolean {
  return bcrypt.compareSync(plainTextPassword, passwordHash);
}
