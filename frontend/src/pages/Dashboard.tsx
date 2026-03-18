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
  RefreshCcw,
  Shield,
  Sparkles,
  User,
  UserPlus,
  Video,
  Wand2,
} from 'lucide-react'
import { userService } from '@/services/user.service'
import { useCurrentUserId } from '@/hooks/useCurrentUserId'
import type { DashboardActivityItem, DashboardStatsResponse } from '@/types/api.types'
import { canUseImageEdit, getCurrentUser, getTrialEditCreditsRemaining, hasActiveLicense } from '@/utils/session'
import { getTrialBlockedMessage } from '@/utils/trial'

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

interface OnboardingStep {
  id: string
  title: string
  description: string
  status: 'done' | 'current' | 'locked'
  ctaLabel?: string
  ctaPath?: string
}

const quickActions: QuickAction[] = [
  { label: 'Criar Nova Identidade', icon: UserPlus, path: '/identity', primary: true },
  { label: 'Gerar Imagem', icon: Image, path: '/generate', primary: false },
  { label: 'Editar Imagem', icon: Wand2, path: '/edit-image', primary: false },
  { label: 'Face Swap', icon: RefreshCcw, path: '/faceswap', primary: false, disabled: true },
]

function isRecent(createdAt?: string) {
  if (!createdAt) return false
  return Date.now() - new Date(createdAt).getTime() < 1000 * 60 * 45
}

function statusBadgeClasses(status: string) {
  const normalized = status.toLowerCase()
  if (normalized === 'ready' || normalized === 'completed') {
    return 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
  }
  if (normalized === 'training' || normalized === 'processing' || normalized === 'queued') {
    return 'border border-amber-500/20 bg-amber-500/10 text-amber-300'
  }
  if (normalized === 'failed') {
    return 'border border-red-500/20 bg-red-500/10 text-red-400'
  }
  return 'border border-white/[0.08] bg-white/[0.04] text-gray-400'
}

function statusLabel(status: string) {
  const normalized = status.toLowerCase()
  if (normalized === 'ready') return 'Pronto'
  if (normalized === 'training') return 'Treinando'
  if (normalized === 'completed') return 'Concluido'
  if (normalized === 'processing') return 'Processando'
  if (normalized === 'failed') return 'Falhou'
  return status
}

function providerLabel(provider?: string | null) {
  if (provider === 'google') return 'Google'
  if (provider === 'discord') return 'Discord'
  return 'Email'
}

function stepClasses(status: OnboardingStep['status']) {
  if (status === 'done') {
    return {
      wrapper: 'border-emerald-500/20 bg-emerald-500/[0.08]',
      badge: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20',
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
      label: 'Concluido',
    }
  }

  if (status === 'current') {
    return {
      wrapper: 'border-red-500/20 bg-red-500/[0.08]',
      badge: 'bg-red-500/15 text-red-200 border border-red-500/20',
      icon: <Sparkles className="h-4 w-4 text-red-400" />,
      label: 'Agora',
    }
  }

  return {
    wrapper: 'border-white/[0.08] bg-white/[0.03]',
    badge: 'bg-white/[0.04] text-gray-400 border border-white/[0.06]',
    icon: <Clock className="h-4 w-4 text-gray-500" />,
    label: 'Bloqueado',
  }
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStatsResponse>(emptyStats)
  const userId = useCurrentUserId()
  const currentUser = getCurrentUser()
  const licensed = hasActiveLicense()
  const canEditImage = canUseImageEdit()
  const trialEditCredits = getTrialEditCreditsRemaining()
  const trialBlockedReason = currentUser?.trialBlockedReason
  const hasTrainingIdentities = stats.recentActivity.some(
    (item) => item.type === 'identity' && item.status.toLowerCase() === 'training',
  )

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
    const interval = window.setInterval(loadStats, hasTrainingIdentities ? 5000 : 15000)

    return () => {
      mounted = false
      window.clearInterval(interval)
    }
  }, [hasTrainingIdentities, userId])

  const statCards = [
    { label: 'Identidades', value: stats.identities, sub: 'Modelos prontos', icon: User },
    { label: 'Imagens', value: stats.imagesToday, sub: 'Total de hoje', icon: Image },
    { label: 'Geracoes', value: stats.generatedImagesToday, sub: 'Normais hoje', icon: Layers },
    { label: 'Editaveis', value: stats.editedImagesToday, sub: 'Edicoes de hoje', icon: Wand2 },
    { label: 'Face Swaps', value: stats.faceSwapsToday, sub: 'Realizados hoje', icon: RefreshCcw },
    { label: 'Videos', value: stats.videosToday, sub: 'Gerados hoje', icon: Video },
  ]

  const latestIdentityActivity = useMemo(
    () => stats.recentActivity.find((item) => item.type === 'identity'),
    [stats.recentActivity],
  )

  const hasEditedImage = useMemo(
    () => stats.editedImagesToday > 0 || stats.recentActivity.some((item) => item.type === 'image_edit'),
    [stats.editedImagesToday, stats.recentActivity],
  )

  const hasGeneratedImage = useMemo(
    () => stats.generatedImagesToday > 0 || stats.recentActivity.some((item) => item.type === 'image'),
    [stats.generatedImagesToday, stats.recentActivity],
  )

  const identityHighlight = useMemo(() => {
    if (!latestIdentityActivity) return null
    if (latestIdentityActivity.status.toLowerCase() === 'training') {
      return {
        ...latestIdentityActivity,
        title: 'Sua identidade esta sendo preparada',
        description: 'Voce pode continuar navegando. O painel atualiza sozinho quando o modelo concluir.',
      }
    }
    if (latestIdentityActivity.status.toLowerCase() === 'ready' && isRecent(latestIdentityActivity.createdAt)) {
      return {
        ...latestIdentityActivity,
        title: 'Sua identidade ficou pronta',
        description: 'Agora ela ja pode ser usada no gerador para criar imagens.',
      }
    }
    return null
  }, [latestIdentityActivity])

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
    if (item.type === 'video') return 'Video gerado'
    return 'Atividade'
  }

  const onboardingSteps = useMemo<OnboardingStep[]>(() => {
    const steps: OnboardingStep[] = [
      {
        id: 'account',
        title: 'Conta pronta',
        description: `Voce entrou com ${providerLabel(currentUser?.authProvider)} e ja pode acessar o painel.`,
        status: 'done',
      },
      {
        id: 'edit',
        title: hasEditedImage ? 'Primeira edicao concluida' : 'Teste o editor',
        description: hasEditedImage
          ? 'Voce ja validou o fluxo de edicao. Agora o painel fica focado em destravar o resto da plataforma.'
          : canEditImage
            ? `Use ${trialEditCredits} credito${trialEditCredits === 1 ? '' : 's'} para sentir a qualidade do produto antes de ativar.`
            : 'Seu trial nao esta mais disponivel nesta conta.',
        status: hasEditedImage ? 'done' : canEditImage ? 'current' : 'locked',
        ctaLabel: !hasEditedImage && canEditImage ? 'Editar imagem' : undefined,
        ctaPath: !hasEditedImage && canEditImage ? '/edit-image' : undefined,
      },
      {
        id: 'license',
        title: licensed ? 'Licenca ativa' : 'Desbloqueie o plano completo',
        description: licensed
          ? 'Seu acesso completo esta liberado para identidade, geracao e galeria.'
          : 'Ative a chave recebida no checkout para liberar geracao, identidades e galeria sincronizada.',
        status: licensed ? 'done' : !hasEditedImage && canEditImage ? 'locked' : 'current',
        ctaLabel: !licensed && (hasEditedImage || !canEditImage) ? 'Ativar licenca' : undefined,
        ctaPath: !licensed && (hasEditedImage || !canEditImage) ? '/profile' : undefined,
      },
      {
        id: 'identity',
        title: stats.identities > 0 ? 'Modelo criado' : 'Crie sua primeira identidade',
        description:
          stats.identities > 0
            ? 'Seu treinamento ja entrou no fluxo. Agora vale gerar uma primeira cena consistente.'
            : 'Monte a base do personagem com fotos fortes para liberar o melhor resultado nas geracoes.',
        status: stats.identities > 0 ? 'done' : licensed ? 'current' : 'locked',
        ctaLabel: stats.identities === 0 && licensed ? 'Criar identidade' : undefined,
        ctaPath: stats.identities === 0 && licensed ? '/identity' : undefined,
      },
      {
        id: 'generation',
        title: hasGeneratedImage ? 'Primeira imagem entregue' : 'Gere sua primeira imagem',
        description: hasGeneratedImage
          ? 'Seu fluxo principal ja esta ativo. O proximo passo e curar resultados e salvar o que vale na galeria.'
          : 'Use sua identidade pronta para montar uma cena completa e salvar os melhores resultados.',
        status: hasGeneratedImage ? 'done' : licensed && stats.identities > 0 ? 'current' : 'locked',
        ctaLabel: !hasGeneratedImage && licensed && stats.identities > 0 ? 'Gerar imagem' : undefined,
        ctaPath: !hasGeneratedImage && licensed && stats.identities > 0 ? '/generate' : undefined,
      },
    ]

    return steps
  }, [canEditImage, currentUser?.authProvider, hasEditedImage, hasGeneratedImage, licensed, stats.identities, trialEditCredits])

  const completedOnboardingSteps = onboardingSteps.filter((step) => step.status === 'done').length
  const activeOnboardingStep = onboardingSteps.find((step) => step.status === 'current') || onboardingSteps[onboardingSteps.length - 1]
  const onboardingProgress = Math.round((completedOnboardingSteps / onboardingSteps.length) * 100)

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

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05 }}
        className="mb-8 overflow-hidden rounded-2xl border border-white/[0.08] bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.2),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] shadow-[0_18px_60px_rgba(0,0,0,0.45)]"
      >
        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.4fr_0.9fr] lg:items-center">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-red-200">
                Proximo passo
              </span>
              <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-gray-400">
                Login via {providerLabel(currentUser?.authProvider)}
              </span>
            </div>
            <h2 className="max-w-2xl text-2xl font-bold tracking-tight text-white sm:text-[2rem]">
              {activeOnboardingStep.title}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-300">{activeOnboardingStep.description}</p>

            <div className="mt-5 flex flex-wrap gap-3">
              {activeOnboardingStep.ctaLabel && activeOnboardingStep.ctaPath ? (
                <Link
                  to={activeOnboardingStep.ctaPath}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_28px_rgba(220,38,38,0.28)] transition hover:-translate-y-0.5 hover:bg-red-700"
                >
                  <Sparkles className="h-4 w-4" />
                  {activeOnboardingStep.ctaLabel}
                </Link>
              ) : (
                <Link
                  to="/gallery"
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_28px_rgba(220,38,38,0.28)] transition hover:-translate-y-0.5 hover:bg-red-700"
                >
                  <Sparkles className="h-4 w-4" />
                  Ver galeria
                </Link>
              )}
              <Link
                to="/profile"
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-3 text-sm font-semibold text-gray-100 transition hover:border-white/[0.14] hover:bg-white/[0.05]"
              >
                <Shield className="h-4 w-4" />
                Revisar conta
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-500">Onboarding</p>
                <p className="mt-1 text-lg font-semibold text-white">{completedOnboardingSteps}/{onboardingSteps.length} etapas prontas</p>
              </div>
              <div className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs font-semibold text-gray-200">
                {onboardingProgress}%
              </div>
            </div>

            <div className="mb-5 h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-red-500 via-red-400 to-orange-300"
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(onboardingProgress, 8)}%` }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
              />
            </div>

            <div className="space-y-3">
              {onboardingSteps.map((step) => {
                const tone = stepClasses(step.status)

                return (
                  <div key={step.id} className={`rounded-2xl border p-4 ${tone.wrapper}`}>
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {tone.icon}
                        <p className="text-sm font-semibold text-white">{step.title}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${tone.badge}`}>
                        {tone.label}
                      </span>
                    </div>
                    <p className="text-sm leading-6 text-gray-300">{step.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
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
          const locked =
            action.path === '/edit-image'
              ? !canEditImage
              : !licensed

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
          {canEditImage ? (
            <>
              <p className="font-semibold text-red-400">Seu trial gratuito esta ativo</p>
              <p className="mt-1 text-sm text-gray-400">
                Voce ainda pode testar {trialEditCredits} edicao{trialEditCredits === 1 ? '' : 'es'} de imagem antes de ativar a licenca completa.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  to="/edit-image"
                  className="inline-flex rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(220,38,38,0.3)]"
                >
                  Testar edicao de imagem
                </Link>
                <Link
                  to="/profile"
                  className="inline-flex rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-3 text-sm font-semibold text-gray-200"
                >
                  Ativar licenca completa
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="font-semibold text-red-400">Ative sua licenca para liberar as ferramentas</p>
              <p className="mt-1 text-sm text-gray-400">
                {trialBlockedReason ? getTrialBlockedMessage(trialBlockedReason) : 'Seu trial gratuito ja foi usado. O proximo passo e ativar a chave na pagina de perfil.'}
              </p>
              <Link
                to="/profile"
                className="mt-4 inline-flex rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(220,38,38,0.3)]"
              >
                Ativar licenca
              </Link>
            </>
          )}
        </div>
      )}

      {identityHighlight && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="mb-8 overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-red-600/[0.14] via-white/[0.02] to-transparent shadow-[0_12px_50px_rgba(0,0,0,0.45)]"
        >
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04] shadow-[0_8px_20px_rgba(0,0,0,0.35)]">
                {identityHighlight.imageUrl ? (
                  <img src={identityHighlight.imageUrl} alt={identityHighlight.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <UserPlus className="h-8 w-8 text-red-400" />
                  </div>
                )}
                {identityHighlight.status.toLowerCase() === 'training' && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]">
                    <div className="flex h-full w-full items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </div>
                  </div>
                )}
              </div>
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.25em] text-red-300">Modelo</span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${statusBadgeClasses(identityHighlight.status)}`}>
                    {identityHighlight.status.toLowerCase() === 'training' ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                    {statusLabel(identityHighlight.status)}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white">{identityHighlight.title}</h2>
                <p className="mt-1 text-sm text-gray-300">{identityHighlight.description}</p>
                <p className="mt-2 text-xs text-gray-500">{latestIdentityActivity?.title}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {identityHighlight.status.toLowerCase() === 'training' ? (
                <>
                  <div className="min-w-[220px]">
                    <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-wider text-gray-400">
                      <span>Treinamento em andamento</span>
                      <span>Atualizacao automatica</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-red-500 via-red-400 to-orange-300"
                        initial={{ width: '18%' }}
                        animate={{ width: ['22%', '66%', '44%', '78%'] }}
                        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    </div>
                  </div>
                  <Link
                    to="/identity"
                    className="inline-flex rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:border-white/[0.16] hover:bg-white/[0.06]"
                  >
                    Acompanhar
                  </Link>
                </>
              ) : (
                <Link
                  to="/generate"
                  className="inline-flex rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(220,38,38,0.32)] transition hover:-translate-y-0.5 hover:bg-red-700"
                >
                  Gerar com esta identidade
                </Link>
              )}
            </div>
          </div>
        </motion.div>
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
              {stats.recentActivity.map((item, index) => {
                const itemStatus = statusLabel(item.status)
                const badgeClasses = statusBadgeClasses(item.status)
                const isTraining = item.status.toLowerCase() === 'training'

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 + index * 0.08 }}
                    className="group flex items-start gap-3 px-5 py-4 transition-colors hover:bg-white/[0.02] sm:items-center sm:gap-4 sm:px-6"
                  >
                    <div className="flex-shrink-0">
                      {item.imageUrl ? (
                        <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
                          <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                          {isTraining && (
                            <div className="absolute inset-0 bg-black/45">
                              <div className="flex h-full w-full items-center justify-center">
                                <Loader2 className="h-4 w-4 animate-spin text-white" />
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-red-600/20 bg-red-600/10 shadow-[0_2px_8px_rgba(220,38,38,0.08)]">
                          {isTraining ? <Loader2 className="h-4 w-4 animate-spin text-red-400" /> : activityIcon(item.type)}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-white">{activityLabel(item)}</span>
                        <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${badgeClasses}`}>
                          {isTraining ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <CheckCircle2 className="h-2.5 w-2.5" />}
                          {itemStatus}
                        </span>
                      </div>
                      <p className="truncate text-xs text-gray-500">{item.title}</p>
                    </div>

                    <div className="hidden flex-shrink-0 items-center gap-1.5 text-[11px] text-gray-600 sm:flex">
                      <Clock className="h-3 w-3" />
                      <span>{item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}</span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div className="px-6 py-16 text-center">
              <div className="mb-4 inline-flex rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                <Activity className="h-8 w-8 text-gray-600" />
              </div>
              <p className="text-sm text-gray-400">Seu feed ainda esta vazio</p>
              <p className="mt-1 text-xs text-gray-600">Quando voce editar, criar identidade ou gerar imagens, tudo aparece aqui.</p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                {activeOnboardingStep.ctaLabel && activeOnboardingStep.ctaPath ? (
                  <Link
                    to={activeOnboardingStep.ctaPath}
                    className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(220,38,38,0.24)] transition hover:bg-red-700"
                  >
                    {activeOnboardingStep.ctaLabel}
                  </Link>
                ) : (
                  <Link
                    to="/generate"
                    className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(220,38,38,0.24)] transition hover:bg-red-700"
                  >
                    Gerar imagem
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-gray-200 transition hover:border-white/[0.14] hover:bg-white/[0.05]"
                >
                  Ver perfil
                </Link>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <div className="h-8" />
    </div>
  )
}
