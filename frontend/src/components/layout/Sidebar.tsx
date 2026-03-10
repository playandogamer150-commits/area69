import { NavLink } from 'react-router-dom'
import { cn } from '@/utils/cn'
import { Home, User, Image, RefreshCcw, Video, Settings, Wand2 } from 'lucide-react'
import { getCurrentUser, hasActiveLicense } from '@/utils/session'

interface NavigationItem {
  name: string
  href: string
  icon: typeof Home
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Criar Identidade', href: '/identity', icon: User },
  { name: 'Gerar Imagem', href: '/generate', icon: Image },
  { name: 'Editar Imagem', href: '/edit-image', icon: Wand2 },
  { name: 'Face Swap', href: '/faceswap', icon: RefreshCcw },
  { name: 'Gerar Vídeo', href: '/video', icon: Video },
  { name: 'Galeria', href: '/gallery', icon: Image },
  { name: 'Perfil', href: '/profile', icon: Settings },
]

export function Sidebar() {
  const licensed = hasActiveLicense()
  const user = getCurrentUser()
  const comingSoonRoutes = ['/faceswap', '/video']
  const licenseRoutes = ['/identity', '/generate', '/edit-image', '/gallery']

  return (
    <aside className="w-64 bg-background border-r min-h-screen p-4">
      <div className="mb-8 flex flex-col items-center gap-4 px-2 pt-2">
        <div className="w-full rounded-2xl bg-[#090909] px-4 py-5 flex items-center justify-center shadow-[0_18px_50px_rgba(255,40,40,0.12)] border border-white/5">
        <img
          src="/area69-icon.png"
          alt="AREA 69"
          className="h-36 w-36 object-contain scale-[1.18] drop-shadow-[0_0_30px_rgba(255,59,59,0.5)]"
        />
        </div>
        <p className="text-xs text-muted-foreground text-center">Private AI Visual Studio</p>
        <div className={cn('rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.18em] border', licensed ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground border-border')}>
          {licensed ? `Licenca ${user?.licensePlan || 'ativa'}` : 'Licenca inativa'}
        </div>
      </div>
      
      <nav className="space-y-1">
        {navigation.map((item) => {
          if (comingSoonRoutes.includes(item.href)) {
            return (
              <div
                key={item.name}
                className="relative flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-muted-foreground/60 bg-muted/40 cursor-not-allowed select-none border border-border/50"
                aria-disabled="true"
              >
                <item.icon className="w-5 h-5" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span>{item.name}</span>
                  <span className="text-[10px] text-muted-foreground/80">Recurso bloqueado</span>
                </div>
                <span className="absolute -top-2 right-2 rounded-full border border-border/60 bg-background px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-foreground shadow-sm">
                  Em breve
                </span>
              </div>
            )
          }

          const isLicenseLocked = !licensed && licenseRoutes.includes(item.href)

          if (isLicenseLocked) {
            return (
              <div
                key={item.name}
                className="relative flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-muted-foreground/60 bg-muted/30 cursor-not-allowed select-none border border-border/40"
                aria-disabled="true"
              >
                <item.icon className="w-5 h-5" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span>{item.name}</span>
                  <span className="text-[10px] text-muted-foreground/80">Ative sua licenca</span>
                </div>
                <span className="absolute -top-2 right-2 rounded-full border border-border/60 bg-background px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-foreground shadow-sm">
                  Bloqueado
                </span>
              </div>
            )
          }

          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
