import Link from 'next/link'

type Props = {
  searchParams: Promise<{ email?: string; next?: string }>
}

export default async function VerifyRequestedPage({ searchParams }: Props) {
  const sp = await searchParams
  const email = sp.email ?? ''
  const nextUrl = sp.next ?? '/'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo + Headline */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex items-center justify-center">
            <img
              src="/logo.png"
              alt="Sektor3D Logo"
              className="h-14 w-auto max-w-[180px] object-contain drop-shadow-lg"
            />
          </div>

          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Almost done <span aria-hidden>✅</span>
          </h1>

          <p className="mt-1 text-sm text-slate-500">Please confirm your email address</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm space-y-5">
          <p className="text-slate-700">
            We sent you an email{' '}
            {email && <span className="font-semibold text-slate-900">to {email}</span>}.
          </p>

          <p className="text-slate-700">Click the link in the email to confirm your account.</p>

          {/* Hint Box */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
            Tip: Also check your spam or junk folder.
          </div>

          {/* Button */}
          <Link
            href={`/login?email=${encodeURIComponent(email)}&next=${encodeURIComponent(nextUrl)}`}
            className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-500"
          >
            Go to login
          </Link>
        </div>

        {/* Optional small footer */}
        <p className="mt-6 text-center text-xs text-slate-400">
          If no email arrives, check your address or register again.
        </p>
      </div>
    </div>
  )
}
