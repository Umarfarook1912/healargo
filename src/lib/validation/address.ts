import { z } from "zod";

/**
 * Indian mobile/landline: 10 digits, optionally prefixed with +91, 91 or 0.
 * Spaces, dashes and brackets are allowed for readability.
 */
export function isValidPhone(value: string): boolean {
  const compact = value.trim().replace(/[\s\-()]/g, "");
  return /^(\+?91|0)?\d{10}$/.test(compact);
}

/** Indian PIN code: exactly 6 digits, not starting with 0. */
export function isValidPincode(value: string): boolean {
  return /^[1-9]\d{5}$/.test(value.trim());
}

export const phoneSchema = (message = "Valid phone number is required") =>
  z.string().trim().refine(isValidPhone, message);

export const pincodeSchema = (message = "Valid 6-digit PIN code is required") =>
  z.string().trim().refine(isValidPincode, message);
