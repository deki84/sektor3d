'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const search = useSearchParams()
  const nextUrl = search.get('next') || '/uploadPage3ds'
  const prefill = search.get('email') || ''

  const [email, setEmail] = useState(prefill)
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError(null)

    try {
      const payload = {
        email: email.trim().toLowerCase(),
        password: password,
      }

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

      // robustere Fehlermeldung (JSON oder Text!)
      let data: any = {}
      try {
        data = await res.clone().json()
      } catch {
        data = await res.text()
      }

      if (
        (res.status === 401 || res.status === 404) &&
        typeof data === 'object' &&
        data?.reason === 'user-not-found'
      ) {
        router.replace(
          `/register?email=${encodeURIComponent(payload.email)}&next=${encodeURIComponent(
            nextUrl,
          )}`,
        )
        return
      }

      setError(typeof data === 'string' ? data : data?.message || 'Anmeldung fehlgeschlagen.')
    } catch {
      setError('Netzwerkfehler. Bitte später erneut versuchen.')
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = email.trim() !== '' && password !== '' && !loading

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex items-center justify-center">
            <img src="./logo.png" alt="Logo" className="h-12 w-auto" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Anmelden</h1>
          <p className="mt-1 text-sm text-slate-600">
            Willkommen zurück bei Sektor Sicherheitsdienst
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-black/5">
          <form className="space-y-4" onSubmit={onSubmit} aria-busy={loading}>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">E-Mail</label>
              <input
                type="email"
                autoComplete="email"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="max@example.com"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Passwort</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 pr-10 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  aria-invalid={!!error}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-2 grid place-items-center rounded-md px-2 text-slate-500 hover:text-slate-700"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? 'Passwort verbergen' : 'Passwort anzeigen'}
                  aria-pressed={showPw}
                >
                  {showPw ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              <div className="mt-2 text-right">
                <a href="/forgot-password" className="text-xs text-slate-600 hover:underline"></a>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 font-medium text-white shadow-sm transition hover:opacity-95 disabled:opacity-60"
            >
              {loading && <Spinner />}
              <span>{loading ? 'Wird angemeldet…' : 'Anmelden'}</span>
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-slate-600">
            Kein Konto?{' '}
            <a
              className="font-medium text-blue-600 underline-offset-4 hover:underline"
              href={`/register?email=${encodeURIComponent(
                email.trim().toLowerCase() || '',
              )}&next=${encodeURIComponent(nextUrl)}`}
            >
              Jetzt registrieren
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
