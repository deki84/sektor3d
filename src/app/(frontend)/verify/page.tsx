import { redirect } from 'next/navigation'

type Props = {
  searchParams?: { token?: string; next?: string }
}

export default async function VerifyPage({ searchParams }: Props) {
  const token = searchParams?.token
  const nextUrl = searchParams?.next || '/uploadPage3d'

  if (!token) {
    redirect('/login?error=missing-token')
  }

  const base = process.env.NEXT_PUBLIC_PAYLOAD_URL || 'http://localhost:3000'

  const res = await fetch(`${base}/api/users/verify/${encodeURIComponent(token!)}`, {
    method: 'POST',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
  })

  // ✅ Wenn erfolgreich → DIREKT zur UploadPage
  if (res.ok) redirect(nextUrl)

  // ✅ Fehlermeldung aus Payload lesen und zur Login-Seite mitgeben
  let details = `status-${res.status}`
  try {
    const data = await res.clone().json()
    details = data?.message || JSON.stringify(data)
  } catch {
    try {
      details = await res.text()
    } catch {}
  }

  redirect(`/login?error=verify-failed&details=${encodeURIComponent(details)}`)
}
