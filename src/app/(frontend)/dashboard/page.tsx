import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { Plus, ArrowRight, Layers } from 'lucide-react'
import Link from 'next/link'
import Sidebar from '@/app/components/Sidebar'
import SceneCard from '@/app/components/SceneCard'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Scene = {
  scene_uuid?: string
  title: string
  cover?: string
  gltfFileUrl?: string
}

async function getData() {
  const payload = await getPayload({ config: configPromise })
  const requestHeaders = await getHeaders()
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user) redirect('/login')

  const result = await payload.find({
    collection: 'scenes',
    where: { createdBy: { equals: user.id } },
    overrideAccess: true,
    req: { headers: requestHeaders } as any,
  })
  const scenes: Scene[] = result.docs as unknown as Scene[]

  return { user, scenes }
}

export default async function DashboardPage() {
  const { user, scenes } = await getData()
  const recent = scenes.slice(0, 3)

  return (
    <div className="flex h-screen bg-[#f0f4fa] overflow-hidden">
      <Sidebar activePage="dashboard" />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-10">
          {/* Heading */}
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-8">Dashboard</h1>

          {/* Account */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
              Account
            </h2>
            <div className="flex items-center gap-6 text-sm text-slate-700">
              <span>
                <span className="text-slate-400 mr-1">Name:</span>
                <span className="font-medium">{user.name ?? '—'}</span>
              </span>
              <span>
                <span className="text-slate-400 mr-1">E-Mail:</span>
                <span className="font-medium">{user.email}</span>
              </span>
            </div>
          </section>

          {/* Stats */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
              Übersicht
            </h2>
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-500" />
              <span className="text-slate-700 text-sm">
                <span className="font-semibold text-slate-900 text-lg">{scenes.length}</span> Szene
                {scenes.length !== 1 ? 'n' : ''} gespeichert
              </span>
            </div>
          </section>

          {/* Recent scenes */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Letzte Szenen
              </h2>

              <Link
                href="/uploadPage3d"
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-500 transition-colors"
              >
                Alle anzeigen <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {recent.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">
                Noch keine Szenen vorhanden.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {recent.map((scene, i) => (
                  <div
                    key={scene.scene_uuid ?? i}
                    className="group relative rounded-xl overflow-hidden border border-gray-100 bg-slate-50"
                  >
                    {/* Thumbnail */}
                    <SceneCard showActions={false} scene={scene} />

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Link
                        href={
                          scene.gltfFileUrl
                            ? `/viewer?scene_uuid=${encodeURIComponent(scene.scene_uuid ?? '')}&gltfFileUrl=${encodeURIComponent(scene.gltfFileUrl)}`
                            : '#'
                        }
                        className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-indigo-50 transition"
                      >
                        Öffnen
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
