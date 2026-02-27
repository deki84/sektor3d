'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react'

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

      setError(typeof data === 'string' ? data : data?.message || 'Anmeldung fehlgeschlagen.')
    } catch {
      setError('Netzwerkfehler. Bitte später erneut versuchen.')
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = email.trim() !== '' && password !== '' && !loading

  return (
    // Hintergrund: dunkler Verlauf, passend zum 3D-Thema
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-4">
      {/* Glassmorphism-Karte */}
      <div className="w-full max-w-md">

        {/* Logo & Begrüßung */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex items-center justify-center">
            <img src="./logo.png" alt="Sektor3D Logo" className="h-14 w-auto drop-shadow-lg" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Willkommen zurück</h1>
          <p className="mt-1 text-sm text-slate-400">Melden Sie sich bei Sektor Sicherheitsdienst an</p>
        </div>

        {/* Formular-Karte */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-sm ring-1 ring-white/10">
          <form className="space-y-5" onSubmit={onSubmit} aria-busy={loading}>

            {/* E-Mail Feld */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">E-Mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  autoComplete="email"
                  className="w-full rounded-xl border border-white/10 bg-white/10 pl-10 pr-4 py-2.5 text-white placeholder:text-slate-500 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="max@example.com"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Passwort Feld */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Passwort</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-white/10 bg-white/10 pl-10 pr-11 py-2.5 text-white placeholder:text-slate-500 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  aria-invalid={!!error}
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
            </div>

            {/* Fehlermeldung */}
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Submit-Button */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white shadow-lg shadow-indigo-900/30 transition hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Spinner />}
              <span>{loading ? 'Wird angemeldet…' : 'Anmelden'}</span>
            </button>
          </form>

          {/* Link zur Registrierung */}
          <div className="mt-6 text-center text-sm text-slate-400">
            Kein Konto?{' '}
            <a
              className="font-medium text-indigo-400 hover:text-indigo-300 underline-offset-4 hover:underline transition"
              href={`/register?email=${encodeURIComponent(email.trim().toLowerCase() || '')}&next=${encodeURIComponent(nextUrl)}`}
            >
              Jetzt registrieren
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
