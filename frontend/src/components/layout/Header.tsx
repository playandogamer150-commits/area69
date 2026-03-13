import { Link, useNavigate } from 'react-router-dom'
import { LogOut, Menu, User as UserIcon } from 'lucide-react'
import { authService } from '@/services/auth.service'
import { getCurrentUser, hasActiveLicense } from '@/utils/session'

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const licensed = hasActiveLicense()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/[0.06] bg-neutral-950/80 px-4 backdrop-blur-2xl sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-gray-400 transition hover:bg-white/[0.04] hover:text-white lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link to="/dashboard" className="flex items-center gap-2.5">
          <img src="/area69-icon.png" alt="AREA 69" className="h-5 w-5 object-contain" />
          <span className="hidden text-sm font-bold uppercase tracking-[0.18em] text-white sm:block">AREA 69</span>
        </Link>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <div className={`flex items-center gap-1.5 rounded-full border px-3 py-1 ${licensed ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400' : 'border-white/10 bg-white/[0.04] text-gray-400'}`}>
          <div className={`h-1.5 w-1.5 rounded-full ${licensed ? 'bg-emerald-400' : 'bg-gray-500'}`} />
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] sm:text-xs">
            {licensed ? 'Licenca ativa' : 'Licenca pendente'}
          </span>
        </div>

        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 rounded-lg pl-3 text-gray-400 transition hover:text-white sm:pl-4"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.06]">
            <UserIcon className="h-4 w-4" />
          </div>
          <span className="hidden text-xs font-medium tracking-wide sm:block">{user?.name || 'Perfil'}</span>
        </button>

        <button
          onClick={() => authService.logout()}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs tracking-wide text-gray-500 transition hover:bg-red-600/[0.06] hover:text-red-400"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:block">Sair</span>
        </button>
      </div>
    </header>
  )
}
