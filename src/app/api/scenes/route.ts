import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase/supabaseServer'

// Handler für GET-Anfragen: Holt alle Szenen
export async function GET() {
  const { data, error } = await supabase.from('scenes').select('*')

  if (error) {
    console.error('Supabase-Fehler beim Abrufen der Szenen:', error)
    return NextResponse.json({ error: 'Failed to fetch scenes' }, { status: 500 })
  }
  return NextResponse.json(data)
}

// Handler für POST-Anfragen: Speichert eine neue Szene
export async function POST(request: Request) {
  try {
    const { title, cover } = await request.json()

    const { data, error } = await supabase.from('scenes').insert({ title, cover }).select().single()

    if (error) {
      console.error('Supabase-Fehler', error)
      return NextResponse.json({ error }, { status: 500 })
    }
    return NextResponse.json(data, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 400 })
  }
}
