'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react'

// ─── Spinner-Komponente ──────────────────────────────────────────────────────
function Spinner() {
  return <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
}

// ─── Registrierungs-Seite ─────────────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter()
  const search = useSearchParams()

  const nextUrl = search.get('next') || '/'
  const prefillEmail = search.get('email') || ''

  const [name, setName] = useState('')
  const [email, setEmail] = useState(prefillEmail)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Passwort-Validierung vor dem Request
    if (password.length < 8) {
      setError('Das Passwort muss mindestens 8 Zeichen lang sein.')
      return
    }
    if (password !== confirm) {
      setError('Passwörter stimmen nicht überein.')
      return
    }

    setLoading(true)
    try {
      // 1) Neuen User anlegen
      const reg = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const regData = await reg.json().catch(() => ({}))

      if (!reg.ok) {
        setError(regData?.message || 'Registrierung fehlgeschlagen.')
        setLoading(false)
        return
      }

      // 2) Auto-Login nach erfolgreicher Registrierung
      const login = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (login.ok) {
        router.replace(nextUrl)
      } else {
        // Fallback: zur Login-Seite mit vorgefüllter E-Mail
        router.replace(
          `/login?email=${encodeURIComponent(email)}&next=${encodeURIComponent(nextUrl)}`,
        )
      }
    } catch {
      setError('Netzwerkfehler. Bitte später erneut versuchen.')
      setLoading(false)
    }
  }

  return (
    // Hintergrund: dunkler Verlauf, konsistent mit Login-Seite
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-4 py-8">
      <div className="w-full max-w-md">

        {/* Logo & Überschrift */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex items-center justify-center">
            <img src="./logo.png" alt="Sektor3D Logo" className="h-14 w-auto drop-shadow-lg" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Konto erstellen</h1>
          <p className="mt-1 text-sm text-slate-400">Registrieren Sie sich, um fortzufahren</p>
        </div>

        {/* Formular-Karte */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-sm ring-1 ring-white/10">
          <form onSubmit={onSubmit} className="space-y-5">

            {/* Name Feld */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/10 pl-10 pr-4 py-2.5 text-white placeholder:text-slate-500 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Max Mustermann"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* E-Mail Feld */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">E-Mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  className="w-full rounded-xl border border-white/10 bg-white/10 pl-10 pr-4 py-2.5 text-white placeholder:text-slate-500 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="max@example.com"
                  required
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
                  className="w-full rounded-xl border border-white/10 bg-white/10 pl-10 pr-11 py-2.5 text-white placeholder:text-slate-500 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mind. 8 Zeichen"
                  minLength={8}
                  required
                />
                {/* Passwort ein-/ausblenden */}
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-300 transition"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label="Passwort anzeigen"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Passwort bestätigen */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Passwort bestätigen
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type={showPw ? 'text' : 'password'}
                  className="w-full rounded-xl border border-white/10 bg-white/10 pl-10 pr-4 py-2.5 text-white placeholder:text-slate-500 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Nochmals eingeben"
                  minLength={8}
                  required
                />
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
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white shadow-lg shadow-indigo-900/30 transition hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Spinner />}
              <span>{loading ? 'Wird erstellt…' : 'Konto erstellen'}</span>
            </button>
          </form>

          {/* Link zur Login-Seite */}
          <div className="mt-6 text-center text-sm text-slate-400">
            Bereits ein Konto?{' '}
            <a
              href={`/login?email=${encodeURIComponent(email || '')}&next=${encodeURIComponent(nextUrl)}`}
              className="font-medium text-indigo-400 hover:text-indigo-300 underline-offset-4 hover:underline transition"
            >
              Anmelden
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
