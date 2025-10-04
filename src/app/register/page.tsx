'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function Spinner() {
  return (
    <svg
      className="h-5 w-5 animate-spin text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}

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
      // 1) User anlegen!
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

      // 2) Auto-Login
      const login = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (login.ok) {
        router.replace(nextUrl)
      } else {
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold">Konto erstellen</h1>
          <p className="mt-1 text-sm text-slate-600">Registriere dich, um fortzufahren</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
            <input
              className="w-full rounded-xl border border-slate-300 px-3 py-2 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Max Mustermann"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">E-Mail</label>
            <input
              type="email"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="max@example.com"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Passwort</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 pr-10 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mind. 8 Zeichen"
                minLength={8}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-2 grid place-items-center rounded-md px-2 text-slate-500 hover:text-slate-700"
                onClick={() => setShowPw((v) => !v)}
                aria-label="Passwort anzeigen"
                title="Passwort anzeigen"
              >
                {showPw ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Passwort bestätigen
            </label>
            <input
              type={showPw ? 'text' : 'password'}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Nochmals eingeben"
              minLength={8}
              required
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
          >
            {loading && <Spinner />}
            <span>{loading ? 'Wird erstellt…' : 'Konto erstellen'}</span>
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          Bereits ein Konto?{' '}
          <a
            href={`/login?email=${encodeURIComponent(email || '')}&next=${encodeURIComponent(nextUrl)}`}
            className="font-medium text-blue-600 hover:underline"
          >
            Anmelden
          </a>
        </div>
      </div>
    </div>
  )
}
