// Shared validation utilities for all auth forms.
// All error messages in English. No external libraries used.

// ─── Name ─────────────────────────────────────────────────────────────────────
export function validateName(raw: string): string | null {
  const name = raw.trim()
  if (!name) return 'Name is required.'
  if (name.length < 2) return 'Name must be at least 2 characters long.'
  if (name.length > 50) return 'Name must not exceed 50 characters.'
  if (!/^[a-zA-ZÄäÖöÜüß\s-]+$/.test(name))
    return 'Name may only contain letters, spaces and hyphens.'
  return null
}

// ─── Email ────────────────────────────────────────────────────────────────────
export function validateEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase()
  if (!email) return 'Email is required.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return 'Please enter a valid email address.'
  return null
}

// ─── Password – full rules (register / reset-password) ───────────────────────
export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required.'
  if (password.includes(' ')) return 'Password must not contain spaces.'
  if (password.length < 8) return 'Password must be at least 8 characters long.'
  if (password.length > 72) return 'Password must not exceed 72 characters.'
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.'
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter.'
  if (!/[0-9]/.test(password)) return 'Password must contain at least one digit.'
  if (!/[!@#$%^&*]/.test(password))
    return 'Password must contain at least one special character (!@#$%^&*).'
  return null
}

// ─── Password – basic rules (login only) ──────────────────────────────────────
export function validateLoginPassword(password: string): string | null {
  if (!password) return 'Password is required.'
  if (password.includes(' ')) return 'Password must not contain spaces.'
  if (password.length < 8) return 'Password must be at least 8 characters long.'
  if (password.length > 72) return 'Password is too long.'
  return null
}

// ─── Password match ───────────────────────────────────────────────────────────
export function validatePasswordMatch(password: string, confirm: string): string | null {
  if (password !== confirm) return 'Passwords do not match.'
  return null
}

// ─── Password strength ────────────────────────────────────────────────────────
export type PasswordStrength = 'weak' | 'medium' | 'strong'

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password || password.length < 8) return 'weak'
  let score = 1
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[!@#$%^&*]/.test(password)) score++
  if (score <= 2) return 'weak'
  if (score <= 4) return 'medium'
  return 'strong'
}

// ─── Sanitizers ───────────────────────────────────────────────────────────────
export const sanitizeEmail = (email: string): string => email.trim().toLowerCase()
export const sanitizeName = (name: string): string => name.trim()
