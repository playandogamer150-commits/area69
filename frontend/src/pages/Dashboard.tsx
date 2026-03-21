import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import {
  Activity,
  CheckCircle2,
  Clock,
  Image,
  Layers,
  Loader2,
  Sparkles,
  Wand2,
} from 'lucide-react'
import { userService } from '@/services/user.service'
import { useCurrentUserId } from '@/hooks/useCurrentUserId'
import type { DashboardActivityItem, DashboardStatsResponse } from '@/types/api.types'
import { canUseImageEdit, getCurrentUser, getTrialEditCreditsRemaining, hasActiveLicense } from '@/utils/session'
import { getTrialBlockedMessage } from '@/utils/trial'

const emptyStats: DashboardStatsResponse = {
  imagesToday: 0,
  generatedImagesToday: 0,
  editedImagesToday: 0,
  recentActivity: [],
}

interface QuickAction {
  label: string
  icon: typeof Image
  path: string
  primary: boolean
  disabled?: boolean
}

const quickActions: QuickAction[] = [
  { label: 'Gerar Imagem', icon: Image, path: '/generate', primary: true },
  { label: 'Editar Imagem', icon: Wand2, path: '/edit-image', primary: false },
]

const DASHBOARD_TOUR_STORAGE_KEY = 'area69:dashboard-tour-complete-v1'

function isRecent(createdAt?: string) {
  if (!createdAt) return false
  return Date.now() - new Date(createdAt).getTime() < 1000 * 60 * 45
}

function statusBadgeClasses(status: string) {
  const normalized = status.toLowerCase()
  if (normalized === 'ready' || normalized === 'completed') {
    return 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
  }
  if (normalized === 'processing' || normalized === 'queued') {
    return 'border border-amber-500/20 bg-amber-500/10 text-amber-300'
  }
  if (normalized === 'failed') {
    return 'border border-red-500/20 bg-red-500/10 text-red-400'
  }
  return 'border border-white/[0.08] bg-white/[0.04] text-gray-400'
}

function statusLabel(status: string) {
  const normalized = status.toLowerCase()
  if (normalized === 'completed') return 'Concluido'
  if (normalized === 'processing') return 'Processando'
  if (normalized === 'failed') return 'Falhou'
  return status
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStatsResponse>(emptyStats)
  const userId = useCurrentUserId()
  const currentUser = getCurrentUser()
  const licensed = hasActiveLicense()
  const canEditImage = canUseImageEdit()
  const trialEditCredits = getTrialEditCreditsRemaining()
  const trialBlockedReason = currentUser?.trialBlockedReason

  useEffect(() => {
    let mounted = true

    const loadStats = async () => {
      try {
        const response = await userService.getDashboardStats(userId)
        if (mounted) setStats(response)
      } catch {
        if (mounted) setStats(emptyStats)
      }
    }

    loadStats()
    const interval = window.setInterval(loadStats, 15000)

    return () => {
      mounted = false
      window.clearInterval(interval)
    }
  }, [userId])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.innerWidth < 1024) return
    if (window.localStorage.getItem(DASHBOARD_TOUR_STORAGE_KEY) === 'done') return
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(DASHBOARD_TOUR_STORAGE_KEY, 'done')
    }, 450)
    return () => window.clearTimeout(timer)
  }, [])

  const statCards = [
    { label: 'Imagens', value: stats.imagesToday, sub: 'Total de hoje', icon: Image },
    { label: 'Geracoes', value: stats.generatedImagesToday, sub: 'Normais hoje', icon: Layers },
    { label: 'Editaveis', value: stats.editedImagesToday, sub: 'Edicoes de hoje', icon: Wand2 },
  ]

  const hasEditedImage = useMemo(
    () => stats.editedImagesToday > 0 || stats.recentActivity.some((item) => item.type === 'image_edit'),
    [stats.editedImagesToday, stats.recentActivity],
  )

  const hasGeneratedImage = useMemo(
    () => stats.generatedImagesToday > 0 || stats.recentActivity.some((item) => item.type === 'image'),
    [stats.generatedImagesToday, stats.recentActivity],
  )

  const activityIcon = (type: string) => {
    switch (type) {
      case 'image_edit':
        return <Wand2 className="h-4 w-4 text-red-500" />
      case 'image':
        return <Image className="h-4 w-4 text-red-500" />
      default:
        return <Sparkles className="h-4 w-4 text-red-500" />
    }
  }

  const activityLabel = (item: DashboardActivityItem) => {
    if (item.type === 'image_edit') return 'Imagem editada'
    if (item.type === 'image') return 'Imagem gerada'
    return 'Atividade'
  }

  const nextAction = useMemo(() => {
    if (canEditImage && !hasEditedImage) {
      return {
        title: 'Seu melhor primeiro passo e testar o editor',
        description: `Voce ainda tem ${trialEditCredits} credito${trialEditCredits === 1 ? '' : 's'} para validar a qualidade do fluxo.`,
        ctaLabel: 'Editar imagem',
        ctaPath: '/edit-image',
      }
    }
    if (licensed && !hasGeneratedImage) {
      return {
        title: 'Comece gerando sua primeira imagem',
        description: 'Use Seedream 4.5 para criar imagens ultra-realistas.',
        ctaLabel: 'Gerar imagem',
        ctaPath: '/generate',
      }
    }
    return null
  }, [canEditImage, hasEditedImage, licensed, hasGeneratedImage, trialEditCredits])

  const welcomeCardTitle = licensed
    ? 'Bem-vindo de volta ao AREA 69'
    : canEditImage
      ? 'Teste gratuito ativado'
      : 'AREA 69 — Estudio Visual Privado'

  const welcomeCardDescription = licensed
    ? 'Use o gerador para criar novas imagens ou edite suas fotos.'
    : canEditImage
      ? `Voce tem ${trialEditCredits} credito${trialEditCredits === 1 ? '' : 's'} para testar o editor.`
      : 'Ative sua licenca para desbloquear todos os recursos.'

  return (
    <div className="min-h-screen bg-black px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-wide text-white sm:text-3xl">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              {currentUser?.email ? `Conectado como ${currentUser.email}` : 'Sessao ativa'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {licensed ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Licenca ativa
              </span>
            ) : canEditImage ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300">
                <Clock className="h-3.5 w-3.5" />
                Teste gratuito
              </span>
            ) : trialBlockedReason ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400">
                {getTrialBlockedMessage(trialBlockedReason)}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-gray-400">
                Nao licenciado
              </span>
            )}
          </div>
        </div>

        {/* Welcome Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-red-600/10 via-black to-black p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(220,38,38,0.15),transparent_50%)]" />
          <div className="relative z-10">
            <h2 className="text-xl font-bold text-white sm:text-2xl">{welcomeCardTitle}</h2>
            <p className="mt-2 text-sm text-gray-400">{welcomeCardDescription}</p>

            {nextAction && (
              <Link
                to={nextAction.ctaPath}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
              >
                {nextAction.ctaLabel}
                <Activity className="h-4 w-4" />
              </Link>
            )}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {statCards.map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04]">
                  <stat.icon className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.sub}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">Acoes rapidas</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {quickActions.map((action) => {
              const locked = action.disabled || (!licensed && action.path === '/generate')
              if (locked) {
                return (
                  <div
                    key={action.path}
                    className="flex cursor-not-allowed items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04]">
                        <action.icon className="h-5 w-5 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-400">{action.label}</p>
                        <p className="text-xs text-gray-600">Requer licenca</p>
                      </div>
                    </div>
                    <span className="rounded bg-white/[0.06] px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                      Bloqueado
                    </span>
                  </div>
                )
              }

              return (
                <Link
                  key={action.path}
                  to={action.path}
                  className={`group flex items-center justify-between rounded-xl border p-4 transition-all ${
                    action.primary
                      ? 'border-red-600/25 bg-red-600/10 hover:bg-red-600/15'
                      : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.16] hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${action.primary ? 'border-red-500/30 bg-red-500/10' : 'border-white/[0.08] bg-white/[0.04]'}`}>
                      <action.icon className={`h-5 w-5 ${action.primary ? 'text-red-500' : 'text-gray-400 group-hover:text-white'}`} />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${action.primary ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>{action.label}</p>
                      <p className="text-xs text-gray-500">Acesso rapido</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">Atividade recente</h3>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02]">
            {stats.recentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Activity className="h-8 w-8 text-gray-600" />
                <p className="mt-3 text-sm text-gray-500">Nenhuma atividade ainda</p>
                <p className="text-xs text-gray-600">Comece gerando ou editando uma imagem</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.06]">
                {stats.recentActivity.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04]">
                      {activityIcon(item.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{activityLabel(item)}</p>
                      <p className="text-xs text-gray-500">{item.title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusBadgeClasses(item.status)}`}>
                        {statusLabel(item.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}