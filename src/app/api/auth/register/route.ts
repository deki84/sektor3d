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
    return NextResponse.json({ message: 'Name ist erforderlich.' }, { status: 400 })
  }

  if (!email || !email.includes('@')) {
    return NextResponse.json({ message: 'Bitte eine gültige E-Mail eingeben.' }, { status: 400 })
  }

  if (!password || password.length < 8) {
    return NextResponse.json(
      { message: 'Passwort muss mindestens 8 Zeichen haben.' },
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
      { message: 'Registrierung erfolgreich. Bitte E-Mail bestätigen.', user },
      { status: 201 },
    )
  } catch (err: any) {
    // Payload ValidationError sauber zurückgeben
    const first = err?.data?.errors?.[0]
    const field = first?.field
    const message = first?.message

    // Häufig: Email schon vergeben (unique)
    if (field === 'email') {
      return NextResponse.json(
        { message: message || 'E-Mail ist ungültig oder bereits registriert.' },
        { status: 400 },
      )
    }

    return NextResponse.json(
      { message: message || 'Registrierung fehlgeschlagen.' },
      { status: 400 },
    )
  }
}
