import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { email } = await req.json()

  const base = process.env.NEXT_PUBLIC_PAYLOAD_URL || 'http://localhost:3000'

  // Payload's forgot-password aufrufen
  const res = await fetch(`${base}/api/users/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })

  return NextResponse.json({ ok: res.ok })
}
