import Link from 'next/link'
import { LayoutDashboard, Layers } from 'lucide-react'
import LogoutButton from './LogoutButton'

type SidebarProps = {
  activePage: 'dashboard' | 'scenes'
}

export default function Sidebar({ activePage }: SidebarProps) {
  return (
    <>
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center px-4 bg-white/70 backdrop-blur md:hidden">
        <img src="/logo.png" alt="Sektor3D" className="h-7 w-auto" />
      </header>

      {/* Mobile top padding so content doesn't hide behind header */}
      <div className="h-14 md:hidden" />
      {/* Desktop Sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col bg-white border-r border-gray-200 md:flex">
        <div className="flex h-14 items-center px-5 border-b border-gray-100">
          <img src="/logo.png" alt="Sektor3D" className="h-7 w-auto" />
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          <Link
            href="/dashboard"
            aria-current={activePage === 'dashboard' ? 'page' : undefined}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activePage === 'dashboard'
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/uploadPage3d"
            aria-current={activePage === 'scenes' ? 'page' : undefined}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activePage === 'scenes'
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Layers className="h-4 w-4 shrink-0" />
            <span>Scenes</span>
          </Link>
        </nav>

        <div className="p-3 border-t border-gray-100">
          <LogoutButton />
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-gray-200 bg-white md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <Link
          href="/dashboard"
          className={`flex flex-col items-center gap-1 px-6 py-3 text-xs font-medium transition-colors ${
            activePage === 'dashboard' ? 'text-indigo-600' : 'text-slate-400'
          }`}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span>Dashboard</span>
        </Link>

        <Link
          href="/uploadPage3d"
          className={`flex flex-col items-center gap-1 px-6 py-3 text-xs font-medium transition-colors ${
            activePage === 'scenes' ? 'text-indigo-600' : 'text-slate-400'
          }`}
        >
          <Layers className="h-5 w-5" />
          <span>Scenes</span>
        </Link>

        <div className="flex flex-col items-center gap-1 px-6 py-3">
          <LogoutButton mobile />
        </div>
      </nav>

      {/* Mobile bottom padding so content doesn't hide behind nav */}
      <div className="h-16 md:hidden" />
    </>
  )
}
