'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Eye, EyeOff, Lock, Loader2 } from 'lucide-react'
import Link from 'next/link'

function inputCls(extra = '') {
  return `w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
    focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-300
    transition ${extra}`
}

// Password validation logic
function validatePasswordLocal(pw: string): string | null {
  if (!pw) return 'Bitte Passwort eingeben'
  if (pw.length < 8) return 'Mindestens 8 Zeichen eingeben'

  // Check for uppercase, lowercase, number and special character
  const hasUpper = /[A-Z]/.test(pw)
  const hasLower = /[a-z]/.test(pw)
  const hasDigit = /\d/.test(pw)
  const hasSpecial = /[^A-Za-z0-9]/.test(pw)

  if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
    return 'Passwort: Groß-/Kleinbuchstabe, Zahl und Sonderzeichen nötig'
  }

  return null
}

// Confirm password validation
function validatePasswordMatchLocal(pw: string, confirm: string): string | null {
  if (!confirm) return 'Bitte Passwort wiederholen'
  if (pw !== confirm) return 'Passwörter stimmen nicht überein'
  return null
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  // Recalculate validation errors on every render
  const passwordErr = validatePasswordLocal(password)
  const confirmErr = validatePasswordMatchLocal(password, confirm)

  // Only show validation messages after the first submit attempt
  const showPasswordErr = submitted ? passwordErr : null
  const showConfirmErr = submitted ? confirmErr : null

  const canSubmit = !loading

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Mark form as submitted to trigger validation messages
    setSubmitted(true)

    if (passwordErr || confirmErr) return

    setLoading(true)
    setServerError('')

    const res = await fetch('/api/users/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })

    if (res.ok) router.push('/login')
    else setServerError('Token ungültig oder abgelaufen.')

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f4fa]">
      <div className="mb-8 text-center">
        <img
          src="/logo.png"
          alt="Sektor Logo"
          className="h-14 w-auto drop-shadow-lg mx-auto mb-4"
        />
        <h1 className="text-2xl font-bold text-slate-900">Neues Passwort setzen</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 px-8 py-8 w-full max-w-md">
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {/* New password input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Neues Passwort</label>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />

              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputCls('pl-10 pr-11')}
              />

              {/* Toggle password visibility */}
              <button
                type="button"
                className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 transition"
                onClick={() => setShowPw((v) => !v)}
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Validation message */}
            {showPasswordErr && <p className="mt-1 text-xs text-black">{showPasswordErr}</p>}
          </div>

          {/* Confirm password input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Wiederholen</label>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />

              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={inputCls('pl-10 pr-11')}
              />

              {/* Toggle confirm password visibility */}
              <button
                type="button"
                className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 transition"
                onClick={() => setShowConfirm((v) => !v)}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Validation message */}
            {showConfirmErr && <p className="mt-1 text-xs text-black">{showConfirmErr}</p>}
          </div>

          {/* Server error message */}
          {serverError && <p className="text-black text-xs">{serverError}</p>}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-xl py-3 text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Wird gespeichert...' : 'Passwort speichern'}
          </button>
        </form>

        <div className="text-center mt-4">
          <Link href="/login" className="text-sm text-slate-400 hover:text-slate-600">
            Zurück zum Login
          </Link>
        </div>
      </div>
    </div>
  )
}
