import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(req: Request) {
  const payload = await getPayload({ config })
  const { name, email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ message: 'E-Mail und Passwort sind erforderlich.' }, { status: 400 })
  }

  const user = await payload.create({
    collection: 'users',
    data: {
      name,
      email,
      password,
      roles: ['user'],
    } as any,
  })

  return NextResponse.json({ message: 'Registrierung erfolgreich.', user }, { status: 201 })
}
