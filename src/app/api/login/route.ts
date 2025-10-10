import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const payloadUrl = process.env.NEXT_PUBLIC_PAYLOAD_URL
  if (!payloadUrl) {
    return NextResponse.json({ message: 'NEXT_PUBLIC_PAYLOAD_URL fehlt' }, { status: 500 })
  }

  const res = await fetch(`${payloadUrl}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    redirect: 'manual',
  })

  const data = await res.json().catch(() => ({}))

  // Spezieller Hinweis für "User nicht gefunden."
  if (
    res.status === 401 &&
    (data?.reason === 'user-not-found' || data?.message?.includes('no user'))
  ) {
    return NextResponse.json(
      { reason: 'user-not-found', message: 'Nutzer nicht gefunden.' },
      { status: 401 },
    )
  }

  // Payload setzt Session im Set-Cookie → an den Browser weitergeben
  const response = NextResponse.json(data, { status: res.status })
  const setCookie = res.headers.get('set-cookie')
  if (setCookie) response.headers.set('set-cookie', setCookie)
  return response
}
