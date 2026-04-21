import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { sanitizeEmail, validateEmail, validateLoginPassword, validatePassword } from '@/app/lib/validation'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeMockResponse(opts: {
  status: number
  body: unknown
  setCookie?: string
}): Response {
  return {
    ok: opts.status >= 200 && opts.status < 300,
    status: opts.status,
    json: () => Promise.resolve(opts.body),
    text: () => Promise.resolve(JSON.stringify(opts.body)),
    headers: {
      get: (key: string) => (key === 'set-cookie' ? (opts.setCookie ?? null) : null),
    },
    clone() { return this },
  } as unknown as Response
}

// ─── /api/login — route handler ───────────────────────────────────────────────

describe('POST /api/login route', () => {
  const originalEnv = process.env.NEXT_PUBLIC_PAYLOAD_URL

  beforeEach(() => {
    process.env.NEXT_PUBLIC_PAYLOAD_URL = 'http://payload.test'
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    process.env.NEXT_PUBLIC_PAYLOAD_URL = originalEnv
    vi.unstubAllGlobals()
  })

  it('returns 500 when NEXT_PUBLIC_PAYLOAD_URL is not set', async () => {
    delete process.env.NEXT_PUBLIC_PAYLOAD_URL
    const { POST } = await import('./../../api/login/route')
    const req = new Request('http://localhost/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.de', password: 'Test12345' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.message).toContain('missing')
  })

  it('returns 200 and forwards Set-Cookie on successful login', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      makeMockResponse({
        status: 200,
        body: { token: 'abc', user: { email: 'test@test.de' } },
        setCookie: 'payload-token=abc; Path=/; HttpOnly',
      }),
    )
    const { POST } = await import('./../../api/login/route')
    const req = new Request('http://localhost/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.de', password: 'Test12345' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(res.headers.get('set-cookie')).toBe('payload-token=abc; Path=/; HttpOnly')
  })

  it('returns 401 with user-not-found reason when user does not exist', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      makeMockResponse({
        status: 401,
        body: { reason: 'user-not-found', message: 'No user found with that email.' },
      }),
    )
    const { POST } = await import('./../../api/login/route')
    const req = new Request('http://localhost/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ghost@test.de', password: 'Test12345' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.reason).toBe('user-not-found')
  })

  it('forwards Payload error message on wrong password', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      makeMockResponse({
        status: 401,
        body: { message: 'The password you provided is incorrect.' },
      }),
    )
    const { POST } = await import('./../../api/login/route')
    const req = new Request('http://localhost/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.de', password: 'WrongPass1!' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.message).toBe('The password you provided is incorrect.')
  })
})

// ─── Login input validation ───────────────────────────────────────────────────

describe('Login — email validation', () => {
  it('accepts a valid email', () => {
    expect(validateEmail('driver@autoshop.de')).toBeNull()
  })

  it('rejects email without @', () => {
    expect(validateEmail('notanemail')).not.toBeNull()
  })

  it('rejects email with spaces', () => {
    expect(validateEmail('user @test.de')).not.toBeNull()
  })

  it('trims and lowercases before validation', () => {
    expect(validateEmail('  DRIVER@AUTOSHOP.DE  ')).toBeNull()
  })

  it('sanitizes email to lowercase before sending', () => {
    expect(sanitizeEmail('DRIVER@AUTOSHOP.DE')).toBe('driver@autoshop.de')
  })
})

describe('Login — password validation', () => {
  it('accepts a valid login password', () => {
    expect(validateLoginPassword('Test12345')).toBeNull()
  })

  it('rejects empty password', () => {
    expect(validateLoginPassword('')).not.toBeNull()
  })

  it('rejects password shorter than 8 characters', () => {
    expect(validateLoginPassword('Ab1')).not.toBeNull()
  })

  it('rejects password containing spaces', () => {
    expect(validateLoginPassword('Test 12345')).not.toBeNull()
  })
})

// ─── Registration input validation ───────────────────────────────────────────

describe('Registration — password strength', () => {
  it('rejects password without uppercase letter', () => {
    expect(validatePassword('secure1!')).not.toBeNull()
  })

  it('rejects password without digit', () => {
    expect(validatePassword('SecurePass!')).not.toBeNull()
  })

  it('rejects password without special character', () => {
    expect(validatePassword('SecurePass1')).not.toBeNull()
  })

  it('accepts a strong password meeting all requirements', () => {
    expect(validatePassword('Secure1!')).toBeNull()
  })

  it('rejects password longer than 72 characters (bcrypt limit)', () => {
    expect(validatePassword('Aa1!' + 'x'.repeat(69))).not.toBeNull()
  })
})

// ─── Demo login credentials format ───────────────────────────────────────────

describe('Demo account credentials', () => {
  const DEMO_EMAIL = 'test@test.de'
  const DEMO_PASSWORD = 'Test12345'

  it('demo email passes format validation', () => {
    expect(validateEmail(DEMO_EMAIL)).toBeNull()
  })

  it('demo password passes login password validation', () => {
    expect(validateLoginPassword(DEMO_PASSWORD)).toBeNull()
  })

  it('demo email is already lowercase (no sanitization needed)', () => {
    expect(sanitizeEmail(DEMO_EMAIL)).toBe(DEMO_EMAIL)
  })
})
