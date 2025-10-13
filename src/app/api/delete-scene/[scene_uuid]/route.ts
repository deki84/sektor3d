// src/app/api/delete-scene/[scene_uuid]/route.ts

import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase/supabaseServer'

const SUPABASE_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'gltfmedia'

export async function DELETE(_req: Request, ctx: { params: { scene_uuid: string } }) {
  const { scene_uuid } = await ctx.params
  const key = scene_uuid

  // 1. Hole den SLUG (für den Hybrid-Pfad)
  const { data: sceneData, error: readError } = await supabase
    .from('scenes')
    .select('slug')
    .eq('scene_uuid', key)
    .single()

  if (readError && readError.code && readError.code !== 'PGRST116') {
    console.error('Lese-Fehler beim Löschen:', readError)
    return NextResponse.json({ error: readError.message }, { status: 500 })
  }

  // Wenn die Szene nicht gefunden wurde, ist das Ziel erreicht (200 OK)
  if (!sceneData) {
    return NextResponse.json({ ok: true, message: 'Szene existierte nicht.' }, { status: 200 })
  }

  // Hybrid-Pfad konstruieren: 'slug/UUID' oder nur 'UUID'
  const slug = sceneData.slug || ''
  const storagePathPrefix = slug ? `${slug}/${key}` : key

  // 2. Storage-Löschung
  const { data: fileList, error: listError } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .list(storagePathPrefix, { limit: 100 })

  if (listError && listError.message !== 'The specified key does not exist.') {
    console.error('Supabase list Error (Storage cleanup)', listError)
    return NextResponse.json({ error: listError.message }, { status: 500 })
  }

  if (fileList && fileList.length > 0) {
    const filesToDelete = fileList.map((f) => `${storagePathPrefix}/${f.name}`)
    const { error: deleteStorageError } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .remove(filesToDelete)

    if (deleteStorageError) {
      console.error('Supabase remove error (Storage cleanup)', deleteStorageError)
      return NextResponse.json({ error: deleteStorageError.message }, { status: 500 })
    }
  }

  // 3. Datenbank-Löschung
  const { error: dbDeleteError } = await supabase.from('scenes').delete().eq('scene_uuid', key)

  if (dbDeleteError) {
    console.error('Supabase delete error:', dbDeleteError)
    return NextResponse.json(
      { error: dbDeleteError.message || 'DB-Löschfehler aufgetreten' },
      { status: 500 },
    )
  }

  // Erfolgs-Response
  return NextResponse.json({ ok: true })
}
