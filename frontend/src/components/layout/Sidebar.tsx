import { NavLink } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Home, Image, RefreshCcw, Settings, User, Video, Wand2, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { getCurrentUser, hasActiveLicense } from '@/utils/session'

interface NavigationItem {
  name: string
  href: string
  icon: typeof Home
  badge?: string
  disabled?: boolean
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Criar Identidade', href: '/identity', icon: User },
  { name: 'Gerar Imagem', href: '/generate', icon: Image },
  { name: 'Editar Imagem', href: '/edit-image', icon: Wand2 },
  { name: 'Face Swap', href: '/faceswap', icon: RefreshCcw, badge: 'EM BREVE', disabled: true },
  { name: 'Gerar Video', href: '/video', icon: Video, badge: 'EM BREVE', disabled: true },
  { name: 'Galeria', href: '/gallery', icon: Image },
  { name: 'Perfil', href: '/profile', icon: Settings },
]

interface SidebarProps {
  collapsed: boolean
  mobileOpen: boolean
  onToggle: () => void
  onMobileClose: () => void
}

export function Sidebar({ collapsed, mobileOpen, onToggle, onMobileClose }: SidebarProps) {
  const licensed = hasActiveLicense()
  const user = getCurrentUser()
  const licenseRoutes = ['/identity', '/generate', '/edit-image', '/gallery']

  const content = (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/[0.06] p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-red-600/20 bg-gradient-to-br from-red-600/20 to-red-900/30 shadow-[0_0_18px_rgba(220,38,38,0.12)]">
            <img src="/area69-icon.png" alt="AREA 69" className="h-7 w-7 object-contain" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-sm font-bold uppercase tracking-[0.14em] text-white">AREA 69</div>
              <div className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Private AI Visual Studio</div>
            </div>
          )}
        </div>

        {!collapsed && (
          <div className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <div className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Conta atual</div>
            <div className="mt-1 truncate text-sm font-semibold text-white">{user?.email || 'Sem sessao'}</div>
            <div className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] ${licensed ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-white/[0.08] bg-white/[0.04] text-gray-400'}`}>
              {licensed ? 'Licenca ativa' : 'Ative sua chave'}
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2.5 py-3">
        {navigation.map((item) => {
          const isLicenseLocked = !licensed && licenseRoutes.includes(item.href)

          if (item.disabled || isLicenseLocked) {
            return (
              <div
                key={item.name}
                className={cn(
                  'relative flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm opacity-50',
                  collapsed ? 'justify-center' : '',
                  'cursor-not-allowed border-white/[0.06] bg-white/[0.02] text-gray-500',
                )}
              >
                <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
                {!collapsed && (
                  <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                    <span className="truncate text-[13px]">{item.name}</span>
                    <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.2em]">
                      {item.badge || 'BLOQUEADO'}
                    </span>
                  </div>
                )}
              </div>
            )
          }

          return (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={onMobileClose}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-all duration-200',
                  collapsed ? 'justify-center' : '',
                  isActive
                    ? 'border-red-600/25 bg-red-600/15 text-white shadow-[0_0_18px_rgba(220,38,38,0.08)]'
                    : 'border-transparent text-gray-400 hover:border-white/[0.08] hover:bg-white/[0.04] hover:text-white',
                )
              }
            >
              <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
              {!collapsed && <span className="truncate text-[13px] font-medium">{item.name}</span>}
            </NavLink>
          )
        })}
      </nav>

      <div className="hidden border-t border-white/[0.06] p-3 lg:block">
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs tracking-wide text-gray-500 transition hover:bg-white/[0.04] hover:text-gray-300"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span>Recolher</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm lg:hidden" onClick={onMobileClose} />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[260px] border-r border-white/[0.06] bg-neutral-950/95 backdrop-blur-2xl shadow-[6px_0_30px_rgba(0,0,0,0.55)] transition-transform duration-300 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <button
          onClick={onMobileClose}
          className="absolute right-4 top-4 rounded-lg bg-white/[0.04] p-1.5 text-gray-400 transition hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
        {content}
      </aside>

      <aside
        className={cn(
          'hidden h-screen flex-shrink-0 flex-col border-r border-white/[0.06] bg-neutral-950/80 backdrop-blur-2xl shadow-[6px_0_30px_rgba(0,0,0,0.35)] lg:flex',
          collapsed ? 'w-[76px]' : 'w-[260px]',
        )}
      >
        {content}
      </aside>
    </>
  )
}
