// Shared, framework-agnostic validators.
// Used by both the checkout form (client) and any server-side route
// that needs to enforce the same rules (single source of truth).

export const PHONE_RE = /^01[0125][0-9]{8}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_ADDRESS_LENGTH = 16;
export const MIN_NAME_WORDS = 2;
export const DISCOUNT_CODE_MIN = 2;
export const DISCOUNT_CODE_MAX = 32;

export function validateName(value) {
  const v = (value ?? "").toString().trim();
  if (!v) return "Please enter your full name";
  if (v.split(/\s+/).filter(Boolean).length < MIN_NAME_WORDS) {
    return "Please enter your full name (at least two words)";
  }
  return "";
}

export function validatePhone(value) {
  const v = (value ?? "").toString().trim();
  if (!v) return "Phone number is required";
  if (!PHONE_RE.test(v)) {
    return "Please enter a valid Egyptian phone number (11 digits)";
  }
  return "";
}

export function validateEmail(value) {
  const v = (value ?? "").toString().trim();
  if (!v) return "Email is required";
  if (!EMAIL_RE.test(v)) return "Please enter a valid email address";
  return "";
}

export function validateAddress(value) {
  const v = (value ?? "").toString().trim();
  if (v.length < MIN_ADDRESS_LENGTH) {
    return `Address must be at least ${MIN_ADDRESS_LENGTH} characters`;
  }
  return "";
}

export function validateGovernorate(value, allowed) {
  if (!value) return "Please select your governorate";
  if (allowed && !(value in allowed) && !allowed.includes?.(value)) {
    return "Please select a valid governorate";
  }
  return "";
}

export function validateDiscountCode(value) {
  const v = (value ?? "").toString().trim();
  if (!v) return "Please enter a code";
  if (v.length < DISCOUNT_CODE_MIN || v.length > DISCOUNT_CODE_MAX) {
    return "Invalid code";
  }
  return "";
}

export function isValidDiscountCodeShape(value) {
  return validateDiscountCode(value) === "";
}

// Convenience: validate the entire checkout shipping form at once.
// Returns an `errors` object (empty strings = valid) and an `isValid` flag.
export function validateCheckoutForm(form, governorates) {
  const errors = {
    name: validateName(form?.name),
    phone: validatePhone(form?.phone),
    email: validateEmail(form?.email),
    address: validateAddress(form?.address),
    governorate: validateGovernorate(form?.governorate, governorates),
  };
  const isValid = Object.values(errors).every((e) => !e);
  return { errors, isValid };
}
