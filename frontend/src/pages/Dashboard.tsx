import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import {
  Activity,
  CheckCircle2,
  Clock,
  Image,
  Layers,
  RefreshCcw,
  Sparkles,
  User,
  UserPlus,
  Video,
  Wand2,
} from 'lucide-react'
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

interface QuickAction {
  label: string
  icon: typeof UserPlus
  path: string
  primary: boolean
  disabled?: boolean
}

const quickActions: QuickAction[] = [
  { label: 'Criar Nova Identidade', icon: UserPlus, path: '/identity', primary: true },
  { label: 'Gerar Imagem', icon: Image, path: '/generate', primary: false },
  { label: 'Face Swap', icon: RefreshCcw, path: '/faceswap', primary: false, disabled: true },
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
    { label: 'Gerações', value: stats.generatedImagesToday, sub: 'Gerações normais hoje', icon: Layers },
    { label: 'Editáveis', value: stats.editedImagesToday, sub: 'Edições de hoje', icon: Wand2 },
    { label: 'Face Swaps', value: stats.faceSwapsToday, sub: 'Realizados hoje', icon: RefreshCcw },
    { label: 'Vídeos', value: stats.videosToday, sub: 'Gerados hoje', icon: Video },
  ]

  const activityIcon = (type: string) => {
    switch (type) {
      case 'identity':
        return <UserPlus className="h-4 w-4 text-red-500" />
      case 'image_edit':
        return <Wand2 className="h-4 w-4 text-red-500" />
      case 'image':
        return <Image className="h-4 w-4 text-red-500" />
      case 'video':
        return <Video className="h-4 w-4 text-red-500" />
      default:
        return <Sparkles className="h-4 w-4 text-red-500" />
    }
  }

  const activityLabel = (item: DashboardActivityItem) => {
    if (item.type === 'identity') return 'Identidade criada'
    if (item.type === 'image_edit') return 'Imagem editada'
    if (item.type === 'image') return 'Imagem gerada'
    if (item.type === 'video') return 'Vídeo gerado'
    return 'Atividade'
  }

  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm tracking-wide text-gray-500">Bem-vindo ao AREA 69</p>
      </motion.div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className="group relative"
          >
            <div className="relative rounded-xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-4 shadow-[0_2px_15px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-500 hover:-translate-y-0.5 hover:border-white/[0.12] hover:shadow-[0_6px_25px_rgba(0,0,0,0.5),0_0_30px_rgba(220,38,38,0.03),inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[11px] font-medium tracking-wide text-gray-400 sm:text-xs">{stat.label}</span>
                <stat.icon className="h-4 w-4 text-gray-600 transition-colors group-hover:text-red-500/60" />
              </div>
              <div className="mb-1 text-2xl font-bold text-white sm:text-3xl">{stat.value}</div>
              <div className="text-[10px] text-gray-600 sm:text-[11px]">{stat.sub}</div>
              <div className="absolute -inset-0.5 -z-10 rounded-xl bg-red-600/[0.02] opacity-0 blur-lg transition-opacity group-hover:opacity-100" />
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4"
      >
        {quickActions.map((action) => {
          const locked = !licensed

          const content = (
            <div
              className={`relative flex items-center justify-center gap-2.5 rounded-xl px-6 py-4 text-sm font-semibold tracking-wide transition-all duration-300 ${
                action.disabled || locked
                  ? 'cursor-not-allowed border border-white/[0.06] bg-white/[0.02] text-gray-500 opacity-40'
                  : action.primary
                  ? 'bg-red-600 text-white shadow-[0_4px_20px_rgba(220,38,38,0.3),0_0_60px_rgba(220,38,38,0.08),inset_0_1px_0_rgba(255,255,255,0.1)] hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-[0_6px_30px_rgba(220,38,38,0.4),0_0_80px_rgba(220,38,38,0.12),inset_0_1px_0_rgba(255,255,255,0.15)]'
                  : 'border border-white/[0.08] bg-white/[0.03] text-gray-300 shadow-[0_2px_12px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.04)] hover:-translate-y-0.5 hover:border-white/[0.15] hover:bg-white/[0.05] hover:text-white hover:shadow-[0_4px_20px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]'
              }`}
            >
              <action.icon className="h-4 w-4 flex-shrink-0" />
              <span>{action.label}</span>
            </div>
          )

          if (action.disabled || locked) {
            return <div key={action.label}>{content}</div>
          }

          return (
            <Link key={action.label} to={action.path}>
              {content}
            </Link>
          )
        })}
      </motion.div>

      {!licensed && (
        <div className="mb-8 rounded-xl border border-red-600/15 bg-red-600/[0.05] p-5 shadow-[0_2px_12px_rgba(220,38,38,0.08)]">
          <p className="font-semibold text-red-400">Ative sua licença para liberar as ferramentas</p>
          <p className="mt-1 text-sm text-gray-400">Seu cadastro já está pronto. O próximo passo é ativar a chave na página de perfil.</p>
          <Link
            to="/profile"
            className="mt-4 inline-flex rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(220,38,38,0.3)]"
          >
            Ativar licença
          </Link>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-white/[0.01] shadow-[0_4px_25px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-5 py-4 sm:px-6">
            <Sparkles className="h-4 w-4 text-red-500 drop-shadow-[0_0_4px_rgba(220,38,38,0.4)]" />
            <h2 className="text-sm font-bold tracking-wide sm:text-base">Atividade Recente</h2>
          </div>

          {stats.recentActivity.length > 0 ? (
            <div className="divide-y divide-white/[0.04]">
              {stats.recentActivity.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 + index * 0.08 }}
                  className="group flex items-start gap-3 px-5 py-4 transition-colors hover:bg-white/[0.02] sm:items-center sm:gap-4 sm:px-6"
                >
                  <div className="flex-shrink-0">
                    {item.imageUrl ? (
                      <div className="h-10 w-10 overflow-hidden rounded-lg border border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
                        <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-600/20 bg-red-600/10 shadow-[0_2px_8px_rgba(220,38,38,0.08)]">
                        {activityIcon(item.type)}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{activityLabel(item)}</span>
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        {item.status}
                      </span>
                    </div>
                    <p className="truncate text-xs text-gray-500">{item.title}</p>
                  </div>

                  <div className="hidden flex-shrink-0 items-center gap-1.5 text-[11px] text-gray-600 sm:flex">
                    <Clock className="h-3 w-3" />
                    <span>{item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-16 text-center">
              <div className="mb-4 inline-flex rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                <Activity className="h-8 w-8 text-gray-600" />
              </div>
              <p className="text-sm text-gray-500">Nenhuma atividade recente</p>
              <p className="mt-1 text-xs text-gray-600">Comece criando sua primeira identidade</p>
            </div>
          )}
        </div>
      </motion.div>

      <div className="h-8" />
    </div>
  )
}
