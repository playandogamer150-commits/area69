import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Download,
  ImageIcon,
  Loader2,
  Save,
  Sparkles,
  Upload,
  User,
  Wand2,
  X,
} from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { useCurrentUserId } from '@/hooks/useCurrentUserId'
import type { GenerateReferenceImagesUploadResponse, GenerationRequest, LoRAStatus } from '@/types/api.types'
import { galleryService } from '@/services/gallery.service'
import { loraService } from '@/services/lora.service'
import { generateService } from '@/services/generate.service'
import { getApiErrorMessage } from '@/utils/api-error'
import { type ImageEditHistoryItem, loadImageEditHistory, saveImageEditHistory } from '@/utils/image-edit-history'

const ASPECT_RATIOS: GenerationRequest['aspectRatio'][] = ['9:16', '16:9', '4:3', '3:4', '1:1', '2:3', '3:2']
const RESOLUTIONS: GenerationRequest['resolution'][] = ['720p', '1080p']
const RESULT_IMAGE_OPTIONS: GenerationRequest['resultImages'][] = [1, 4]
const MAX_REFERENCE_IMAGES = 5
const MAX_REFERENCE_IMAGE_SIZE_MB = 10

interface UploadedReferenceImage {
  id: string
  publicUrl: string
  filename: string
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string; disabled?: boolean }[]
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold tracking-wide text-white">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full appearance-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 pr-10 text-sm text-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),0_1px_0_rgba(255,255,255,0.02)] transition-all focus:border-red-600/40 focus:bg-white/[0.06] focus:outline-none"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-neutral-900" disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
      </div>
    </div>
  )
}

function OptionPills<T extends string | number>({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: T
  onChange: (value: T) => void
  options: readonly T[]
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold tracking-wide text-white">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = option === value
          return (
            <button
              key={String(option)}
              type="button"
              onClick={() => onChange(option)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                active
                  ? 'bg-red-600 text-white shadow-[0_8px_24px_rgba(220,38,38,0.28)]'
                  : 'border border-white/[0.08] bg-white/[0.03] text-gray-300 hover:border-white/[0.16] hover:bg-white/[0.05]'
              }`}
            >
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function normalizeGenerationUrls(response: { imageUrls?: string[]; imageUrl?: string }) {
  if (response.imageUrls && response.imageUrls.length > 0) return response.imageUrls
  if (response.imageUrl) return [response.imageUrl]
  return []
}

function promptGuideText(hasIdentity: boolean, hasReferences: boolean) {
  if (!hasIdentity) {
    return 'Escolha primeiro uma identidade pronta. Depois descreva enquadramento, roupa, expressao, luz e ambiente.'
  }

  if (hasReferences) {
    return 'Sua cena esta usando referencias manuais. Aproveite para detalhar pose, clima, composicao e acabamento final.'
  }

  return 'Descreva a cena completa: enquadramento, roupa, local, luz, expressao e qualidade visual desejada.'
}

export function ImageGeneration() {
  const [prompt, setPrompt] = useState('')
  const [selectedReferenceId, setSelectedReferenceId] = useState('')
  const [aspectRatio, setAspectRatio] = useState<GenerationRequest['aspectRatio']>('9:16')
  const [resolution, setResolution] = useState<GenerationRequest['resolution']>('1080p')
  const [resultImages, setResultImages] = useState<GenerationRequest['resultImages']>(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isUploadingReferences, setIsUploadingReferences] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [activePreviewImage, setActivePreviewImage] = useState<string | null>(null)
  const [latestGenerationTaskId, setLatestGenerationTaskId] = useState<string | null>(null)
  const [savedToGallery, setSavedToGallery] = useState(false)
  const [isSavingToGallery, setIsSavingToGallery] = useState(false)
  const [loras, setLoras] = useState<LoRAStatus[]>([])
  const [referenceImages, setReferenceImages] = useState<UploadedReferenceImage[]>([])
  const { toast } = useToast()
  const userId = useCurrentUserId()
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const referenceInputRef = useRef<HTMLInputElement | null>(null)
  const hasTrainingLoras = loras.some((item) => item.status === 'training')

  useEffect(() => {
    let mounted = true

    const loadLoras = async () => {
      try {
        const userLoras = await loraService.getUserLoRAs(userId)
        if (!mounted) return
        setLoras((userLoras || []).filter((item) => item && item.status !== 'failed'))
      } catch {
        if (!mounted) return
        setLoras([])
      }
    }

    loadLoras()
    const interval = window.setInterval(loadLoras, hasTrainingLoras ? 5000 : 15000)

    return () => {
      mounted = false
      window.clearInterval(interval)
    }
  }, [hasTrainingLoras, userId])

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  const selectedIdentity = useMemo(
    () => loras.find((item) => item.referenceId === selectedReferenceId) || null,
    [loras, selectedReferenceId],
  )

  const readyLoras = useMemo(() => loras.filter((item) => item.status === 'ready'), [loras])
  const trainingLoras = useMemo(() => loras.filter((item) => item.status === 'training'), [loras])
  const pollStatus = async (taskId: string) => {
    try {
      const response = await generateService.getGenerationStatus(taskId)
      const urls = normalizeGenerationUrls(response)

      if (response.status === 'completed' && urls.length > 0) {
        setGeneratedImages(urls)
        setActivePreviewImage(urls[0])
        setLatestGenerationTaskId(taskId)
        setSavedToGallery(false)
        setIsGenerating(false)
        if (pollingRef.current) clearInterval(pollingRef.current)
        toast({ title: 'Sucesso', description: 'Imagem gerada com sucesso no Soul Character.' })
      } else if (response.status === 'failed' || response.status === 'canceled' || response.status === 'nsfw') {
        setIsGenerating(false)
        if (pollingRef.current) clearInterval(pollingRef.current)
        toast({ title: 'Erro', description: 'Falha na geracao da imagem', variant: 'destructive' })
      }
    } catch {
      // ignore transient polling errors
    }
  }

  const handleUploadReferenceImages = async (incomingFiles: FileList | null) => {
    if (!incomingFiles || incomingFiles.length === 0) return

    const remainingSlots = MAX_REFERENCE_IMAGES - referenceImages.length
    if (remainingSlots <= 0) {
      toast({
        title: 'Limite atingido',
        description: `Voce pode usar no maximo ${MAX_REFERENCE_IMAGES} referencias por geracao.`,
        variant: 'destructive',
      })
      return
    }

    const files = Array.from(incomingFiles)
      .filter((file) => file.size <= MAX_REFERENCE_IMAGE_SIZE_MB * 1024 * 1024)
      .slice(0, remainingSlots)

    if (files.length === 0) {
      toast({
        title: 'Arquivo invalido',
        description: `Envie PNG, JPG, GIF ou WebP com ate ${MAX_REFERENCE_IMAGE_SIZE_MB}MB.`,
        variant: 'destructive',
      })
      return
    }

    const formData = new FormData()
    files.forEach((file) => formData.append('images', file))
    formData.append('userId', userId)

    setIsUploadingReferences(true)
    try {
      const response: GenerateReferenceImagesUploadResponse = await loraService.uploadGenerateReferenceImages(formData)
      setReferenceImages((current) => [
        ...current,
        ...response.saved.map((item) => ({
          id: item.path,
          publicUrl: item.publicUrl,
          filename: item.filename,
        })),
      ])
      toast({
        title: 'Referencias prontas',
        description: `${response.saved.length} imagem(ns) adicionada(s) para ajudar na composicao.`,
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: getApiErrorMessage(error, 'Falha ao subir imagens de referencia'),
        variant: 'destructive',
      })
    } finally {
      setIsUploadingReferences(false)
      if (referenceInputRef.current) referenceInputRef.current.value = ''
    }
  }

  const handleGenerate = async () => {
    if (!selectedIdentity || !selectedIdentity.referenceId || !prompt.trim()) {
      toast({
        title: 'Erro',
        description: 'Selecione uma identidade pronta e escreva um prompt.',
        variant: 'destructive',
      })
      return
    }

    setIsGenerating(true)
    setGeneratedImages([])
    setActivePreviewImage(null)
    setLatestGenerationTaskId(null)
    setSavedToGallery(false)

    try {
      const manualReferenceUrls = referenceImages
        .map((image) => image.publicUrl)
        .filter((url): url is string => typeof url === 'string' && url.trim().startsWith('http'))
      const response = await generateService.generateImage({
        prompt,
        loraName: selectedIdentity.modelName,
        characterId: selectedIdentity.referenceId,
        aspectRatio,
        resolution,
        resultImages,
        referenceImageUrls: manualReferenceUrls,
      })

      const urls = normalizeGenerationUrls(response)

      if (response.status === 'completed' && urls.length > 0) {
        setGeneratedImages(urls)
        setActivePreviewImage(urls[0])
        setLatestGenerationTaskId(response.taskId)
        setSavedToGallery(false)
        setIsGenerating(false)
        toast({ title: 'Sucesso', description: 'Imagem gerada com sucesso no Soul Character.' })
      } else if (response.taskId) {
        if (pollingRef.current) clearInterval(pollingRef.current)
        pollingRef.current = setInterval(() => pollStatus(response.taskId), 3000)
        toast({
          title: 'Processando',
          description: 'A geracao foi enviada. Estamos acompanhando o Soul Character em tempo real.',
        })
      } else {
        setIsGenerating(false)
        toast({ title: 'Erro', description: 'Resposta invalida do servidor', variant: 'destructive' })
      }
    } catch (error) {
      setIsGenerating(false)
      toast({
        title: 'Erro',
        description: getApiErrorMessage(error, 'Falha ao gerar imagem'),
        variant: 'destructive',
      })
    }
  }

  const handleSaveToGallery = async () => {
    if (!generatedImages.length || !latestGenerationTaskId) return

    setIsSavingToGallery(true)

    try {
      const createdAt = new Date().toISOString()
      await Promise.all(
        generatedImages.map((imageUrl, index) =>
          galleryService.saveGalleryItem({
            clientId: `${latestGenerationTaskId}-${index}`,
            sourceType: 'image_generation',
            imageUrl,
            prompt,
            size: `${resolution} - ${aspectRatio}`,
            createdAt,
            favorite: false,
          }),
        ),
      )

      setSavedToGallery(true)
      toast({
        title: 'Salvo na galeria',
        description: `${generatedImages.length} imagem(ns) adicionada(s) na galeria.`,
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: getApiErrorMessage(error, 'Falha ao salvar imagens na galeria'),
        variant: 'destructive',
      })
    } finally {
      setIsSavingToGallery(false)
    }

    return

    const createdAt = new Date().toISOString()
    const nextItems: ImageEditHistoryItem[] = generatedImages.map((imageUrl, index) => ({
      id: `${latestGenerationTaskId}-${index}`,
      clientId: `${latestGenerationTaskId}-${index}`,
      sourceType: 'image_generation',
      imageUrl,
      prompt,
      size: `${resolution} · ${aspectRatio}`,
      createdAt,
      favorite: false,
    }))

    const existingItems = loadImageEditHistory()
    const existingIds = new Set(nextItems.map((item) => item.id))
    const dedupedItems = existingItems.filter((item) => !existingIds.has(item.id))
    saveImageEditHistory([...nextItems, ...dedupedItems].slice(0, 24))
    setSavedToGallery(true)
    toast({
      title: 'Salvo na galeria',
      description: `${nextItems.length} imagem(ns) adicionada(s) na galeria.`,
    })
  }

  const canGenerate = Boolean(prompt.trim() && selectedIdentity?.status === 'ready' && selectedIdentity.referenceId && !isUploadingReferences)
  const promptLength = prompt.trim().length

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Gerar Imagem</h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05 }}
        className="mb-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.18),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] shadow-[0_18px_60px_rgba(0,0,0,0.42)]"
      >
        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1.25fr_0.95fr]">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-red-200">
                Soul Character
              </span>
              <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-gray-400">
                {readyLoras.length} identidade{readyLoras.length === 1 ? '' : 's'} pronta{readyLoras.length === 1 ? '' : 's'}
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-[2rem]">
              {selectedIdentity ? `Cena pronta para ${selectedIdentity.modelName}` : 'Monte a cena antes de disparar a geracao'}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-300">
              {selectedIdentity
                ? 'A identidade ja esta conectada. Agora o ganho vem de prompt claro, proporcao correta e referencias visuais bem escolhidas.'
                : 'Selecione uma Soul ID pronta e descreva a cena completa. O painel da direita vai mostrar o resultado final e o contexto ativo da sessao.'}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              {readyLoras.length === 0 ? (
                <Link
                  to="/identity"
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_28px_rgba(220,38,38,0.28)] transition hover:-translate-y-0.5 hover:bg-red-700"
                >
                  Criar identidade
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => document.getElementById('generation-prompt')?.focus()}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_28px_rgba(220,38,38,0.28)] transition hover:-translate-y-0.5 hover:bg-red-700"
                >
                  Escrever prompt
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
              <Link
                to="/gallery"
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-3 text-sm font-semibold text-gray-100 transition hover:border-white/[0.14] hover:bg-white/[0.05]"
              >
                Ver galeria
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              {
                title: '1. Escolha a identidade',
                description:
                  readyLoras.length > 0
                    ? 'Use uma Soul ID pronta para manter consistencia facial, estilo e personagem.'
                    : trainingLoras.length > 0
                      ? 'Sua identidade ainda esta em treinamento. Assim que ficar pronta ela aparece aqui.'
                      : 'Crie sua primeira identidade antes de abrir o fluxo completo de geracao.',
              },
              {
                title: '2. Direcione a cena',
                description: 'Prompt forte descreve enquadramento, look, ambiente, luz, humor e acabamento da imagem.',
              },
              {
                title: '3. Salve o que vale',
                description: 'Quando sair um resultado bom, envie para a galeria e mantenha um portfolio interno do produto.',
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

      <div className="flex flex-col gap-6 lg:flex-row">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="min-w-0 flex-1 lg:max-w-[620px]"
        >
          <div className="rounded-xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-5 shadow-[0_4px_25px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm sm:p-7">
            {readyLoras.length === 0 && (
              <div className="mb-5 rounded-2xl border border-amber-500/15 bg-amber-500/[0.05] p-4 text-sm text-gray-200">
                {trainingLoras.length > 0 ? (
                  <>Voce ja tem identidade em treinamento. Assim que ela ficar pronta, este fluxo libera a geracao automaticamente.</>
                ) : (
                  <>
                    Nenhuma identidade pronta ainda. Crie uma Soul ID para abrir a geracao com consistencia de personagem.
                    <Link to="/identity" className="ml-2 font-semibold text-amber-300 underline underline-offset-4">
                      Ir para Criar Identidade
                    </Link>
                  </>
                )}
              </div>
            )}

            <div className="mb-5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <label htmlFor="generation-prompt" className="block text-sm font-semibold tracking-wide text-white">
                  Prompt
                </label>
                <span className="text-[11px] tracking-wide text-gray-500">{promptLength} caracteres</span>
              </div>
              <textarea
                id="generation-prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Descreva exatamente a cena que voce quer gerar..."
                rows={4}
                className="min-h-[110px] w-full resize-y rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),0_1px_0_rgba(255,255,255,0.02)] focus:border-red-600/40 focus:bg-white/[0.06] focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),0_0_20px_rgba(220,38,38,0.06)]"
              />
              <p className="mt-2 text-[11px] leading-5 text-gray-500">{promptGuideText(Boolean(selectedIdentity), referenceImages.length > 0)}</p>
            </div>

            <div className="mb-5 h-px bg-white/[0.06]" />

            <div className="space-y-5">
              <Select
                label="Modelo Soul Character"
                value={selectedReferenceId}
                onChange={setSelectedReferenceId}
                options={
                  readyLoras.length > 0
                    ? [
                        { value: '', label: 'Selecionar identidade' },
                        ...readyLoras.map((item) => ({
                          value: item.referenceId ?? item.loraId,
                          label: item.modelName,
                        })),
                      ]
                    : [{ value: '', label: 'Nenhuma identidade pronta ainda', disabled: true }]
                }
              />

              {selectedIdentity && (
                <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.02] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04]">
                      {selectedIdentity.thumbnailUrl ? (
                        <img src={selectedIdentity.thumbnailUrl} alt={selectedIdentity.modelName} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <User className="h-6 w-6 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <h2 className="text-sm font-semibold text-white">{selectedIdentity.modelName}</h2>
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" />
                          Ready
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Character ID: <span className="text-gray-300">{selectedIdentity.referenceId ?? 'Nao encontrado'}</span>
                      </p>
                      <p className="mt-1 text-xs text-gray-600">
                        Soul Style: <span className="text-gray-300">Realistic</span> · Style Strength e Character Strength fixos no maximo.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <OptionPills label="Aspect Ratio" value={aspectRatio} onChange={setAspectRatio} options={ASPECT_RATIOS} />
              <OptionPills label="Resolution" value={resolution} onChange={setResolution} options={RESOLUTIONS} />

              <div>
                <label className="mb-2 block text-sm font-semibold tracking-wide text-white">Soul Style</label>
                <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/8 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-white">Realistic</p>
                      <p className="mt-1 text-xs leading-relaxed text-gray-400">
                        No filter, just flawless clarity, light, pores, fabric - everything exactly as it is, but better.
                      </p>
                    </div>
                    <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                      Fixo
                    </span>
                  </div>
                </div>
              </div>

              <OptionPills label="Result Images" value={resultImages} onChange={setResultImages} options={RESULT_IMAGE_OPTIONS} />

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-semibold tracking-wide text-white">Image Reference Upload</label>
                  <span className="text-[11px] text-gray-500">{referenceImages.length}/{MAX_REFERENCE_IMAGES}</span>
                </div>

                <input
                  ref={referenceInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.gif,.webp"
                  multiple
                  className="hidden"
                  onChange={(event) => handleUploadReferenceImages(event.target.files)}
                />

                <button
                  type="button"
                  onClick={() => referenceInputRef.current?.click()}
                  disabled={isUploadingReferences || referenceImages.length >= MAX_REFERENCE_IMAGES}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-5 text-sm transition ${
                    isUploadingReferences || referenceImages.length >= MAX_REFERENCE_IMAGES
                      ? 'cursor-not-allowed border-white/[0.06] bg-white/[0.02] text-gray-600'
                      : 'border-white/[0.12] bg-white/[0.03] text-gray-300 hover:border-red-500/30 hover:bg-white/[0.05]'
                  }`}
                >
                  {isUploadingReferences ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Click to upload image PNG, JPG, GIF, WebP up to 10MB
                </button>

                <p className="mt-2 text-[11px] text-gray-600">
                  Use ate {MAX_REFERENCE_IMAGES} imagens para guiar roupa, enquadramento, maquiagem ou clima da cena.
                </p>

                {referenceImages.length > 0 && (
                  <div className="mt-3 grid grid-cols-5 gap-2">
                    {referenceImages.map((image) => (
                      <div key={image.id} className="group relative overflow-hidden rounded-xl border border-white/[0.08]">
                        <img src={image.publicUrl} alt={image.filename} className="aspect-square h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setReferenceImages((current) => current.filter((item) => item.id !== image.id))}
                          className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-[12px] text-gray-500">
                Enhance Prompt fica sempre ligado, Seed sempre aleatorio e as forcas de estilo/personagem ficam travadas no maximo para manter alta consistencia.
              </div>
            </div>

            <div className="mt-6 h-px bg-white/[0.06]" />

            <motion.button
              type="button"
              disabled={!canGenerate || isGenerating}
              onClick={handleGenerate}
              whileHover={canGenerate && !isGenerating ? { scale: 1.01, y: -1 } : {}}
              whileTap={canGenerate && !isGenerating ? { scale: 0.98 } : {}}
              className={`mt-6 flex w-full items-center justify-center gap-2.5 rounded-xl px-8 py-3.5 text-sm font-semibold tracking-wide transition-all duration-300 ${
                canGenerate && !isGenerating
                  ? 'cursor-pointer bg-red-600 text-white shadow-[0_4px_20px_rgba(220,38,38,0.35),0_0_60px_rgba(220,38,38,0.08),inset_0_1px_0_rgba(255,255,255,0.1)] hover:bg-red-700 hover:shadow-[0_6px_30px_rgba(220,38,38,0.45),0_0_80px_rgba(220,38,38,0.12),inset_0_1px_0_rgba(255,255,255,0.15)]'
                  : 'cursor-not-allowed bg-red-600/30 text-white/40 shadow-none'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Gerando no Soul Character...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  Gerar com Soul Character
                </>
              )}
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="min-w-0 flex-1"
        >
          <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-white/[0.01] shadow-[0_4px_25px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm lg:sticky lg:top-24">
            <div className="flex items-center gap-2 border-b border-white/[0.06] px-5 py-3.5">
              <ImageIcon className="h-4 w-4 text-gray-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Preview</span>
              {generatedImages.length > 0 && (
                <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                  <Sparkles className="h-3 w-3" />
                  {generatedImages.length} resultado(s)
                </span>
              )}
            </div>

            <div className="relative flex min-h-[360px] items-center justify-center bg-black/30 p-4 sm:min-h-[420px] sm:p-6 lg:max-h-[72vh]">
              {isGenerating ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
                  <div className="relative">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                      className="h-16 w-16 rounded-full border-2 border-transparent border-r-red-500/30 border-t-red-500"
                    />
                    <Wand2 className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Soul Character em execucao</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Estamos gerando sua imagem com identidade, estilo realista e consistencia maxima.
                    </p>
                  </div>
                </div>
              ) : activePreviewImage ? (
                <motion.img
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  src={activePreviewImage}
                  alt="Imagem gerada"
                  className="max-h-[68vh] w-auto max-w-full rounded-xl object-contain shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03]">
                    <ImageIcon className="h-6 w-6 text-gray-600" />
                  </div>
                  <p className="max-w-[320px] text-center text-sm leading-relaxed text-gray-500">
                    {selectedIdentity?.status === 'ready'
                      ? 'Monte seu prompt, escolha o formato e clique em gerar. O resultado aparecera aqui.'
                      : 'Selecione uma identidade pronta para liberar a geracao com Soul Character.'}
                  </p>
                  {readyLoras.length === 0 && (
                    <Link
                      to="/identity"
                      className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-xs font-semibold tracking-wide text-gray-200 transition hover:border-white/[0.16] hover:bg-white/[0.06]"
                    >
                      Criar primeira identidade
                    </Link>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-white/[0.06] px-5 py-4">
              {selectedIdentity ? (
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="h-14 w-14 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.04]">
                      {selectedIdentity.thumbnailUrl ? (
                        <img src={selectedIdentity.thumbnailUrl} alt={selectedIdentity.modelName} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <User className="h-5 w-5 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">{selectedIdentity.modelName}</p>
                      <p className="truncate text-xs text-gray-500">{selectedIdentity.referenceId ?? 'Character ID pendente'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      { label: 'Formato', value: aspectRatio },
                      { label: 'Resolucao', value: resolution },
                      { label: 'Saidas', value: String(resultImages) },
                      { label: 'Referencias', value: String(referenceImages.length) },
                    ].map((item) => (
                      <div key={item.label} className="rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2.5">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">{item.label}</p>
                        <p className="mt-1 text-sm font-semibold text-white">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-gray-400">
                  Escolha uma identidade pronta para continuar. Quando ela estiver selecionada, este resumo mostra a configuracao ativa da sessao.
                </div>
              )}

              {generatedImages.length > 1 && (
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {generatedImages.map((imageUrl) => (
                    <button
                      key={imageUrl}
                      type="button"
                      onClick={() => setActivePreviewImage(imageUrl)}
                      className={`overflow-hidden rounded-xl border transition ${
                        imageUrl === activePreviewImage
                          ? 'border-red-500/50 shadow-[0_0_0_1px_rgba(220,38,38,0.4)]'
                          : 'border-white/[0.08] hover:border-white/[0.16]'
                      }`}
                    >
                      <img src={imageUrl} alt="Resultado gerado" className="aspect-square h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {generatedImages.length > 0 && (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => void handleSaveToGallery()}
                    disabled={savedToGallery || isSavingToGallery}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-xs font-semibold tracking-wide transition-all ${
                      savedToGallery
                        ? 'cursor-default border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                        : isSavingToGallery
                          ? 'cursor-wait border-white/[0.08] bg-white/[0.04] text-gray-500'
                        : 'border-white/[0.08] bg-white/[0.04] text-gray-300 hover:bg-white/[0.07]'
                    }`}
                  >
                    {isSavingToGallery ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    {savedToGallery ? 'Salvo na galeria' : isSavingToGallery ? 'Salvando...' : 'Salvar na galeria'}
                  </button>
                  <a
                    href={activePreviewImage ?? generatedImages[0]}
                    download
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs font-semibold tracking-wide text-gray-300 transition-all hover:bg-white/[0.07]"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Baixar imagem
                  </a>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
