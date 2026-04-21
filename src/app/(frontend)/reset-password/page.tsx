// Suspense wrapper is required because ResetForm uses useSearchParams()
'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock, Loader2 } from 'lucide-react'
import {
  validatePassword,
  validatePasswordMatch,
  getPasswordStrength,
  type PasswordStrength,
} from '@/app/lib/validation'

// Strength bar — appears once the user has attempted to submit
function PasswordStrengthMeter({ password, show }: { password: string; show: boolean }) {
  if (!show || !password) return null
  const strength: PasswordStrength = getPasswordStrength(password)
  const config = {
    weak: { label: 'Weak', color: 'bg-red-400', width: 'w-1/3' },
    medium: { label: 'Medium', color: 'bg-yellow-400', width: 'w-2/3' },
    strong: { label: 'Strong', color: 'bg-green-500', width: 'w-full' },
  }[strength]

  return (
    <div className="mt-1.5 mb-1">
      <div className="h-1 w-full rounded-full bg-gray-200">
        <div
          className={`h-1 rounded-full transition-all duration-300 ${config.color} ${config.width}`}
        />
      </div>
      <p className="mt-0.5 text-xs text-slate-400">{config.label}</p>
    </div>
  )
}

// ─── Reset Form (requires Suspense because of useSearchParams) ────────────────
function ResetForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  // Tracks whether the user has clicked submit at least once
  const [submitted, setSubmitted] = useState(false)

  // Errors recomputed on every render — after submit they update live as user fixes fields
  const passwordErr = validatePassword(password)
  const confirmErr = validatePasswordMatch(password, confirm)

  const showPasswordErr = submitted ? passwordErr : null
  const showConfirmErr = submitted ? confirmErr : null

  // Button disabled only during the API call
  const canSubmit = !loading

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    if (passwordErr || confirmErr) return

    setLoading(true)
    setServerError('')
    const res = await fetch('/api/users/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })

    if (res.ok) {
      router.push('/login?reset=success')
    } else {
      setServerError('Token invalid or expired.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4fa]">
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 max-w-md w-full">
        <h2 className="text-xl font-bold text-slate-900 mb-1">Set new password</h2>
        <p className="text-slate-500 text-sm mb-6">
          Min. 8 characters, uppercase/lowercase letter, number and special character.
        </p>

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {/* New password */}
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-slate-700 mb-1">New password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                id="new-password"
                type={showPw ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-11 py-2.5 text-slate-800 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
              />
              {/* Show/hide password */}
              <button
                type="button"
                className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 transition"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {/* Strength indicator */}
            <PasswordStrengthMeter password={password} show={submitted} />
            {showPasswordErr && <p className="mt-0.5 text-xs text-red-500">{showPasswordErr}</p>}
          </div>

          {/* Confirm password */}
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700 mb-1">
              Confirm password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                id="confirm-password"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Repeat password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-11 py-2.5 text-slate-800 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
              />
              {/* Show/hide confirm password */}
              <button
                type="button"
                className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 transition"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {showConfirmErr && <p className="mt-1 text-xs text-red-500">{showConfirmErr}</p>}
          </div>

          {serverError && <p className="text-red-500 text-xs">{serverError}</p>}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Saving...' : 'Save password'}
          </button>
        </form>
      </div>
    </div>
  )
}

// Suspense required because of useSearchParams in Next.js
export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  )
}
