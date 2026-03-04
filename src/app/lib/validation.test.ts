import { describe, it, expect } from 'vitest'
import {
  validateName,
  validateEmail,
  validatePassword,
  validateLoginPassword,
  validatePasswordMatch,
  getPasswordStrength,
  sanitizeEmail,
  sanitizeName,
} from './validation'

// ─── validateEmail ────────────────────────────────────────────────────────────
describe('validateEmail', () => {
  it('accepts a valid email address', () => {
    expect(validateEmail('max@example.com')).toBeNull()
  })

  it('accepts email with subdomain', () => {
    expect(validateEmail('max@mail.example.com')).toBeNull()
  })

  it('rejects email without @ symbol', () => {
    expect(validateEmail('maxexample.com')).not.toBeNull()
  })

  it('rejects email without domain extension', () => {
    expect(validateEmail('max@example')).not.toBeNull()
  })

  it('rejects email with spaces', () => {
    expect(validateEmail('max @example.com')).not.toBeNull()
  })

  it('rejects empty input', () => {
    expect(validateEmail('')).not.toBeNull()
  })

  it('trims whitespace before validating', () => {
    expect(validateEmail('  max@example.com  ')).toBeNull()
  })

  it('lowercases input before validating', () => {
    expect(validateEmail('MAX@EXAMPLE.COM')).toBeNull()
  })
})

// ─── validatePassword ─────────────────────────────────────────────────────────
describe('validatePassword', () => {
  it('accepts a valid password meeting all requirements', () => {
    expect(validatePassword('Sicher1!')).toBeNull()
  })

  it('rejects password shorter than 8 characters', () => {
    expect(validatePassword('Ab1!')).not.toBeNull()
  })

  it('rejects password longer than 72 characters', () => {
    const tooLong = 'Aa1!' + 'x'.repeat(69)
    expect(validatePassword(tooLong)).not.toBeNull()
  })

  it('rejects password missing an uppercase letter', () => {
    expect(validatePassword('sicher1!')).not.toBeNull()
  })

  it('rejects password missing a lowercase letter', () => {
    expect(validatePassword('SICHER1!')).not.toBeNull()
  })

  it('rejects password missing a digit', () => {
    expect(validatePassword('Sicherheit!')).not.toBeNull()
  })

  it('rejects password missing a special character (!@#$%^&*)', () => {
    expect(validatePassword('Sicherheit1')).not.toBeNull()
  })

  it('rejects password containing spaces', () => {
    expect(validatePassword('Sicher 1!')).not.toBeNull()
  })

  it('rejects empty password', () => {
    expect(validatePassword('')).not.toBeNull()
  })
})

// ─── validateLoginPassword ────────────────────────────────────────────────────
describe('validateLoginPassword', () => {
  it('accepts a valid login password', () => {
    expect(validateLoginPassword('irgendwas1')).toBeNull()
  })

  it('rejects password shorter than 8 characters', () => {
    expect(validateLoginPassword('kurz')).not.toBeNull()
  })

  it('rejects password with spaces', () => {
    expect(validateLoginPassword('passwort mit leerzeichen')).not.toBeNull()
  })
})

// ─── validatePasswordMatch ────────────────────────────────────────────────────
describe('validatePasswordMatch', () => {
  it('returns null when both passwords are identical', () => {
    expect(validatePasswordMatch('Sicher1!', 'Sicher1!')).toBeNull()
  })

  it('returns an error when passwords differ', () => {
    expect(validatePasswordMatch('Sicher1!', 'Sicher2!')).not.toBeNull()
  })

  it('treats passwords as case-sensitive', () => {
    expect(validatePasswordMatch('Sicher1!', 'sicher1!')).not.toBeNull()
  })
})

// ─── validateName ─────────────────────────────────────────────────────────────
describe('validateName', () => {
  it('accepts a valid full name', () => {
    expect(validateName('Max Mustermann')).toBeNull()
  })

  it('accepts a name with a hyphen', () => {
    expect(validateName('Anna-Maria')).toBeNull()
  })

  it('accepts a name with German umlauts', () => {
    expect(validateName('Jörg Müller')).toBeNull()
  })

  it('rejects a name shorter than 2 characters', () => {
    expect(validateName('A')).not.toBeNull()
  })

  it('rejects a name longer than 50 characters', () => {
    expect(validateName('A'.repeat(51))).not.toBeNull()
  })

  it('rejects a name containing digits', () => {
    expect(validateName('Max123')).not.toBeNull()
  })

  it('rejects a name containing special characters', () => {
    expect(validateName('Max<script>')).not.toBeNull()
  })

  it('trims whitespace before validating', () => {
    expect(validateName('  Max  ')).toBeNull()
  })
})

// ─── getPasswordStrength ──────────────────────────────────────────────────────
describe('getPasswordStrength', () => {
  it('rates an empty string as weak', () => {
    expect(getPasswordStrength('')).toBe('weak')
  })

  it('rates a password shorter than 8 characters as weak', () => {
    expect(getPasswordStrength('Ab1!')).toBe('weak')
  })

  it('rates a password with only lowercase letters as weak', () => {
    expect(getPasswordStrength('password')).toBe('weak')
  })

  it('rates a password with upper, lower and digit as medium', () => {
    expect(getPasswordStrength('Password1')).toBe('medium')
  })

  it('rates a long password with all character types as strong', () => {
    expect(getPasswordStrength('Sicher123!@#')).toBe('strong')
  })
})

// ─── sanitizeEmail ────────────────────────────────────────────────────────────
describe('sanitizeEmail', () => {
  it('converts email to lowercase', () => {
    expect(sanitizeEmail('MAX@EXAMPLE.COM')).toBe('max@example.com')
  })

  it('trims leading and trailing whitespace', () => {
    expect(sanitizeEmail('  max@example.com  ')).toBe('max@example.com')
  })
})

// ─── sanitizeName ─────────────────────────────────────────────────────────────
describe('sanitizeName', () => {
  it('trims leading and trailing whitespace', () => {
    expect(sanitizeName('  Max Mustermann  ')).toBe('Max Mustermann')
  })
})
