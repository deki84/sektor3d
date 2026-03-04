import Link from 'next/link'
import { LayoutDashboard, Layers } from 'lucide-react'
import LogoutButton from './LogoutButton'

type SidebarProps = {
  activePage: 'dashboard' | 'scenes'
}

export default function Sidebar({ activePage }: SidebarProps) {
  return (
    <aside className="hidden w-56 shrink-0 flex-col bg-white border-r border-gray-200 md:flex">
      {/* Logo */}
      <div className="flex h-14 items-center px-5 border-b border-gray-100">
        <img src="/logo.png" alt="Sektor3D" className="h-7 w-auto" />
      </div>

      {/* Navigation */}
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
          <span>Szenen</span>
        </Link>
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-gray-100">
        <LogoutButton />
      </div>
    </aside>
  )
}
