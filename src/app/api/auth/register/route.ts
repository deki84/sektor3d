import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(req: Request) {
  const payload = await getPayload({ config })
  const body = await req.json().catch(() => ({}))

  const name = String(body?.name ?? '').trim()
  const email = String(body?.email ?? '')
    .trim()
    .toLowerCase()
  const password = String(body?.password ?? '')

  if (!name) {
    return NextResponse.json({ message: 'Name is required.' }, { status: 400 })
  }

  if (!email || !email.includes('@')) {
    return NextResponse.json({ message: 'Please enter a valid email address.' }, { status: 400 })
  }

  if (!password || password.length < 8) {
    return NextResponse.json(
      { message: 'Password must be at least 8 characters.' },
      { status: 400 },
    )
  }

  try {
    const user = await payload.create({
      collection: 'users',
      data: {
        name,
        email,
        password,
        roles: ['user'],
      },
    })

    return NextResponse.json(
      { message: 'Registration successful. Please confirm your email.', user },
      { status: 201 },
    )
  } catch (err: any) {
    const first = err?.data?.errors?.[0]
    const field = first?.field
    const message = first?.message

    if (field === 'email') {
      return NextResponse.json(
        { message: message || 'Email is invalid or already registered.' },
        { status: 400 },
      )
    }

    return NextResponse.json({ message: message || 'Registration failed.' }, { status: 400 })
  }
}
