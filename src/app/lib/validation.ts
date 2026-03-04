// Shared validation utilities for all auth forms.
// All error messages in German. No external libraries used.

// ─── Name ─────────────────────────────────────────────────────────────────────
// Only letters (incl. German umlauts), spaces and hyphens allowed
export function validateName(raw: string): string | null {
  const name = raw.trim()
  if (!name) return 'Name ist erforderlich.'
  if (name.length < 2) return 'Name muss mindestens 2 Zeichen lang sein.'
  if (name.length > 50) return 'Name darf maximal 50 Zeichen lang sein.'
  if (!/^[a-zA-ZÄäÖöÜüß\s-]+$/.test(name))
    return 'Name darf nur Buchstaben, Leerzeichen und Bindestriche enthalten.'
  return null
}

// ─── Email ────────────────────────────────────────────────────────────────────
// Simple RFC-style check; always call sanitizeEmail() before sending to the API
export function validateEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase()
  if (!email) return 'E-Mail ist erforderlich.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
    return 'Bitte eine gültige E-Mail-Adresse eingeben.'
  return null
}

// ─── Password – full rules (register / reset-password) ───────────────────────
// Requires upper, lower, digit, special char (!@#$%^&*), no spaces, 8–72 chars
export function validatePassword(password: string): string | null {
  if (!password) return 'Passwort ist erforderlich.'
  if (password.includes(' ')) return 'Passwort darf keine Leerzeichen enthalten.'
  if (password.length < 8) return 'Passwort muss mindestens 8 Zeichen lang sein.'
  if (password.length > 72) return 'Passwort darf maximal 72 Zeichen lang sein.'
  if (!/[A-Z]/.test(password)) return 'Passwort muss mindestens einen Großbuchstaben enthalten.'
  if (!/[a-z]/.test(password)) return 'Passwort muss mindestens einen Kleinbuchstaben enthalten.'
  if (!/[0-9]/.test(password)) return 'Passwort muss mindestens eine Ziffer enthalten.'
  if (!/[!@#$%^&*]/.test(password))
    return 'Passwort muss mindestens ein Sonderzeichen (!@#$%^&*) enthalten.'
  return null
}

// ─── Password – basic rules (login only) ──────────────────────────────────────
// Lighter check so the login form doesn't expose password composition rules
export function validateLoginPassword(password: string): string | null {
  if (!password) return 'Passwort ist erforderlich.'
  if (password.includes(' ')) return 'Passwort darf keine Leerzeichen enthalten.'
  if (password.length < 8) return 'Passwort muss mindestens 8 Zeichen lang sein.'
  if (password.length > 72) return 'Passwort ist zu lang.'
  return null
}

// ─── Password match ───────────────────────────────────────────────────────────
export function validatePasswordMatch(password: string, confirm: string): string | null {
  if (password !== confirm) return 'Passwörter stimmen nicht überein.'
  return null
}

// ─── Password strength ────────────────────────────────────────────────────────
// Score: length>=8 (+1), length>=12 (+1), upper (+1), lower (+1), digit (+1), special (+1)
// weak: 1-2 pts, medium: 3-4 pts, strong: 5-6 pts
export type PasswordStrength = 'weak' | 'medium' | 'strong'

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password || password.length < 8) return 'weak'
  let score = 1 // base point for reaching minimum length
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
// Always call these before sending values to the API
export const sanitizeEmail = (email: string): string => email.trim().toLowerCase()
export const sanitizeName = (name: string): string => name.trim()
