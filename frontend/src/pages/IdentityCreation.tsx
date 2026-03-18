import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Key,
  Loader2,
  Minimize2,
  ShieldAlert,
  Sparkles,
  Upload,
  User,
  X,
} from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { useCurrentUserId } from '@/hooks/useCurrentUserId'
import type { LoRAStatus } from '@/types/api.types'
import { loraService } from '@/services/lora.service'

interface UploadedFile {
  id: string
  file: File
  preview: string
}

interface TrainingSession {
  loraId: string
  modelName: string
  status: LoRAStatus['status']
  progress: number
  thumbnailUrl?: string | null
  previewUrl?: string | null
  createdAt?: string
  minimized: boolean
}

const MIN_PHOTOS = 5
const TRAINING_PHOTO_LIMIT = 20
const MAX_SIZE_MB = 10
const TRAINING_STORAGE_KEY = 'area69.identity-training'

function getStorageKey(userId: string) {
  return `${TRAINING_STORAGE_KEY}.${userId}`
}

function statusCopy(status: LoRAStatus['status']) {
  if (status === 'ready') {
    return {
      label: 'Ready',
      description: 'Sua identidade ja esta pronta para gerar imagens no Soul Character.',
      classes: 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
    }
  }
  if (status === 'failed') {
    return {
      label: 'Failed',
      description: 'A criacao falhou. Voce pode revisar as fotos e iniciar novamente.',
      classes: 'border border-red-500/20 bg-red-500/10 text-red-400',
    }
  }
  return {
    label: 'Training',
    description: 'Seu Soul ID esta em treinamento. Voce pode continuar navegando enquanto a plataforma atualiza tudo automaticamente.',
    classes: 'border border-amber-500/20 bg-amber-500/10 text-amber-300',
  }
}

export function IdentityCreation() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [modelName, setModelName] = useState('')
  const [triggerWord, setTriggerWord] = useState('')
  const [enableNsfw, setEnableNsfw] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [trainingSession, setTrainingSession] = useState<TrainingSession | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const notifiedReadyRef = useRef<string | null>(null)
  const { toast } = useToast()
  const userId = useCurrentUserId()
  const trainingPhotos = useMemo(() => files.slice(0, TRAINING_PHOTO_LIMIT), [files])
  const ignoredPhotosCount = Math.max(0, files.length - TRAINING_PHOTO_LIMIT)

  const persistTrainingSession = useCallback(
    (session: TrainingSession | null) => {
      if (!userId) return
      if (!session) {
        window.localStorage.removeItem(getStorageKey(userId))
        return
      }
      window.localStorage.setItem(getStorageKey(userId), JSON.stringify(session))
    },
    [userId],
  )

  const hydrateTrainingSession = useCallback(
    (lora: LoRAStatus, fallbackPreviewUrl?: string | null, minimized = false): TrainingSession => ({
      loraId: lora.loraId,
      modelName: lora.modelName,
      status: lora.status,
      progress: lora.progress,
      thumbnailUrl: lora.thumbnailUrl,
      previewUrl: fallbackPreviewUrl ?? lora.thumbnailUrl ?? lora.referenceMedia?.[0] ?? null,
      createdAt: lora.createdAt,
      minimized,
    }),
    [],
  )

  useEffect(() => {
    if (!userId) return

    const stored = window.localStorage.getItem(getStorageKey(userId))
    if (stored) {
      try {
        setTrainingSession(JSON.parse(stored) as TrainingSession)
      } catch {
        window.localStorage.removeItem(getStorageKey(userId))
      }
    }

    const bootstrapLatestTraining = async () => {
      try {
        const loras = await loraService.getUserLoRAs(userId)
        const latestPending = loras.find((lora) => lora.status === 'training')
        if (latestPending) {
          setTrainingSession((current) =>
            hydrateTrainingSession(
              latestPending,
              current?.previewUrl ?? latestPending.thumbnailUrl ?? latestPending.referenceMedia?.[0] ?? null,
              current?.minimized ?? false,
            ),
          )
          return
        }

        const latestReady = loras.find((lora) => lora.status === 'ready')
        if (latestReady) {
          setTrainingSession((current) => {
            if (!current || current.loraId !== latestReady.loraId) return current
            return hydrateTrainingSession(
              latestReady,
              current.previewUrl ?? latestReady.thumbnailUrl ?? latestReady.referenceMedia?.[0] ?? null,
              current.minimized,
            )
          })
        }
      } catch {
        // ignore bootstrap errors
      }
    }

    bootstrapLatestTraining()
  }, [hydrateTrainingSession, userId])

  useEffect(() => {
    persistTrainingSession(trainingSession)
  }, [persistTrainingSession, trainingSession])

  useEffect(() => {
    if (!trainingSession || trainingSession.status === 'ready' || trainingSession.status === 'failed') return

    let mounted = true
    const poll = async () => {
      try {
        const updated = await loraService.getLoRAStatus(trainingSession.loraId)
        if (!mounted) return

        setTrainingSession((current) => {
          if (!current || current.loraId !== updated.loraId) return current
          const next = hydrateTrainingSession(
            updated,
            current.previewUrl ?? updated.thumbnailUrl ?? updated.referenceMedia?.[0] ?? null,
            current.minimized,
          )
          return next
        })

        if (updated.status === 'ready' && notifiedReadyRef.current !== updated.loraId) {
          notifiedReadyRef.current = updated.loraId
          toast({
            title: 'Identidade pronta',
            description: `${updated.modelName} ja pode ser usada na geracao com Soul Character.`,
          })
        }

        if (updated.status === 'failed') {
          toast({
            title: 'Treinamento falhou',
            description: `A identidade ${updated.modelName} nao concluiu com sucesso.`,
            variant: 'destructive',
          })
        }
      } catch {
        // ignore transient polling errors
      }
    }

    poll()
    const interval = window.setInterval(poll, 5000)

    return () => {
      mounted = false
      window.clearInterval(interval)
    }
  }, [hydrateTrainingSession, toast, trainingSession])

  useEffect(() => {
    return () => {
      files.forEach((item) => URL.revokeObjectURL(item.preview))
    }
  }, [files])

  const handleFiles = useCallback(
    (incoming: FileList | null) => {
      if (!incoming) return

      const accepted: UploadedFile[] = []

      for (let index = 0; index < incoming.length; index += 1) {
        const file = incoming[index]
        if (!file.type.startsWith('image/')) continue
        if (file.size > MAX_SIZE_MB * 1024 * 1024) continue

        accepted.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          file,
          preview: URL.createObjectURL(file),
        })
      }

      setFiles((current) => [...current, ...accepted])
    },
    [],
  )

  const removeFile = (id: string) => {
    setFiles((current) => {
      const target = current.find((item) => item.id === id)
      if (target) URL.revokeObjectURL(target.preview)
      return current.filter((item) => item.id !== id)
    })
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (files.length < MIN_PHOTOS) {
      toast({ title: 'Erro', description: `Minimo ${MIN_PHOTOS} fotos necessarias`, variant: 'destructive' })
      return
    }

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      trainingPhotos.forEach((file) => formData.append('referencePhotos', file.file))
      formData.append('userId', userId)
      formData.append('modelName', modelName)
      formData.append('enableNsfw', enableNsfw.toString())

      const uploadResponse = await loraService.uploadReferencePhotos(formData)
      const referencePhotos = uploadResponse.saved.map((file) => file.path)

      const createResponse = await loraService.createLoRA({
        userId,
        modelName,
        triggerWord,
        enableNsfw,
        referencePhotos,
      })

      if (!createResponse.ok || !createResponse.loraId) {
        throw new Error(createResponse.message || 'Falha ao iniciar o Soul ID')
      }

      const newSession: TrainingSession = {
        loraId: createResponse.loraId,
        modelName,
        status: (createResponse.status as LoRAStatus['status']) || 'training',
        progress: 12,
        previewUrl: files[0]?.preview ?? null,
        thumbnailUrl: null,
        minimized: false,
        createdAt: new Date().toISOString(),
      }

      setTrainingSession(newSession)
      files.forEach((item) => URL.revokeObjectURL(item.preview))
      setFiles([])
      setModelName('')
      setTriggerWord('')

      toast({
        title: 'Treinamento iniciado',
        description:
          ignoredPhotosCount > 0
            ? `Seu Soul ID esta sendo preparado com as ${TRAINING_PHOTO_LIMIT} primeiras fotos. A dashboard e esta tela vao atualizar automaticamente.`
            : 'Seu Soul ID esta sendo preparado. A dashboard e esta tela vao atualizar automaticamente.',
      })
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } }; message?: string }
      toast({
        title: 'Erro',
        description: err.response?.data?.detail || err.message || 'Falha ao criar identidade',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isValid = trainingPhotos.length >= MIN_PHOTOS && modelName.trim() && triggerWord.trim()
  const currentStatusCopy = trainingSession ? statusCopy(trainingSession.status) : null
  const canShowTrainingCard = Boolean(trainingSession)
  const promptReadyCount = Number(Boolean(modelName.trim())) + Number(Boolean(triggerWord.trim())) + Number(trainingPhotos.length >= MIN_PHOTOS)
  const representativePreview = useMemo(() => {
    if (!trainingSession) return null
    return trainingSession.thumbnailUrl || trainingSession.previewUrl || null
  }, [trainingSession])

  return (
    <div className="mx-auto max-w-[860px] p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Criar Nova Identidade</h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05 }}
        className="mb-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.16),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] shadow-[0_18px_60px_rgba(0,0,0,0.42)]"
      >
        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1.15fr_0.95fr]">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-red-200">
                Soul ID setup
              </span>
              <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-gray-400">
                {promptReadyCount}/3 etapas prontas
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-[2rem]">
              Treine uma identidade com fotos certas e o resto do produto fica muito mais forte
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-300">
              O segredo aqui nao e so quantidade. O que mais pesa e variedade de angulo, nitidez, iluminacao coerente e um nome/trigger que voce consiga usar com clareza depois no fluxo de geracao.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_28px_rgba(220,38,38,0.28)] transition hover:-translate-y-0.5 hover:bg-red-700"
              >
                Selecionar fotos
              </button>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-3 text-sm font-semibold text-gray-100 transition hover:border-white/[0.14] hover:bg-white/[0.05]"
              >
                Voltar ao dashboard
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              {
                title: '1. Fotos fortes',
                description: `Use pelo menos ${MIN_PHOTOS} fotos nítidas. O treino aproveita ate ${TRAINING_PHOTO_LIMIT} imagens.`,
              },
              {
                title: '2. Nome limpo',
                description: 'Escolha um nome facil de reconhecer internamente, sem ficar generico demais.',
              },
              {
                title: '3. Trigger unica',
                description: 'Defina uma palavra rara, curta e previsivel para ativar a identidade depois no produto.',
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/[0.08] bg-black/20 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-gray-300">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {canShowTrainingCard && trainingSession && currentStatusCopy && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-red-600/[0.12] via-white/[0.02] to-transparent shadow-[0_16px_60px_rgba(0,0,0,0.45)]"
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-red-400" />
                <span className="text-sm font-semibold text-white">Treinamento da identidade</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setTrainingSession((current) =>
                    current ? { ...current, minimized: !current.minimized } : current,
                  )
                }
                className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-semibold text-gray-300 transition hover:bg-white/[0.06]"
              >
                <Minimize2 className="h-3.5 w-3.5" />
                {trainingSession.minimized ? 'Expandir' : 'Minimizar'}
              </button>
            </div>

            {!trainingSession.minimized && (
              <div className="grid gap-5 p-5 sm:grid-cols-[140px,1fr] sm:p-6">
                <div className="relative h-36 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04] shadow-[0_8px_20px_rgba(0,0,0,0.35)]">
                  {representativePreview ? (
                    <img src={representativePreview} alt={trainingSession.modelName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <User className="h-8 w-8 text-gray-500" />
                    </div>
                  )}
                  {trainingSession.status === 'training' && (
                    <div className="absolute inset-0 bg-black/45">
                      <div className="flex h-full w-full items-center justify-center">
                        <Loader2 className="h-7 w-7 animate-spin text-white" />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-white">{trainingSession.modelName}</h2>
                    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${currentStatusCopy.classes}`}>
                      {trainingSession.status === 'training' ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                      {currentStatusCopy.label}
                    </span>
                  </div>

                  <p className="max-w-[580px] text-sm leading-relaxed text-gray-300">{currentStatusCopy.description}</p>

                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-wider text-gray-400">
                      <span>Status em tempo real</span>
                      <span>{trainingSession.status === 'ready' ? 'Concluido' : 'Atualizando automaticamente'}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
                      {trainingSession.status === 'training' ? (
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-red-500 via-red-400 to-orange-300"
                          initial={{ width: '14%' }}
                          animate={{ width: ['22%', '65%', '44%', '82%'] }}
                          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      ) : (
                        <div className="h-full w-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300" />
                      )}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      to="/dashboard"
                      className="inline-flex items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:border-white/[0.16] hover:bg-white/[0.06]"
                    >
                      Ir para dashboard
                    </Link>
                    {trainingSession.status === 'ready' ? (
                      <Link
                        to="/generate"
                        className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(220,38,38,0.32)] transition hover:-translate-y-0.5 hover:bg-red-700"
                      >
                        Usar no Soul Character
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Pode minimizar e continuar navegando
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="rounded-xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-5 shadow-[0_4px_25px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm sm:p-8"
      >
        <div className="mb-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-gray-300">
          <p className="font-semibold text-white">Antes de iniciar</p>
          <p className="mt-2 leading-6 text-gray-400">
            Misture close, meio corpo e enquadramentos diferentes. Evite fotos borradas, ocultacao pesada no rosto e excesso de filtros antes do treino.
          </p>
        </div>

        <div className="mb-8">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={(event) => {
              event.preventDefault()
              setIsDragging(false)
            }}
            onDrop={(event) => {
              event.preventDefault()
              setIsDragging(false)
              handleFiles(event.dataTransfer.files)
            }}
            className={`group relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all duration-300 sm:p-10 ${
              isDragging
                ? 'border-red-500/60 bg-red-600/[0.06] shadow-[0_0_40px_rgba(220,38,38,0.08)]'
                : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.03]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={(event) => handleFiles(event.target.files)}
              className="hidden"
            />

            <div className="flex flex-col items-center gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl border transition-all duration-300 ${
                  isDragging
                    ? 'border-red-600/30 bg-red-600/15'
                    : 'border-white/[0.08] bg-white/[0.04] group-hover:border-white/[0.15]'
                }`}
              >
                <Upload
                  className={`h-5 w-5 transition-colors ${
                    isDragging ? 'text-red-400' : 'text-gray-500 group-hover:text-gray-300'
                  }`}
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-white sm:text-base">Arraste fotos ou clique para selecionar</p>
                <p className="mt-1.5 text-xs text-gray-500">
                  Minimo {MIN_PHOTOS} fotos. O treino usa as {TRAINING_PHOTO_LIMIT} melhores/primeiras imagens. Tamanho maximo: {MAX_SIZE_MB}MB cada.
                </p>
                <p className="mt-1 text-[11px] text-gray-600">
                  Quanto melhor e mais variado o material, maior tende a ser a consistencia. Foque em rosto limpo, angulos diferentes e luz boa.
                </p>
              </div>
            </div>

            {isDragging && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 rounded-xl bg-red-600/[0.04]" />}
          </div>

          <AnimatePresence>
            {files.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 overflow-hidden"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs tracking-wide text-gray-400">
                    <span className={trainingPhotos.length >= MIN_PHOTOS ? 'text-emerald-400' : 'text-red-400'}>{files.length}</span> fotos carregadas
                  </span>
                  {trainingPhotos.length >= MIN_PHOTOS && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                      <Check className="h-3 w-3" />
                      Minimo atingido
                    </span>
                  )}
                </div>

                <div className="mb-3 grid gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-[11px] text-gray-400 sm:grid-cols-3">
                  <div>
                    <span className="block text-gray-500">Entram no treino</span>
                    <span className="font-semibold text-white">{trainingPhotos.length}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500">Limite do Soul ID</span>
                    <span className="font-semibold text-white">{TRAINING_PHOTO_LIMIT}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500">Extras ignoradas</span>
                    <span className={ignoredPhotosCount > 0 ? 'font-semibold text-amber-300' : 'font-semibold text-white'}>
                      {ignoredPhotosCount}
                    </span>
                  </div>
                </div>

                {ignoredPhotosCount > 0 && (
                  <div className="mb-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-100">
                    Voce carregou mais de {TRAINING_PHOTO_LIMIT} fotos. Para manter o Soul ID estavel, vamos usar apenas as {TRAINING_PHOTO_LIMIT} primeiras no treino.
                  </div>
                )}

                <div className="grid grid-cols-5 gap-2 sm:grid-cols-8">
                  {files.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="group/thumb relative aspect-square overflow-hidden rounded-lg border border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
                    >
                      <img src={item.preview} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeFile(item.id)}
                        className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover/thumb:opacity-100"
                      >
                        <X className="h-4 w-4 text-white" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mb-8 h-px bg-white/[0.06]" />

        <div className="mb-6">
          <label className="mb-2 flex items-center gap-2 text-sm font-semibold tracking-wide text-white">
            <User className="h-3.5 w-3.5 text-gray-500" />
            Nome do Modelo
          </label>
          <input
            type="text"
            value={modelName}
            onChange={(event) => setModelName(event.target.value)}
            placeholder="ex: minha-identidade-01"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),0_1px_0_rgba(255,255,255,0.02)] focus:border-red-600/40 focus:bg-white/[0.06] focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),0_0_20px_rgba(220,38,38,0.06)]"
          />
          <p className="ml-0.5 mt-1.5 text-[11px] text-gray-600">Esse nome aparece na sua organizacao interna e na selecao do Soul Character.</p>
        </div>

        <div className="mb-6">
          <label className="mb-2 flex items-center gap-2 text-sm font-semibold tracking-wide text-white">
            <Key className="h-3.5 w-3.5 text-gray-500" />
            Trigger Word
          </label>
          <input
            type="text"
            value={triggerWord}
            onChange={(event) => setTriggerWord(event.target.value)}
            placeholder="Palavra que ativa a identidade"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),0_1px_0_rgba(255,255,255,0.02)] focus:border-red-600/40 focus:bg-white/[0.06] focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),0_0_20px_rgba(220,38,38,0.06)]"
          />
          <p className="ml-0.5 mt-1.5 text-[11px] text-gray-600">Use uma palavra unica que nao apareca em prompts normais. Exemplo: `mavai9` ou `n3ttinface`.</p>
        </div>

        <div className="mb-6 h-px bg-white/[0.06]" />

        <div className="mb-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setEnableNsfw((value) => !value)}
              className={`relative flex h-7 w-12 flex-shrink-0 rounded-full transition-all duration-300 ${
                enableNsfw
                  ? 'bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]'
                  : 'bg-white/[0.1] shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]'
              }`}
            >
              <motion.div
                animate={{ x: enableNsfw ? 22 : 3 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className={`absolute top-1 h-5 w-5 rounded-full ${
                  enableNsfw ? 'bg-white shadow-[0_2px_4px_rgba(0,0,0,0.3)]' : 'bg-gray-400 shadow-[0_2px_4px_rgba(0,0,0,0.2)]'
                }`}
              />
            </button>

            <div className="flex items-center gap-2">
              <ShieldAlert className={`h-4 w-4 flex-shrink-0 ${enableNsfw ? 'text-red-400' : 'text-gray-500'}`} />
              <span className="text-sm font-semibold text-white">Habilitar geracao NSFW</span>
            </div>
          </div>
          <p className="ml-[60px] mt-2 text-[11px] text-gray-600">
            Esta flag prepara o modelo para conteudo explicito quando voce usar o Soul Character.
          </p>
        </div>

        <motion.button
          type="submit"
          disabled={!isValid || isSubmitting}
          whileHover={isValid && !isSubmitting ? { scale: 1.01, y: -1 } : {}}
          whileTap={isValid && !isSubmitting ? { scale: 0.98 } : {}}
          className={`flex items-center justify-center gap-2.5 rounded-xl px-8 py-3.5 text-sm font-semibold tracking-wide transition-all duration-300 ${
            isValid && !isSubmitting
              ? 'cursor-pointer bg-red-600 text-white shadow-[0_4px_20px_rgba(220,38,38,0.35),0_0_60px_rgba(220,38,38,0.08),inset_0_1px_0_rgba(255,255,255,0.1)] hover:bg-red-700 hover:shadow-[0_6px_30px_rgba(220,38,38,0.45),0_0_80px_rgba(220,38,38,0.12),inset_0_1px_0_rgba(255,255,255,0.15)]'
              : 'cursor-not-allowed bg-red-600/30 text-white/40 shadow-none'
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Criando Soul ID...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Iniciar Treinamento
            </>
          )}
        </motion.button>

        {!isValid && (
          <div className="mt-4 flex flex-col gap-1.5">
            {files.length < MIN_PHOTOS && (
              <p className="flex items-center gap-1.5 text-[11px] text-gray-600">
                <AlertCircle className="h-3 w-3" />
                Adicione pelo menos {MIN_PHOTOS} fotos ({trainingPhotos.length}/{MIN_PHOTOS})
              </p>
            )}
            {!modelName.trim() && (
              <p className="flex items-center gap-1.5 text-[11px] text-gray-600">
                <AlertCircle className="h-3 w-3" />
                Preencha o nome do modelo
              </p>
            )}
            {!triggerWord.trim() && (
              <p className="flex items-center gap-1.5 text-[11px] text-gray-600">
                <AlertCircle className="h-3 w-3" />
                Defina uma trigger word
              </p>
            )}
          </div>
        )}

        {isValid && !isSubmitting && (
          <div className="mt-4 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.05] px-4 py-3 text-[11px] leading-6 text-emerald-100">
            Checklist pronto. As fotos, o nome do modelo e a trigger word ja estao em estado valido para iniciar o Soul ID.
          </div>
        )}
      </motion.form>

      <div className="h-8" />
    </div>
  )
}
