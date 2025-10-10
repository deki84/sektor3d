// import auf Supabase Storage

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import AdmZip from 'adm-zip'
import path from 'path'
import { supabase } from '@/app/lib/supabase/supabaseServer'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'

// Benutze das Bucket wenn nicht nutze gltfmedia
const SUPABASE_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'gltfmedia'

// Supabase Einstellungen werden vom subaBaseServer übernommen
const supabase_gltf = supabase

function sanitize(p: string) {
  return path
    .normalize(p)
    .replace(/^(\.\.(\/|\\|$))+/, '')
    .replace(/^\/+/, '')
}

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const name = String(form.get('sceneName') || form.get('name') || '').trim()
    const file = (form.get('file') || form.get('zip')) as File | null
    if (!name || !file) {
      return NextResponse.json(
        { error: 'name + zip nötig' },
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }
    // Eindeutige ID für den Scene-Datensatz
    const sceneUuid = uuidv4()

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const { error: dbInsertError } = await supabase
      .from('scenes')
      .insert({
        scene_uuid: sceneUuid,
        title: name,
        slug: slug,
      })
      .select()
      .single()

    if (dbInsertError) {
      console.error('DB Insert Error:', dbInsertError)
      return NextResponse.json({ error: dbInsertError.message }, { status: 500 })
    }

    const buf = Buffer.from(await file.arrayBuffer())
    const zip = new AdmZip(buf)
    let mainGLTF: string | null = null
    const uploadedFileUrls: string[] = []

    for (const e of zip.getEntries()) {
      if (e.isDirectory) continue
      const rel = sanitize(e.entryName)
      if (!rel) continue

      if (!mainGLTF && rel.toLowerCase().endsWith('.gltf')) mainGLTF = rel // Wir bauen den Pfad für den Bucket
      const uniquePathPrefix = path.join(slug, sceneUuid)

      // Pfad Anpassung: Nutze die eindeutige ID für den Scene-Datensatz
      const filePath = path.join(uniquePathPrefix, rel).replace(/\\/g, '/')
      // Upload der Datei in den Bucket
      const { data, error } = await supabase_gltf.storage
        .from(SUPABASE_BUCKET)
        .upload(filePath, e.getData(), {
          cacheControl: '3600',
          upsert: true,
        })

      if (error) throw new Error(`Upload fehlgeschlagen: ${error.message}`)
      uploadedFileUrls.push(data.path)
    }

    if (!mainGLTF) {
      return NextResponse.json({ error: 'keine .gltf im ZIP' }, { status: 400 })
    } // Holen der öffentlichen URL für das Haupt-GLTF

    // Hole die öffentliche URL für die eindeutige ID des Scene-Datensatzes
    const uniquePathPrefix = path.join(slug, sceneUuid)
    const { data: publicUrlData } = await supabase_gltf.storage
      .from(SUPABASE_BUCKET)
      .getPublicUrl(path.join(uniquePathPrefix, mainGLTF).replace(/\\/g, '/'))

    // Aktualisiere in der DB den finalen Scene-Datensatz mit der öffentlichen URL
    const { data: finalScene, error: updateError } = await supabase
      .from('scenes')
      .update({
        cover: publicUrlData.publicUrl,
      })
      .eq('scene_uuid', sceneUuid)
      .select('scene_uuid,title,cover,slug ')
      .single()

    // Fehler Prüfung Update
    if (updateError || !finalScene) {
      console.error('DB Update Error oder Szene nicht gefunden nach Upload:', updateError)
      // Da die Dateien bereits hochgeladen sind, sollten wir hier einen Fehler werfen,
      // um den Aufrufer zu informieren.
      throw new Error(`DB Update fehlgeschlagen: Konnte Szene ${sceneUuid} nicht aktualisieren.`)
    }

    // Rückgabe des finalen Scene-Datensatzes für das Frontend
    const sceneToReturn = {
      // Die ID des Objekts, die das Frontend erwartet, ist jetzt die UUID
      scene_uuid: finalScene.scene_uuid,
      title: finalScene.title,
      cover: finalScene.cover,
      slug: finalScene.slug,
    }
    return NextResponse.json(sceneToReturn, { status: 200 })
  } catch (e: any) {
    console.error('Import Error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
