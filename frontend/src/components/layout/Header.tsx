import { Link, useNavigate } from 'react-router-dom'
import { LogOut, Menu, User } from 'lucide-react'
import { authService } from '@/services/auth.service'
import { getCurrentUser, hasActiveLicense } from '@/utils/session'

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const licensed = hasActiveLicense()

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/[0.06] bg-neutral-950/80 px-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)] backdrop-blur-2xl sm:h-16 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-gray-400 transition-all hover:bg-white/[0.04] hover:text-white lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link to="/dashboard" className="flex items-center gap-2.5">
          <img src="/area69-icon.png" alt="AREA 69" className="h-5 w-5 object-contain drop-shadow-[0_0_6px_rgba(220,38,38,0.4)]" />
          <span className="hidden text-sm font-bold uppercase tracking-[0.15em] text-white sm:block">AREA 69</span>
        </Link>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <div
          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 shadow-[0_0_12px_rgba(16,185,129,0.08)] sm:px-3 ${
            licensed ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400' : 'border-white/[0.1] bg-white/[0.04] text-gray-400'
          }`}
        >
          <div className={`h-1.5 w-1.5 rounded-full ${licensed ? 'animate-pulse bg-emerald-400' : 'bg-gray-500'}`} />
          <span className="text-[10px] font-semibold uppercase tracking-wider sm:text-xs">
            {licensed ? 'Licença Ativa' : 'Licença Pendente'}
          </span>
        </div>

        <div className="flex items-center gap-2.5 border-l border-white/[0.06] pl-3 sm:pl-4">
          <button
            onClick={() => navigate('/profile')}
            className="group flex items-center gap-2 text-gray-400 transition-all hover:text-white"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors group-hover:border-red-600/25">
              <User className="h-3.5 w-3.5" />
            </div>
            <span className="hidden text-xs font-medium tracking-wide sm:block">{user?.name || 'Usuário'}</span>
          </button>

          <button
            onClick={() => authService.logout()}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs tracking-wide text-gray-500 transition-all hover:bg-red-600/[0.06] hover:text-red-400 sm:px-2.5"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:block">Sair</span>
          </button>
        </div>
      </div>
    </header>
  )
}
