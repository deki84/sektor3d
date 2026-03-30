'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

type Props = {
  mobile?: boolean
}

export default function LogoutButton({ mobile = false }: Props) {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/users/logout', { method: 'POST' })
    router.push('/login')
  }

  if (mobile) {
    return (
      <button
        onClick={handleLogout}
        className="flex flex-col items-center gap-1 text-xs font-medium text-slate-400 transition hover:text-red-500"
      >
        <LogOut className="h-5 w-5" />
        <span>Logout</span>
      </button>
    )
  }

  return (
    <button
      onClick={handleLogout}
      className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-slate-600 font-medium shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-95"
    >
      <LogOut className="h-4 w-4 shrink-0" />
      <span>Logout</span>
    </button>
  )
}
