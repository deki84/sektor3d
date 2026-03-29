'use client'

import { useState } from 'react'
import { Mail, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { validateEmail, sanitizeEmail } from '@/app/lib/validation'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const emailErr = validateEmail(email)
  const showEmailErr = submitted ? emailErr : null
  const canSubmit = !loading

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    if (emailErr) return

    setLoading(true)
    setServerError('')
    try {
      const res = await fetch('/api/users/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: sanitizeEmail(email) }),
      })
      if (res.ok) setSent(true)
      else setServerError('Could not send email.')
    } catch {
      setServerError('Network error. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f4fa]">
        <div className="mb-8 text-center">
          <img
            src="/logo.png"
            alt="Sektor Logo"
            className="h-14 w-auto drop-shadow-lg mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-slate-900">Email sent ✓</h1>
        </div>
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 max-w-md w-full text-center">
          <p className="text-slate-500 text-sm mb-6">
            If an account with this email exists, you will receive a reset link.
          </p>
          <Link href="/login" className="text-indigo-600 text-sm hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f4fa]">
      <div className="mb-8 text-center">
        <img
          src="/logo.png"
          alt="Sektor Logo"
          className="h-14 w-auto drop-shadow-lg mx-auto mb-4"
        />
        <h1 className="text-2xl font-bold text-slate-900">Reset password</h1>
        <p className="text-slate-500 text-sm mt-1">
          Enter your email and we'll send you a reset link.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 max-w-md w-full">
        <form onSubmit={onSubmit} noValidate>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <div className="relative mb-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="max@example.com"
              className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
            />
          </div>
          {showEmailErr && <p className="mb-3 text-xs text-slate-900">{showEmailErr}</p>}
          {!showEmailErr && <div className="mb-4" />}

          {serverError && <p className="text-slate-900 text-xs mb-3">{serverError}</p>}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        <div className="text-center mt-4">
          <Link href="/login" className="text-sm text-slate-400 hover:text-slate-600">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
