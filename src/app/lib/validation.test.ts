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
    expect(validateEmail('john@example.com')).toBeNull()
  })

  it('accepts email with subdomain', () => {
    expect(validateEmail('john@mail.example.com')).toBeNull()
  })

  it('rejects email without @ symbol', () => {
    expect(validateEmail('johnexample.com')).not.toBeNull()
  })

  it('rejects email without domain extension', () => {
    expect(validateEmail('john@example')).not.toBeNull()
  })

  it('rejects email with spaces', () => {
    expect(validateEmail('john @example.com')).not.toBeNull()
  })

  it('rejects empty input', () => {
    expect(validateEmail('')).not.toBeNull()
  })

  it('trims whitespace before validating', () => {
    expect(validateEmail('  john@example.com  ')).toBeNull()
  })

  it('lowercases input before validating', () => {
    expect(validateEmail('JOHN@EXAMPLE.COM')).toBeNull()
  })
})

// ─── validatePassword ─────────────────────────────────────────────────────────
describe('validatePassword', () => {
  it('accepts a valid password meeting all requirements', () => {
    expect(validatePassword('Secure1!')).toBeNull()
  })

  it('rejects password shorter than 8 characters', () => {
    expect(validatePassword('Ab1!')).not.toBeNull()
  })

  it('rejects password longer than 72 characters', () => {
    const tooLong = 'Aa1!' + 'x'.repeat(69)
    expect(validatePassword(tooLong)).not.toBeNull()
  })

  it('rejects password missing an uppercase letter', () => {
    expect(validatePassword('secure1!')).not.toBeNull()
  })

  it('rejects password missing a lowercase letter', () => {
    expect(validatePassword('SECURE1!')).not.toBeNull()
  })

  it('rejects password missing a digit', () => {
    expect(validatePassword('SecurePass!')).not.toBeNull()
  })

  it('rejects password missing a special character (!@#$%^&*)', () => {
    expect(validatePassword('SecurePass1')).not.toBeNull()
  })

  it('rejects password containing spaces', () => {
    expect(validatePassword('Secure 1!')).not.toBeNull()
  })

  it('rejects empty password', () => {
    expect(validatePassword('')).not.toBeNull()
  })
})

// ─── validateLoginPassword ────────────────────────────────────────────────────
describe('validateLoginPassword', () => {
  it('accepts a valid login password', () => {
    expect(validateLoginPassword('something1')).toBeNull()
  })

  it('rejects password shorter than 8 characters', () => {
    expect(validateLoginPassword('short')).not.toBeNull()
  })

  it('rejects password with spaces', () => {
    expect(validateLoginPassword('password with spaces')).not.toBeNull()
  })
})

// ─── validatePasswordMatch ────────────────────────────────────────────────────
describe('validatePasswordMatch', () => {
  it('returns null when both passwords are identical', () => {
    expect(validatePasswordMatch('Secure1!', 'Secure1!')).toBeNull()
  })

  it('returns an error when passwords differ', () => {
    expect(validatePasswordMatch('Secure1!', 'Secure2!')).not.toBeNull()
  })

  it('treats passwords as case-sensitive', () => {
    expect(validatePasswordMatch('Secure1!', 'secure1!')).not.toBeNull()
  })
})

// ─── validateName ─────────────────────────────────────────────────────────────
describe('validateName', () => {
  it('accepts a valid full name', () => {
    expect(validateName('John Doe')).toBeNull()
  })

  it('accepts a name with a hyphen', () => {
    expect(validateName('Mary-Jane')).toBeNull()
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
    expect(validateName('John123')).not.toBeNull()
  })

  it('rejects a name containing special characters', () => {
    expect(validateName('John<script>')).not.toBeNull()
  })

  it('trims whitespace before validating', () => {
    expect(validateName('  John  ')).toBeNull()
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
    expect(getPasswordStrength('Secure123!@#')).toBe('strong')
  })
})

// ─── sanitizeEmail ────────────────────────────────────────────────────────────
describe('sanitizeEmail', () => {
  it('converts email to lowercase', () => {
    expect(sanitizeEmail('JOHN@EXAMPLE.COM')).toBe('john@example.com')
  })

  it('trims leading and trailing whitespace', () => {
    expect(sanitizeEmail('  john@example.com  ')).toBe('john@example.com')
  })
})

// ─── sanitizeName ─────────────────────────────────────────────────────────────
describe('sanitizeName', () => {
  it('trims leading and trailing whitespace', () => {
    expect(sanitizeName('  John Doe  ')).toBe('John Doe')
  })
})
