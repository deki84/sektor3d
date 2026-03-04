'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react'
import {
  validateName,
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  getPasswordStrength,
  sanitizeEmail,
  sanitizeName,
  type PasswordStrength,
} from '@/app/lib/validation'

// ─── Spinner-Komponente ──────────────────────────────────────────────────────
function Spinner() {
  return <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
}

// Strength bar — appears once the user has attempted to submit
function PasswordStrengthMeter({ password, show }: { password: string; show: boolean }) {
  if (!show || !password) return null
  const strength: PasswordStrength = getPasswordStrength(password)
  const config = {
    weak: { label: 'Schwach', color: 'bg-red-400', width: 'w-1/3' },
    medium: { label: 'Mittel', color: 'bg-yellow-400', width: 'w-2/3' },
    strong: { label: 'Stark', color: 'bg-green-500', width: 'w-full' },
  }[strength]

  return (
    <div className="mt-1.5">
      <div className="h-1 w-full rounded-full bg-gray-200">
        <div
          className={`h-1 rounded-full transition-all duration-300 ${config.color} ${config.width}`}
        />
      </div>
      <p className="mt-0.5 text-xs text-slate-400">{config.label}</p>
    </div>
  )
}

export default function RegisterClient() {
  const router = useRouter()
  const search = useSearchParams()
  const nextUrl = search.get('next') || '/'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const nameErr = validateName(name)
  const emailErr = validateEmail(email)
  const passwordErr = validatePassword(password)
  const confirmErr = validatePasswordMatch(password, confirm)

  const showNameErr = submitted ? nameErr : null
  const showEmailErr = submitted && !nameErr ? emailErr : null
  const showPasswordErr = submitted && !nameErr && !emailErr ? passwordErr : null
  const showConfirmErr = submitted && !nameErr && !emailErr && !passwordErr ? confirmErr : null

  const canSubmit = !loading

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    if (nameErr || emailErr || passwordErr || confirmErr) return

    setLoading(true)
    setServerError(null)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: sanitizeName(name),
          email: sanitizeEmail(email),
          password,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setServerError(data?.message || 'Registrierung fehlgeschlagen.')
        return
      }

      router.replace(
        `/verify/requested?email=${encodeURIComponent(sanitizeEmail(email))}&next=${encodeURIComponent(nextUrl)}`,
      )
    } catch {
      setServerError('Netzwerkfehler. Bitte später erneut versuchen.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex items-center justify-center">
            <img src="./logo.png" alt="Sektor3D Logo" className="h-14 w-auto drop-shadow-lg" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Konto erstellen</h1>
          <p className="mt-1 text-sm text-slate-500">Registrieren Sie sich, um fortzufahren</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <form onSubmit={onSubmit} noValidate className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-slate-800 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Max Mustermann"
                  autoFocus
                />
              </div>
              {showNameErr && <p className="mt-1 text-xs text-slate-900">{showNameErr}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">E-Mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-slate-800 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="max@example.com"
                />
              </div>
              {showEmailErr && <p className="mt-1 text-xs text-slate-900">{showEmailErr}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Passwort</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type={showPw ? 'text' : 'password'}
                  className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-11 py-2.5 text-slate-800 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mind. 8 Zeichen"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 transition"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? 'Passwort verbergen' : 'Passwort anzeigen'}
                  aria-pressed={showPw}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <PasswordStrengthMeter password={password} show={submitted} />
              {showPasswordErr && <p className="mt-1 text-xs text-slate-900">{showPasswordErr}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Passwort bestätigen
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-11 py-2.5 text-slate-800 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Nochmals eingeben"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 transition"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? 'Passwort verbergen' : 'Passwort anzeigen'}
                  aria-pressed={showConfirm}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {showConfirmErr && <p className="mt-1 text-xs text-slate-900">{showConfirmErr}</p>}
            </div>

            {serverError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Spinner />}
              <span>{loading ? 'Wird erstellt…' : 'Konto erstellen'}</span>
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            Bereits ein Konto?{' '}
            <a
              href={`/login?email=${encodeURIComponent(sanitizeEmail(email) || '')}&next=${encodeURIComponent(nextUrl)}`}
              className="font-medium text-indigo-600 hover:text-indigo-500 underline-offset-4 hover:underline transition"
            >
              Anmelden
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
