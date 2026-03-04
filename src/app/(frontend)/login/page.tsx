'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react'
import Link from 'next/link'
import { validateEmail, validateLoginPassword, sanitizeEmail } from '@/app/lib/validation'

// ─── Spinner-Komponente ──────────────────────────────────────────────────────
function Spinner() {
  return <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
}

// ─── Login-Seite ─────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter()
  const search = useSearchParams()
  const nextUrl = search.get('next') || '/uploadPage3d'
  const prefill = search.get('email') || ''

  const [email, setEmail] = useState(prefill)
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  // Tracks whether the user has clicked submit at least once
  const [submitted, setSubmitted] = useState(false)

  // Errors recomputed on every render — after submit they update live as user fixes fields
  const emailErr = validateEmail(email)
  const passwordErr = validateLoginPassword(password)

  // Only the first failing field (top to bottom) reveals its error at a time
  const showEmailErr    = submitted ? emailErr : null
  const showPasswordErr = submitted && !emailErr ? passwordErr : null

  // Button is disabled only while the API call is in flight, never due to validation
  const canSubmit = !loading

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    // Bail before the API call if there are client-side errors
    if (emailErr || passwordErr) return

    setLoading(true)
    setServerError(null)

    try {
      // Sanitize before sending – trim + lowercase email
      const payload = {
        email: sanitizeEmail(email),
        password,
      }

      // Login-Request an die API-Route
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        router.replace(nextUrl)
        return
      }

      // Robuste Fehlerbehandlung – JSON oder Plain Text
      let data: any = {}
      try {
        data = await res.clone().json()
      } catch {
        data = await res.text()
      }

      // Unbekannter User → zur Registrierung weiterleiten
      if (
        (res.status === 401 || res.status === 404) &&
        typeof data === 'object' &&
        data?.reason === 'user-not-found'
      ) {
        router.replace(
          `/register?email=${encodeURIComponent(payload.email)}&next=${encodeURIComponent(nextUrl)}`,
        )
        return
      }

      setServerError(typeof data === 'string' ? data : data?.message || 'Anmeldung fehlgeschlagen.')
    } catch {
      setServerError('Netzwerkfehler. Bitte später erneut versuchen.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo & Begrüßung */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex items-center justify-center">
            <img src="./logo.png" alt="Sektor3D Logo" className="h-14 w-auto drop-shadow-lg" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Willkommen zurück</h1>
          <p className="mt-1 text-sm text-slate-500">Melden Sie sich beim Sektor an</p>
        </div>

        {/* Formular-Karte */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-sm ring-1 ring-white/10">
          <form className="space-y-5" onSubmit={onSubmit} noValidate aria-busy={loading}>
            {/* E-Mail Feld */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">E-Mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                <input
                  type="email"
                  autoComplete="email"
                  className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-slate-800 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="max@example.com"
                  autoFocus
                />
              </div>
              {showEmailErr && <p className="mt-1 text-xs text-slate-900">{showEmailErr}</p>}
            </div>

            {/* Passwort Feld */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Passwort</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-11 py-2.5 text-slate-800 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                {/* Passwort ein-/ausblenden */}
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-300 transition"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? 'Passwort verbergen' : 'Passwort anzeigen'}
                  aria-pressed={showPw}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {showPasswordErr && <p className="mt-1 text-xs text-slate-900">{showPasswordErr}</p>}
            </div>

            {/* Server-Fehlermeldung */}
            {serverError && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {serverError}
              </div>
            )}

            {/* Submit-Button – disabled only during loading */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white shadow-lg shadow-indigo-900/30 transition hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Spinner />}
              <span>{loading ? 'Wird angemeldet…' : 'Anmelden'}</span>
            </button>

            <div className="text-center mt-2">
              <Link
                href="/forgot-password"
                className="text-sm text-slate-500 hover:text-indigo-600 transition-colors"
              >
                Passwort vergessen?
              </Link>
            </div>
          </form>

          {/* Link zur Registrierung */}
          <div className="mt-6 text-center text-sm text-slate-400">
            Kein Konto?{' '}
            <a
              className="font-medium text-indigo-400 hover:text-indigo-300 underline-offset-4 hover:underline transition"
              href={`/register?email=${encodeURIComponent(sanitizeEmail(email) || '')}&next=${encodeURIComponent(nextUrl)}`}
            >
              Jetzt registrieren
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
