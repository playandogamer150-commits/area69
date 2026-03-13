import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, Clock3, Image, RefreshCcw, Sparkles, User, Video, Wand2 } from 'lucide-react'
import { userService } from '@/services/user.service'
import { useCurrentUserId } from '@/hooks/useCurrentUserId'
import type { DashboardActivityItem, DashboardStatsResponse } from '@/types/api.types'
import { hasActiveLicense } from '@/utils/session'

const emptyStats: DashboardStatsResponse = {
  identities: 0,
  imagesToday: 0,
  generatedImagesToday: 0,
  editedImagesToday: 0,
  faceSwapsToday: 0,
  videosToday: 0,
  recentActivity: [],
}

const quickActions = [
  { label: 'Criar Nova Identidade', href: '/identity', icon: User, primary: true },
  { label: 'Gerar Imagem', href: '/generate', icon: Image, primary: false },
  { label: 'Face Swap', href: '/faceswap', icon: RefreshCcw, primary: false, disabled: true },
]

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStatsResponse>(emptyStats)
  const userId = useCurrentUserId()
  const licensed = hasActiveLicense()

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await userService.getDashboardStats(userId)
        setStats(response)
      } catch {
        setStats(emptyStats)
      }
    }

    loadStats()
    const interval = window.setInterval(loadStats, 15000)
    return () => window.clearInterval(interval)
  }, [userId])

  const statCards = [
    { label: 'Identidades', value: stats.identities, sub: 'LoRAs treinadas', icon: User },
    { label: 'Imagens', value: stats.imagesToday, sub: 'Total de hoje', icon: Image },
    { label: 'Geracoes', value: stats.generatedImagesToday, sub: 'Geracao normal hoje', icon: Sparkles },
    { label: 'Editadas', value: stats.editedImagesToday, sub: 'Edicoes de hoje', icon: Wand2 },
    { label: 'Face Swaps', value: stats.faceSwapsToday, sub: 'Realizados hoje', icon: RefreshCcw },
    { label: 'Videos', value: stats.videosToday, sub: 'Gerados hoje', icon: Video },
  ]

  const activityIcon = (type: string) => {
    switch (type) {
      case 'identity':
        return <User className="h-4 w-4" />
      case 'image_edit':
        return <Wand2 className="h-4 w-4" />
      case 'image':
        return <Image className="h-4 w-4" />
      case 'video':
        return <Video className="h-4 w-4" />
      default:
        return <Sparkles className="h-4 w-4" />
    }
  }

  const activityLabel = (item: DashboardActivityItem) => {
    if (item.type === 'identity') return 'Nova identidade'
    if (item.type === 'image_edit') return 'Imagem editada'
    if (item.type === 'image') return 'Imagem gerada'
    return 'Atividade'
  }

  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm tracking-wide text-gray-500">Bem-vindo ao AREA 69</p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-4 shadow-[0_4px_18px_rgba(0,0,0,0.35)] transition hover:-translate-y-0.5 hover:border-white/[0.12]"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium tracking-wide text-gray-400">{stat.label}</span>
              <stat.icon className="h-4 w-4 text-gray-600" />
            </div>
            <div className="text-3xl font-bold">{stat.value}</div>
            <p className="mt-1 text-[11px] text-gray-600">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {quickActions.map((action) => {
          const className = action.primary
            ? 'bg-primary text-white shadow-[0_8px_24px_rgba(220,38,38,0.28)] hover:bg-red-700'
            : 'border border-white/[0.08] bg-white/[0.03] text-gray-300 hover:border-white/[0.15] hover:bg-white/[0.05] hover:text-white'

          const content = (
            <div
              className={`flex items-center justify-center gap-2.5 rounded-xl px-6 py-4 text-sm font-semibold tracking-wide transition ${
                action.disabled ? 'cursor-not-allowed border border-white/[0.06] bg-white/[0.02] text-gray-500 opacity-45' : className
              }`}
            >
              <action.icon className="h-4 w-4" />
              <span>{action.label}</span>
            </div>
          )

          if (action.disabled || (!licensed && action.href !== '/dashboard')) {
            return <div key={action.label}>{content}</div>
          }

          return (
            <Link key={action.label} to={action.href}>
              {content}
            </Link>
          )
        })}
      </div>

      {!licensed && (
        <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-primary">Ative sua licenca para liberar as ferramentas</p>
            <p className="mt-1 text-sm text-gray-400">Seu cadastro ja esta pronto. O proximo passo e ativar a chave na pagina de perfil.</p>
          </div>
          <Link
            to="/profile"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(220,38,38,0.28)]"
          >
            Ativar licenca
          </Link>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-white/[0.01] shadow-[0_8px_28px_rgba(0,0,0,0.35)]">
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-5 py-4 sm:px-6">
          <Activity className="h-5 w-5 text-primary" />
          <h2 className="text-base font-bold tracking-wide">Atividade Recente</h2>
        </div>

        {stats.recentActivity.length > 0 ? (
          <div className="divide-y divide-white/[0.04]">
            {stats.recentActivity.map((item) => (
              <div key={item.id} className="flex items-start gap-4 px-5 py-4 transition hover:bg-white/[0.02] sm:px-6">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.title} className="h-14 w-14 rounded-lg border border-white/[0.08] object-cover" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-600/20 bg-red-600/10 text-primary">
                    {activityIcon(item.type)}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{activityLabel(item)}</p>
                    <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-emerald-400">
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-sm text-gray-400">{item.title}</p>
                </div>

                <div className="hidden items-center gap-2 whitespace-nowrap text-xs text-gray-500 sm:flex">
                  <Clock3 className="h-3.5 w-3.5" />
                  {item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03]">
              <Sparkles className="h-7 w-7 text-gray-600" />
            </div>
            <p className="text-sm text-gray-400">Nenhuma atividade recente.</p>
          </div>
        )}
      </div>
    </div>
  )
}
