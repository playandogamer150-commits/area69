import { NavLink } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  GalleryHorizontalEnd,
  Image,
  LayoutDashboard,
  User,
  X,
} from 'lucide-react'
import { canUseImageEdit, getCurrentUser, getTrialEditCreditsRemaining, hasActiveLicense } from '@/utils/session'

interface SidebarProps {
  collapsed: boolean
  mobileOpen: boolean
  onToggle: () => void
  onMobileClose: () => void
}

interface NavItem {
  label: string
  icon: typeof LayoutDashboard
  path: string
  badge?: string
  disabled?: boolean
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Gerar Imagem', icon: Image, path: '/generate' },
  { label: 'Editar Imagem', icon: Edit, path: '/edit-image' },
  { label: 'Galeria', icon: GalleryHorizontalEnd, path: '/gallery' },
  { label: 'Perfil', icon: User, path: '/profile' },
]

function navTourId(path: string) {
  if (path === '/dashboard') return 'nav-dashboard'
  if (path === '/generate') return 'nav-generate'
  if (path === '/edit-image') return 'nav-edit-image'
  if (path === '/gallery') return 'nav-gallery'
  if (path === '/profile') return 'nav-profile'
  return undefined
}

export function Sidebar({ collapsed, mobileOpen, onToggle, onMobileClose }: SidebarProps) {
  const licensed = hasActiveLicense()
  const canEditImage = canUseImageEdit()
  const trialEditCredits = getTrialEditCreditsRemaining()
  const user = getCurrentUser()
  const blockedRoutes = new Set(['/generate', '/gallery'])

  const profileLabel = licensed
    ? 'Licenca e Perfil'
    : canEditImage
      ? `${trialEditCredits} edicao${trialEditCredits === 1 ? '' : 'es'} gratis`
      : 'Ative sua licenca'

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/[0.06] p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-red-600/20 bg-gradient-to-br from-red-600/20 to-red-900/30 shadow-[0_2px_12px_rgba(220,38,38,0.15),inset_0_1px_0_rgba(255,255,255,0.06)]">
              <img src="/area69-icon.png" alt="AREA 69" className="h-7 w-7 object-contain drop-shadow-[0_0_8px_rgba(220,38,38,0.4)]" />
            </div>
          </div>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="overflow-hidden">
              <div className="text-sm font-bold tracking-wide text-white">AREA 69</div>
              <div className="text-[10px] uppercase tracking-wider text-gray-500">Private AI Visual Studio</div>
            </motion.div>
          )}
        </div>

        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
            <NavLink
              to="/profile"
              data-tour="profile-access"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-600/25 bg-red-600/10 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-red-400 shadow-[0_2px_8px_rgba(220,38,38,0.08),inset_0_1px_0_rgba(255,255,255,0.03)] transition-all hover:bg-red-600/15"
            >
              {profileLabel}
            </NavLink>
          </motion.div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2.5 py-3">
        {navItems.map((item) => {
          const locked = item.path === '/edit-image' ? !canEditImage : !licensed && blockedRoutes.has(item.path)

          if (item.disabled || locked) {
            return (
              <div
                key={item.path}
                data-tour={navTourId(item.path)}
                className={`flex cursor-not-allowed items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-sm opacity-50 ${
                  collapsed ? 'justify-center' : ''
                }`}
              >
                <item.icon className="h-[18px] w-[18px] flex-shrink-0 text-gray-500" />
                {!collapsed && (
                  <div className="flex min-w-0 flex-1 items-center justify-between">
                    <span className="truncate text-[13px] text-gray-500">{item.label}</span>
                    <span className="ml-2 flex-shrink-0 rounded bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-gray-500">
                      {item.badge || 'BLOQUEADO'}
                    </span>
                  </div>
                )}
              </div>
            )
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              data-tour={navTourId(item.path)}
              onClick={onMobileClose}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-all duration-200 ${
                  collapsed ? 'justify-center' : ''
                } ${
                  isActive
                    ? 'border-red-600/25 bg-red-600/15 text-white shadow-[0_2px_12px_rgba(220,38,38,0.1),inset_0_1px_0_rgba(255,255,255,0.04)]'
                    : 'border-transparent text-gray-400 hover:border-white/[0.08] hover:bg-white/[0.04] hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-red-500 shadow-[0_0_8px_rgba(220,38,38,0.5)]"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <item.icon
                    className={`h-[18px] w-[18px] flex-shrink-0 ${
                      isActive ? 'text-red-500 drop-shadow-[0_0_4px_rgba(220,38,38,0.4)]' : 'text-gray-500 group-hover:text-gray-300'
                    }`}
                  />
                  {!collapsed && <span className="truncate text-[13px] font-medium">{item.label}</span>}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      {!collapsed && (
        <div className="px-4 pb-3 text-[11px] leading-relaxed text-gray-600">
          {user?.email ? `Conectado como ${user.email}` : 'Sessao ativa'}
        </div>
      )}

      <div className="hidden border-t border-white/[0.06] p-3 lg:block">
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs text-gray-500 transition-all hover:bg-white/[0.04] hover:text-gray-300"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span className="tracking-wide">Recolher</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={onMobileClose} />}

      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: mobileOpen ? 0 : -280 }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        className="fixed bottom-0 left-0 top-0 z-50 w-[260px] border-r border-white/[0.06] bg-neutral-950/95 shadow-[4px_0_30px_rgba(0,0,0,0.6)] backdrop-blur-2xl lg:hidden"
      >
        <button
          onClick={onMobileClose}
          className="absolute right-4 top-4 z-50 rounded-lg bg-white/[0.04] p-1.5 text-gray-400 transition-colors hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
        {sidebarContent}
      </motion.aside>

      <aside
        className={`hidden sticky top-0 h-screen flex-shrink-0 flex-col border-r border-white/[0.06] bg-neutral-950/80 shadow-[4px_0_30px_rgba(0,0,0,0.4)] backdrop-blur-2xl lg:flex ${
          collapsed ? 'w-[68px]' : 'w-[240px]'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
