import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const payloadUrl = process.env.NEXT_PUBLIC_PAYLOAD_URL
  if (!payloadUrl) {
    return NextResponse.json({ message: 'NEXT_PUBLIC_PAYLOAD_URL is missing' }, { status: 500 })
  }

  const res = await fetch(`${payloadUrl}/api/users/login`, {
    // ← this is required
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    redirect: 'manual',
  })

  const data = await res.json().catch(() => ({}))

  // Special case for "user not found"
  if (
    res.status === 401 &&
    (data?.reason === 'user-not-found' || data?.message?.includes('no user'))
  ) {
    return NextResponse.json(
      { reason: 'user-not-found', message: 'User not found.' },
      { status: 401 },
    )
  }

  // Payload sets session in Set-Cookie → forward to the browser
  const response = NextResponse.json(data, { status: res.status })
  const setCookie = res.headers.get('set-cookie')
  if (setCookie) response.headers.set('set-cookie', setCookie)
  return response
}
