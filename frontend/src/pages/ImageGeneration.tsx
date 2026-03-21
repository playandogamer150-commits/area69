import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import {
  ChevronDown,
  Download,
  ImageIcon,
  Loader2,
  Save,
  Sparkles,
  Upload,
  X,
} from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { useCurrentUserId } from '@/hooks/useCurrentUserId'
import type { GenerationResponse, ImageEditRequest } from '@/types/api.types'
import { generateService } from '@/services/generate.service'
import { galleryService } from '@/services/gallery.service'
import { getApiErrorMessage } from '@/utils/api-error'
import { type ImageEditHistoryItem, loadImageEditHistory, saveImageEditHistory } from '@/utils/image-edit-history'

const ASPECT_RATIOS: Array<'9:16' | '16:9' | '4:3' | '3:4' | '1:1' | '2:3' | '3:2'> = ['9:16', '16:9', '4:3', '3:4', '1:1', '2:3', '3:2']
const RESOLUTIONS: Array<'720p' | '1080p'> = ['720p', '1080p']
const RESULT_IMAGE_OPTIONS: Array<1 | 4> = [1, 4]
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

export function ImageGeneration() {
  const { toast } = useToast()
  const userId = useCurrentUserId()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [prompt, setPrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '4:3' | '3:4' | '1:1' | '2:3' | '3:2'>('9:16')
  const [resolution, setResolution] = useState<'720p' | '1080p'>('1080p')
  const [resultImages, setResultImages] = useState<1 | 4>(1)
  const [referenceImages, setReferenceImages] = useState<UploadedReferenceImage[]>([])
  const [isUploadingReferences, setIsUploadingReferences] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [selectedGeneratedImage, setSelectedGeneratedImage] = useState<string | null>(null)
  const [editHistory, setEditHistory] = useState<ImageEditHistoryItem[]>([])

  useEffect(() => {
    setEditHistory(loadImageEditHistory())
  }, [])

  const canGenerate = useMemo(() => {
    return prompt.trim().length > 0 && referenceImages.length > 0 && !isUploadingReferences
  }, [prompt, referenceImages, isUploadingReferences])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const validFiles: File[] = []
    for (const file of Array.from(files)) {
      if (file.size > MAX_REFERENCE_IMAGE_SIZE_MB * 1024 * 1024) {
        toast({
          title: 'Arquivo muito grande',
          description: `${file.name} excede ${MAX_REFERENCE_IMAGE_SIZE_MB}MB`,
          variant: 'destructive',
        })
        continue
      }
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Tipo invalido',
          description: `${file.name} nao e uma imagem`,
          variant: 'destructive',
        })
        continue
      }
      validFiles.push(file)
    }

    if (validFiles.length === 0) return
    if (referenceImages.length + validFiles.length > MAX_REFERENCE_IMAGES) {
      toast({
        title: 'Limite excedido',
        description: `Maximo de ${MAX_REFERENCE_IMAGES} imagens de referencia`,
        variant: 'destructive',
      })
      return
    }

    setIsUploadingReferences(true)
    try {
      const formData = new FormData()
      formData.append('userId', userId)
      for (const file of validFiles) {
        formData.append('files', file)
      }

      const response = await generateService.uploadReferenceImages(formData)
      const newImages: UploadedReferenceImage[] = response.saved.map((item) => ({
        id: crypto.randomUUID(),
        publicUrl: item.publicUrl,
        filename: item.filename,
      }))

      setReferenceImages((prev) => [...prev, ...newImages])
      toast({
        title: 'Imagens carregadas',
        description: `${validFiles.length} imagem(ns) adicionada(s)`,
      })
    } catch (error) {
      toast({
        title: 'Erro no upload',
        description: getApiErrorMessage(error),
        variant: 'destructive',
      })
    } finally {
      setIsUploadingReferences(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemoveReference = (id: string) => {
    setReferenceImages((prev) => prev.filter((img) => img.id !== id))
  }

  const handleGenerate = async () => {
    if (!canGenerate) return

    setIsGenerating(true)
    try {
      const response: GenerationResponse = await generateService.generateImage({
        prompt: prompt.trim(),
        aspectRatio,
        resolution,
        resultImages,
        referenceImageUrls: referenceImages.map((img) => img.publicUrl),
      })

      if (response.ok && response.imageUrls) {
        setGeneratedImages(response.imageUrls)
        setSelectedGeneratedImage(response.imageUrls[0])
        toast({
          title: 'Imagem gerada',
          description: 'Sua imagem foi criada com sucesso',
        })
      } else {
        throw new Error(response.message || 'Falha na geracao')
      }
    } catch (error) {
      toast({
        title: 'Erro na geracao',
        description: getApiErrorMessage(error),
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveToGallery = async (imageUrl: string) => {
    try {
      await galleryService.saveToGallery({
        userId,
        imageUrl,
        prompt: prompt.trim(),
        sourceType: 'image_generation',
        size: `${aspectRatio} @ ${resolution}`,
      })
      toast({
        title: 'Salva na galeria',
        description: 'Imagem adicionada a sua galeria',
      })
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: getApiErrorMessage(error),
        variant: 'destructive',
      })
    }
  }

  const handleDownload = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `area69-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      toast({
        title: 'Erro no download',
        description: 'Nao foi possivel baixar a imagem',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="min-h-screen bg-black px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-wide text-white sm:text-3xl">Gerar Imagem</h1>
          <p className="mt-1 text-sm text-gray-500">
            Use Seedream 4.5 para criar imagens ultra-realistas a partir de uma foto de referencia
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left: Input */}
          <div className="space-y-6">
            {/* Reference Images */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Imagens de referencia</h3>
                <span className="text-xs text-gray-500">
                  {referenceImages.length}/{MAX_REFERENCE_IMAGES}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {referenceImages.map((img) => (
                  <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg border border-white/[0.08]">
                    <img src={img.publicUrl} alt={img.filename} className="h-full w-full object-cover" />
                    <button
                      onClick={() => handleRemoveReference(img.id)}
                      className="absolute right-1 top-1 rounded bg-black/80 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </div>
                ))}

                {referenceImages.length < MAX_REFERENCE_IMAGES && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingReferences}
                    className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-white/[0.16] bg-white/[0.02] transition-colors hover:border-white/[0.32] hover:bg-white/[0.04] disabled:opacity-50"
                  >
                    {isUploadingReferences ? (
                      <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                    ) : (
                      <Upload className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Prompt */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <label className="mb-2 block text-sm font-semibold tracking-wide text-white">Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Descreva a imagem que voce quer criar..."
                className="min-h-[120px] w-full resize-none rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-red-600/40 focus:outline-none"
              />
              <p className="mt-2 text-[11px] text-gray-600">
                Dica: Seja especifico sobre poses, cenarios e estilo para melhores resultados.
              </p>
            </div>

            {/* Settings */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Proporcao"
                value={aspectRatio}
                onChange={(v) => setAspectRatio(v as typeof aspectRatio)}
                options={ASPECT_RATIOS.map((ar) => ({ value: ar, label: ar }))}
              />
              <Select
                label="Resolucao"
                value={resolution}
                onChange={(v) => setResolution(v as typeof resolution)}
                options={RESOLUTIONS.map((r) => ({ value: r, label: r }))}
              />
            </div>

            <OptionPills
              label="Quantidade"
              value={resultImages}
              onChange={(v) => setResultImages(v)}
              options={RESULT_IMAGE_OPTIONS}
            />

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!canGenerate || isGenerating}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Gerar Imagem
                </>
              )}
            </button>
          </div>

          {/* Right: Output */}
          <div className="space-y-6">
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <h3 className="mb-3 text-sm font-semibold text-white">Resultado</h3>

              {generatedImages.length === 0 ? (
                <div className="flex aspect-[9/16] items-center justify-center rounded-lg border border-dashed border-white/[0.16] bg-white/[0.02]">
                  <div className="text-center">
                    <ImageIcon className="mx-auto h-8 w-8 text-gray-600" />
                    <p className="mt-2 text-sm text-gray-600">Nenhuma imagem gerada</p>
                    <p className="text-xs text-gray-700">Adicione referencias e descreva sua imagem</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Main Image */}
                  <div className="aspect-[9/16] overflow-hidden rounded-lg border border-white/[0.08]">
                    <img
                      src={selectedGeneratedImage || generatedImages[0]}
                      alt="Generated"
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Thumbnails */}
                  {generatedImages.length > 1 && (
                    <div className="flex gap-2">
                      {generatedImages.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedGeneratedImage(img)}
                          className={`h-16 w-16 overflow-hidden rounded-lg border transition-all ${
                            selectedGeneratedImage === img
                              ? 'border-red-500'
                              : 'border-white/[0.08] hover:border-white/[0.32]'
                          }`}
                        >
                          <img src={img} alt={`Generated ${i + 1}`} className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveToGallery(selectedGeneratedImage || generatedImages[0])}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm text-white transition-colors hover:bg-white/[0.08]"
                    >
                      <Save className="h-4 w-4" />
                      Salvar
                    </button>
                    <button
                      onClick={() => handleDownload(selectedGeneratedImage || generatedImages[0])}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm text-white transition-colors hover:bg-white/[0.08]"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}