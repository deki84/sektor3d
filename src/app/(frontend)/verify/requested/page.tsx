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
            Fast fertig <span aria-hidden>✅</span>
          </h1>

          <p className="mt-1 text-sm text-slate-500">Bitte bestätige deine E-Mail-Adresse</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm space-y-5">
          <p className="text-slate-700">
            Wir haben dir eine E-Mail{' '}
            {email && <span className="font-semibold text-slate-900">an {email}</span>} geschickt.
          </p>

          <p className="text-slate-700">
            Klicke auf den Link in der E-Mail, um dein Konto zu bestätigen.
          </p>

          {/* Hinweis Box */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
            Tipp: Schau auch in Spam oder Junk nach.
          </div>

          {/* Button */}
          <Link
            href={`/login?email=${encodeURIComponent(email)}&next=${encodeURIComponent(nextUrl)}`}
            className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-500"
          >
            Zur Login-Seite
          </Link>
        </div>

        {/* Optional kleiner Footer */}
        <p className="mt-6 text-center text-xs text-slate-400">
          Wenn keine Mail ankommt, überprüfe deine Adresse oder registriere dich erneut.
        </p>
      </div>
    </div>
  )
}
