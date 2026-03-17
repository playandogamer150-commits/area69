import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Clock,
  Download,
  ImageIcon,
  Loader2,
  Plus,
  RotateCcw,
  Sparkles,
  Star,
  Trash,
  Trash2,
  Upload,
  Wand2,
  X,
} from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { useCurrentUserId } from '@/hooks/useCurrentUserId'
import { galleryService } from '@/services/gallery.service'
import { imageEditService } from '@/services/image-edit.service'
import { type ImageEditHistoryItem, inferLegacyGallerySourceType, loadImageEditHistory, saveImageEditHistory } from '@/utils/image-edit-history'
import { getApiErrorMessage } from '@/utils/api-error'

const aspectRatios = [
  { label: '1:1', w: 1024, h: 1024 },
  { label: '16:9', w: 1792, h: 1024 },
  { label: '9:16', w: 1024, h: 1792 },
  { label: '4:3', w: 1365, h: 1024 },
  { label: '3:4', w: 1024, h: 1365 },
  { label: '3:2', w: 1536, h: 1024 },
  { label: '2:3', w: 1024, h: 1536 },
] as const

const MIN_SIZE = 256
const MAX_SIZE = 2048
const MAX_IMAGES = 6

interface UploadedImage {
  id: string
  file: File
  preview: string
}

export function ImageEdit() {
  const [images, setImages] = useState<UploadedImage[]>([])
  const [prompt, setPrompt] = useState('')
  const [selectedRatio, setSelectedRatio] = useState('1:1')
  const [width, setWidth] = useState(1024)
  const [height, setHeight] = useState(1024)
  const [seed, setSeed] = useState('-1')
  const [isProcessing, setIsProcessing] = useState(false)
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [history, setHistory] = useState<ImageEditHistoryItem[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [latestResultGalleryId, setLatestResultGalleryId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const addInputRef = useRef<HTMLInputElement>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()
  const userId = useCurrentUserId()

  useEffect(() => {
    let cancelled = false

    const loadHistory = async () => {
      setIsLoadingHistory(true)

      try {
        const legacyItems = loadImageEditHistory()
        if (legacyItems.length > 0) {
          await Promise.all(
            legacyItems.map((item) =>
              galleryService.saveGalleryItem({
                clientId: item.clientId || item.id,
                sourceType: item.sourceType || inferLegacyGallerySourceType(item),
                imageUrl: item.imageUrl,
                prompt: item.prompt,
                size: item.size,
                favorite: item.favorite ?? false,
                createdAt: item.createdAt,
              }),
            ),
          )
          saveImageEditHistory([])
        }

        const items = await galleryService.getGalleryItems('image_edit')
        if (!cancelled) {
          setHistory(items)
        }
      } catch (error) {
        if (!cancelled) {
          toast({
            title: 'Erro',
            description: getApiErrorMessage(error, 'Falha ao carregar historico de edicao'),
            variant: 'destructive',
          })
        }
      } finally {
        if (!cancelled) {
          setIsLoadingHistory(false)
        }
      }
    }

    void loadHistory()

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
      cancelled = true
    }
  }, [toast])

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) return

    const next: UploadedImage[] = []
    for (let index = 0; index < incoming.length; index += 1) {
      const file = incoming[index]
      if (!file.type.startsWith('image/')) continue
      if (file.size > 10 * 1024 * 1024) continue
      if (images.length + next.length >= MAX_IMAGES) break
      next.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        preview: URL.createObjectURL(file),
      })
    }

    setImages((current) => [...current, ...next])
  }

  const removeImage = (id: string) => {
    setImages((current) => {
      const target = current.find((item) => item.id === id)
      if (target) URL.revokeObjectURL(target.preview)
      return current.filter((item) => item.id !== id)
    })
  }

  const clearImages = () => {
    images.forEach((image) => URL.revokeObjectURL(image.preview))
    setImages([])
  }

  const applyRatio = (label: string) => {
    setSelectedRatio(label)
    const ratio = aspectRatios.find((item) => item.label === label)
    if (ratio) {
      setWidth(ratio.w)
      setHeight(ratio.h)
    }
  }

  const clamp = (value: number) => Math.max(MIN_SIZE, Math.min(MAX_SIZE, value))
  const handleWidthChange = (value: number) => {
    setWidth(clamp(value))
    setSelectedRatio('')
  }
  const handleHeightChange = (value: number) => {
    setHeight(clamp(value))
    setSelectedRatio('')
  }

  const pushHistoryItem = async (imageUrl: string, taskId: string) => {
    const savedItem = await galleryService.saveGalleryItem({
      clientId: taskId,
      sourceType: 'image_edit',
      imageUrl,
      prompt,
      size: `${width}*${height}`,
      createdAt: new Date().toISOString(),
      favorite: false,
    })

    setLatestResultGalleryId(savedItem.id)
    setHistory((current) => [savedItem, ...current.filter((item) => item.id !== savedItem.id)].slice(0, 12))
  }

  const pollStatus = async (taskId: string) => {
    try {
      const response = await imageEditService.getStatus(taskId)
      if (response.status === 'completed' && response.imageUrl) {
        setResultImage(response.imageUrl)
        await pushHistoryItem(response.imageUrl, taskId)
        setIsProcessing(false)
        if (pollingRef.current) clearInterval(pollingRef.current)
        toast({ title: 'Sucesso', description: 'Edicao concluida com sucesso!' })
      } else if (response.status === 'failed') {
        setIsProcessing(false)
        if (pollingRef.current) clearInterval(pollingRef.current)
        toast({ title: 'Erro', description: 'Falha ao editar imagem', variant: 'destructive' })
      }
    } catch {
      // ignore transient polling errors
    }
  }

  const handleExecute = async () => {
    if (!images.length || !prompt.trim()) return

    setIsProcessing(true)
    setResultImage(null)

    try {
      const formData = new FormData()
      images.forEach((image) => formData.append('images', image.file))
      formData.append('userId', userId)

      const uploadResponse = await imageEditService.uploadImages(formData)
      const response = await imageEditService.editImage({
        userId,
        images: uploadResponse.saved.map((file) => file.path),
        prompt,
        size: `${width}*${height}`,
        seed: Number(seed || '-1'),
      })

      if (response.status === 'completed' && response.imageUrl) {
        setResultImage(response.imageUrl)
        await pushHistoryItem(response.imageUrl, response.taskId)
        setIsProcessing(false)
      } else if (response.taskId) {
        if (pollingRef.current) clearInterval(pollingRef.current)
        pollingRef.current = setInterval(() => pollStatus(response.taskId), 3000)
        toast({ title: 'Processando', description: 'Edicao enviada para processamento.' })
      }
    } catch (error) {
      setIsProcessing(false)
      toast({
        title: 'Erro',
        description: getApiErrorMessage(error, 'Falha ao iniciar edicao'),
        variant: 'destructive',
      })
    }
  }

  const restoreHistoryItem = (item: ImageEditHistoryItem) => {
    setPrompt(item.prompt)
    setResultImage(item.imageUrl)
    setLatestResultGalleryId(item.id)
    const [savedWidth, savedHeight] = item.size.split('*').map(Number)
    if (savedWidth) setWidth(savedWidth)
    if (savedHeight) setHeight(savedHeight)
  }

  const removeHistory = async (id: string) => {
    try {
      await galleryService.deleteGalleryItem(id)
      setHistory((current) => current.filter((item) => item.id !== id))
      if (latestResultGalleryId === id) {
        setLatestResultGalleryId(null)
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: getApiErrorMessage(error, 'Falha ao remover item do historico'),
        variant: 'destructive',
      })
    }
  }

  const clearHistory = async () => {
    try {
      await galleryService.clearGallery('image_edit')
      setHistory([])
      setLatestResultGalleryId(null)
    } catch (error) {
      toast({
        title: 'Erro',
        description: getApiErrorMessage(error, 'Falha ao limpar historico'),
        variant: 'destructive',
      })
    }
  }

  const toggleFavorite = async (id: string) => {
    const target = history.find((item) => item.id === id)
    if (!target) return

    try {
      const updatedItem = await galleryService.updateFavorite(id, !target.favorite)
      setHistory((current) =>
        current
          .map((item) => (item.id === updatedItem.id ? updatedItem : item))
          .sort((a, b) => Number(Boolean(b.favorite)) - Number(Boolean(a.favorite)) || b.createdAt.localeCompare(a.createdAt)),
      )
    } catch (error) {
      toast({
        title: 'Erro',
        description: getApiErrorMessage(error, 'Falha ao atualizar favorito'),
        variant: 'destructive',
      })
    }
  }

  const pct = (value: number) => ((value - MIN_SIZE) / (MAX_SIZE - MIN_SIZE)) * 100
  const canExecute = images.length > 0 && prompt.trim()

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Editar Imagem</h1>
      </motion.div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="min-w-0 flex-1 space-y-6 lg:max-w-[680px]"
        >
          <div className="rounded-xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-5 shadow-[0_4px_25px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm sm:p-7">
            <div className="mb-6">
              <label className="mb-3 block text-sm font-semibold tracking-wide text-white">Images</label>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="group flex cursor-pointer items-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-4 transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => handleFiles(event.target.files)}
                  className="hidden"
                />
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] transition-all group-hover:border-white/[0.15]">
                  <Upload className="h-4 w-4 text-gray-500 transition-colors group-hover:text-gray-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">Arraste imagem ou clique para selecionar</p>
                  <p className="mt-0.5 text-[11px] text-gray-600">Hint: PNG/JPG/WEBP, ate 10MB</p>
                </div>
                {images.length > 0 && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      clearImages()
                    }}
                    className="flex-shrink-0 rounded-lg p-2 text-gray-500 transition-all hover:bg-white/[0.06] hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <AnimatePresence>
                {images.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 flex flex-wrap gap-2 overflow-hidden"
                  >
                    {images.map((image) => (
                      <motion.div
                        key={image.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="group/thumb relative h-14 w-14 overflow-hidden rounded-lg border border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
                      >
                        <img src={image.preview} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(image.id)}
                          className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover/thumb:opacity-100"
                        >
                          <X className="h-3.5 w-3.5 text-white" />
                        </button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  <span className={images.length > 0 ? 'text-red-400' : 'text-gray-500'}>{images.length}</span> de {MAX_IMAGES} imagens selecionadas
                </span>
                <button
                  type="button"
                  onClick={() => addInputRef.current?.click()}
                  disabled={images.length >= MAX_IMAGES}
                  className="flex items-center gap-1.5 rounded-lg border border-red-600/25 bg-red-600/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-red-400 transition-all hover:bg-red-600/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus className="h-3 w-3" />
                  Add Item
                </button>
                <input
                  ref={addInputRef}
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => handleFiles(event.target.files)}
                  className="hidden"
                />
              </div>
            </div>

            <div className="mb-6 h-px bg-white/[0.06]" />

            <div className="mb-6">
              <label className="mb-2 block text-sm font-semibold tracking-wide text-white">Prompt</label>
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Descreva a edicao desejada..."
                rows={4}
                className="min-h-[100px] w-full resize-y rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),0_1px_0_rgba(255,255,255,0.02)] focus:border-red-600/40 focus:bg-white/[0.06] focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),0_0_20px_rgba(220,38,38,0.06)]"
              />
            </div>

            <div className="mb-6 h-px bg-white/[0.06]" />

            <div className="mb-6">
              <div className="mb-3 flex items-center justify-between">
                <label className="text-sm font-semibold tracking-wide text-white">Size</label>
                <span className="text-[11px] text-gray-500">Range {MIN_SIZE} - {MAX_SIZE}</span>
              </div>

              <div className="mb-5 flex flex-wrap gap-2">
                {aspectRatios.map((ratio) => (
                  <button
                    key={ratio.label}
                    type="button"
                    onClick={() => applyRatio(ratio.label)}
                    className={`rounded-lg border px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all duration-200 ${
                      selectedRatio === ratio.label
                        ? 'border-red-600 bg-red-600 text-white shadow-[0_2px_12px_rgba(220,38,38,0.35),inset_0_1px_0_rgba(255,255,255,0.1)]'
                        : 'border-white/[0.08] bg-white/[0.04] text-gray-400 hover:border-white/[0.15] hover:bg-white/[0.07] hover:text-white'
                    }`}
                  >
                    {ratio.label}
                  </button>
                ))}
              </div>

              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">Width</span>
                  <input
                    type="number"
                    value={width}
                    onChange={(event) => handleWidthChange(Number(event.target.value))}
                    min={MIN_SIZE}
                    max={MAX_SIZE}
                    className="w-20 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-center text-xs text-white shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)] outline-none transition-all focus:border-red-600/40"
                  />
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min={MIN_SIZE}
                    max={MAX_SIZE}
                    value={width}
                    onChange={(event) => handleWidthChange(Number(event.target.value))}
                    className="slider-input relative z-10 h-2 w-full cursor-pointer appearance-none rounded-full bg-transparent"
                  />
                  <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-white/[0.08] shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]" />
                  <div
                    className="pointer-events-none absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.3)]"
                    style={{ width: `${pct(width)}%` }}
                  />
                </div>
              </div>

              <div className="mb-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">Height</span>
                  <input
                    type="number"
                    value={height}
                    onChange={(event) => handleHeightChange(Number(event.target.value))}
                    min={MIN_SIZE}
                    max={MAX_SIZE}
                    className="w-20 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-center text-xs text-white shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)] outline-none transition-all focus:border-red-600/40"
                  />
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min={MIN_SIZE}
                    max={MAX_SIZE}
                    value={height}
                    onChange={(event) => handleHeightChange(Number(event.target.value))}
                    className="slider-input relative z-10 h-2 w-full cursor-pointer appearance-none rounded-full bg-transparent"
                  />
                  <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-white/[0.08] shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]" />
                  <div
                    className="pointer-events-none absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.3)]"
                    style={{ width: `${pct(height)}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-600">
                  {width} x {height} px
                </span>
                <span className="text-[11px] text-gray-600">
                  {width}*{height}
                </span>
              </div>
            </div>

            <div className="mb-6 h-px bg-white/[0.06]" />

            <div className="mb-8">
              <label className="mb-2 block text-sm font-semibold tracking-wide text-white">Seed</label>
              <input
                type="text"
                value={seed}
                onChange={(event) => setSeed(event.target.value)}
                placeholder="-1"
                className="w-full max-w-[200px] rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),0_1px_0_rgba(255,255,255,0.02)] focus:border-red-600/40 focus:bg-white/[0.06]"
              />
            </div>

            <motion.button
              type="button"
              disabled={!canExecute || isProcessing}
              onClick={handleExecute}
              whileHover={canExecute && !isProcessing ? { scale: 1.01, y: -1 } : {}}
              whileTap={canExecute && !isProcessing ? { scale: 0.98 } : {}}
              className={`flex w-full items-center justify-center gap-2.5 rounded-xl px-8 py-3.5 text-sm font-semibold tracking-wide transition-all duration-300 ${
                canExecute && !isProcessing
                  ? 'cursor-pointer bg-red-600 text-white shadow-[0_4px_20px_rgba(220,38,38,0.35),0_0_60px_rgba(220,38,38,0.08),inset_0_1px_0_rgba(255,255,255,0.1)] hover:bg-red-700 hover:shadow-[0_6px_30px_rgba(220,38,38,0.45),0_0_80px_rgba(220,38,38,0.12),inset_0_1px_0_rgba(255,255,255,0.15)]'
                  : 'cursor-not-allowed bg-red-600/30 text-white/40 shadow-none'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processando edicao...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  Executar Edicao
                </>
              )}
            </motion.button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="rounded-xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-5 shadow-[0_4px_25px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm sm:p-7"
          >
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-red-500" />
                <h2 className="text-base font-bold text-white">Historico</h2>
              </div>
              {history.length > 0 && (
                <button
                  onClick={() => void clearHistory()}
                  className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-semibold tracking-wide text-gray-400 transition-all hover:bg-white/[0.07] hover:text-white"
                >
                  <Trash className="h-3 w-3" />
                  Limpar
                </button>
              )}
            </div>

            {isLoadingHistory ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Sincronizando historico...
              </div>
            ) : history.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-600">Nenhum historico de edicao ainda.</p>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {history.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20, height: 0 }}
                      className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 shadow-[0_2px_10px_rgba(0,0,0,0.2)]"
                    >
                      <p className="mb-3 text-[11px] text-gray-600">
                        {new Date(item.createdAt).toLocaleString()} - {item.size}
                      </p>

                      <div className="mb-4 flex gap-4">
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
                          <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                        </div>
                        <p className="line-clamp-3 flex-1 text-xs leading-relaxed text-gray-400">{item.prompt}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <button
                          onClick={() => void toggleFavorite(item.id)}
                          className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-semibold tracking-wide transition-all ${
                            item.favorite
                              ? 'border-red-600/25 bg-red-600/15 text-red-400'
                              : 'border-white/[0.06] bg-white/[0.03] text-gray-500 hover:bg-white/[0.06] hover:text-gray-300'
                          }`}
                        >
                          <Star className={`h-3 w-3 ${item.favorite ? 'fill-current' : ''}`} />
                          Favoritar
                        </button>
                        <button
                          onClick={() => restoreHistoryItem(item)}
                          className="flex items-center justify-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[11px] font-semibold tracking-wide text-gray-500 transition-all hover:bg-white/[0.06] hover:text-gray-300"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Reabrir
                        </button>
                        <a
                          href={item.imageUrl}
                          download
                          className="flex items-center justify-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[11px] font-semibold tracking-wide text-gray-500 transition-all hover:bg-white/[0.06] hover:text-gray-300"
                        >
                          <Download className="h-3 w-3" />
                          Baixar
                        </a>
                        <button
                          onClick={() => void removeHistory(item.id)}
                          className="flex items-center justify-center gap-1.5 rounded-lg border border-red-600/15 bg-red-600/[0.06] px-3 py-2 text-[11px] font-semibold tracking-wide text-red-400/70 transition-all hover:bg-red-600/15 hover:text-red-400"
                        >
                          <Trash2 className="h-3 w-3" />
                          Remover
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="min-w-0 flex-1 lg:max-w-[400px]"
        >
          <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-white/[0.01] shadow-[0_4px_25px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm lg:sticky lg:top-24">
            <div className="flex items-center gap-2 border-b border-white/[0.06] px-5 py-3.5">
              <ImageIcon className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-bold text-white">Resultado</span>
              {resultImage && (
                <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                  <Sparkles className="h-3 w-3" />
                  Concluido
                </span>
              )}
            </div>

            <div className="relative aspect-[3/4] bg-black/20">
              {isProcessing ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <div className="relative">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                      className="h-16 w-16 rounded-full border-2 border-transparent border-r-red-500/30 border-t-red-500"
                    />
                    <Wand2 className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-red-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-white">Processando edicao...</p>
                    <p className="mt-1 text-xs text-gray-500">Aplicando as alteracoes</p>
                  </div>
                  <div className="h-1 w-48 overflow-hidden rounded-full bg-white/[0.06]">
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 3.5, ease: 'easeInOut' }}
                      className="h-full rounded-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.4)]"
                    />
                  </div>
                </div>
              ) : resultImage ? (
                <motion.img
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6 }}
                  src={resultImage}
                  alt="Resultado da edicao"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03]">
                    <ImageIcon className="h-6 w-6 text-gray-600" />
                  </div>
                  <p className="max-w-[240px] text-center text-sm leading-relaxed text-gray-500">
                    Nenhuma edicao executada ainda.
                  </p>
                </div>
              )}
            </div>

            {resultImage && !isProcessing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 border-t border-white/[0.06] px-5 py-3.5">
                <a
                  href={resultImage}
                  download
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs font-semibold tracking-wide text-gray-300 transition-all hover:bg-white/[0.07]"
                >
                  <Download className="h-3 w-3" />
                  Baixar
                </a>
                <button
                  onClick={() => {
                    if (latestResultGalleryId) {
                      void toggleFavorite(latestResultGalleryId)
                    }
                  }}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs font-semibold tracking-wide text-gray-300 transition-all hover:bg-white/[0.07]"
                >
                  <Star className="h-3 w-3" />
                  Favoritar
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
