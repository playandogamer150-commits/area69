import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { ChevronDown, ImageIcon, Loader2, Sparkles, Wand2 } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { useCurrentUserId } from '@/hooks/useCurrentUserId'
import type { GenerationRequest, LoRAStatus } from '@/types/api.types'
import { loraService } from '@/services/lora.service'
import { generateService } from '@/services/generate.service'
import { getApiErrorMessage } from '@/utils/api-error'

const defaultGenerationValues: Omit<GenerationRequest, 'prompt' | 'negativePrompt' | 'loraName'> = {
  cumEffect: 0.5,
  makeup: 0.5,
  pose: 'standing',
  strength: 0.7,
  loraStrength: 0.8,
  girlLoraStrength: 0.8,
  width: 1024,
  height: 1024,
  seed: undefined,
  steps: 30,
  guidanceScale: 7,
}

const poseOptions = [
  { value: 'standing', label: 'Em pe' },
  { value: 'sitting', label: 'Sentada' },
  { value: 'lying', label: 'Deitada' },
  { value: 'back', label: 'De costas' },
  { value: 'side', label: 'De lado' },
  { value: 'crouching', label: 'Agachada' },
  { value: 'closeup_face', label: 'Close-up rosto' },
] as const

function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  suffix = '%',
}: {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  suffix?: string
}) {
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div>
      <label className="text-sm font-semibold tracking-wide text-white">{label}</label>
      <div className="relative mt-2">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="slider-input relative z-10 h-2 w-full cursor-pointer appearance-none rounded-full bg-transparent"
        />
        <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-white/[0.08] shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]" />
        <div
          className="pointer-events-none absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.3)]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="mt-1 block text-xs text-red-400">
        {value}
        {suffix}
      </span>
    </div>
  )
}

function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string; disabled?: boolean }[]
  placeholder?: string
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
          {placeholder && (
            <option value="" className="bg-neutral-900 text-gray-400">
              {placeholder}
            </option>
          )}
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

export function ImageGeneration() {
  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [selectedLoRA, setSelectedLoRA] = useState('')
  const [generationValues, setGenerationValues] = useState(defaultGenerationValues)
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [loras, setLoras] = useState<LoRAStatus[]>([])
  const { toast } = useToast()
  const userId = useCurrentUserId()
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const loadLoras = async () => {
      try {
        const userLoras = await loraService.getUserLoRAs(userId)
        setLoras((userLoras || []).filter((item) => item && item.status !== 'failed'))
      } catch {
        setLoras([])
      }
    }

    loadLoras()
  }, [userId])

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  const pollStatus = async (taskId: string) => {
    try {
      const response = await generateService.getGenerationStatus(taskId)
      if (response.status === 'completed' && response.imageUrl) {
        setResult(response.imageUrl)
        setIsGenerating(false)
        if (pollingRef.current) clearInterval(pollingRef.current)
        toast({ title: 'Sucesso', description: 'Imagem gerada com sucesso!' })
      } else if (response.status === 'failed') {
        setIsGenerating(false)
        if (pollingRef.current) clearInterval(pollingRef.current)
        toast({ title: 'Erro', description: 'Falha na geracao da imagem', variant: 'destructive' })
      }
    } catch {
      // ignore transient polling errors
    }
  }

  const handleGenerate = async () => {
    if (!selectedLoRA || !prompt.trim()) {
      toast({ title: 'Erro', description: 'Selecione uma identidade e escreva um prompt', variant: 'destructive' })
      return
    }

    const selectedModel = loras.find((item) => item.modelName === selectedLoRA)
    if (selectedModel && selectedModel.status !== 'ready') {
      toast({
        title: 'Aviso',
        description: `Esta identidade ainda nao terminou o treinamento (status: ${selectedModel.status}).`,
        variant: 'destructive',
      })
      return
    }

    setIsGenerating(true)
    setResult(null)

    try {
      const response = await generateService.generateImage({
        ...generationValues,
        prompt,
        negativePrompt,
        loraName: selectedLoRA,
      })

      if (response.status === 'completed' && response.imageUrl) {
        setResult(response.imageUrl)
        setIsGenerating(false)
        toast({ title: 'Sucesso', description: 'Imagem gerada com sucesso!' })
      } else if (response.status === 'processing' && response.taskId) {
        if (pollingRef.current) clearInterval(pollingRef.current)
        pollingRef.current = setInterval(() => pollStatus(response.taskId), 3000)
        toast({ title: 'Processando', description: 'Geracao iniciada, aguardando resultado...' })
      } else {
        setIsGenerating(false)
        toast({ title: 'Erro', description: 'Resposta invalida do servidor', variant: 'destructive' })
      }
    } catch (error) {
      setIsGenerating(false)
      toast({ title: 'Erro', description: getApiErrorMessage(error, 'Falha ao gerar imagem'), variant: 'destructive' })
    }
  }

  const canGenerate = prompt.trim() && selectedLoRA

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

      <div className="flex flex-col gap-6 lg:flex-row">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="min-w-0 flex-1 lg:max-w-[560px]"
        >
          <div className="rounded-xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-5 shadow-[0_4px_25px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm sm:p-7">
            <div className="mb-5">
              <label className="mb-2 block text-sm font-semibold tracking-wide text-white">Prompt</label>
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Descreva a imagem que deseja gerar..."
                rows={3}
                className="min-h-[80px] w-full resize-y rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),0_1px_0_rgba(255,255,255,0.02)] focus:border-red-600/40 focus:bg-white/[0.06] focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),0_0_20px_rgba(220,38,38,0.06)]"
              />
            </div>

            <div className="mb-5">
              <label className="mb-2 block text-sm font-semibold tracking-wide text-white">Prompt Negativo</label>
              <textarea
                value={negativePrompt}
                onChange={(event) => setNegativePrompt(event.target.value)}
                placeholder="O que voce NAO quer na imagem"
                rows={2}
                className="min-h-[56px] w-full resize-y rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),0_1px_0_rgba(255,255,255,0.02)] focus:border-red-600/40 focus:bg-white/[0.06] focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),0_0_20px_rgba(220,38,38,0.06)]"
              />
            </div>

            <div className="mb-5 h-px bg-white/[0.06]" />

            <div className="mb-6">
              <Select
                label="Modelo LoRA (Identidade)"
                value={selectedLoRA}
                onChange={setSelectedLoRA}
                placeholder="Selecionar identidade"
                options={
                  loras.length
                    ? loras.map((item) => ({
                        value: item.modelName,
                        label: item.status === 'ready' ? item.modelName : `${item.modelName} (${item.status})`,
                        disabled: item.status !== 'ready',
                      }))
                    : [{ value: '', label: 'Nenhuma identidade encontrada', disabled: true }]
                }
              />
            </div>

            <div className="mb-6 space-y-5">
              <Slider
                label="Efeito Cum"
                value={Math.round(generationValues.cumEffect * 100)}
                onChange={(value) => setGenerationValues((current) => ({ ...current, cumEffect: value / 100 }))}
              />
              <Slider
                label="Maquiagem"
                value={Math.round(generationValues.makeup * 100)}
                onChange={(value) => setGenerationValues((current) => ({ ...current, makeup: value / 100 }))}
              />
            </div>

            <div className="mb-6">
              <Select
                label="Pose"
                value={generationValues.pose}
                onChange={(value) => setGenerationValues((current) => ({ ...current, pose: value }))}
                options={[...poseOptions]}
              />
            </div>

            <div className="mb-6 space-y-5">
              <Slider
                label="Intensidade NSFW"
                value={Math.round(generationValues.strength * 100)}
                onChange={(value) => setGenerationValues((current) => ({ ...current, strength: value / 100 }))}
              />
              <Slider
                label="Forca da Identidade (LoRA)"
                value={Math.round(generationValues.loraStrength * 100)}
                onChange={(value) => setGenerationValues((current) => ({ ...current, loraStrength: value / 100 }))}
              />
              <Slider
                label="Forca Identidade Feminina"
                value={Math.round((generationValues.girlLoraStrength ?? 0) * 100)}
                onChange={(value) => setGenerationValues((current) => ({ ...current, girlLoraStrength: value / 100 }))}
              />
            </div>

            <div className="mb-6 h-px bg-white/[0.06]" />

            <motion.button
              type="button"
              disabled={!canGenerate || isGenerating}
              onClick={handleGenerate}
              whileHover={canGenerate && !isGenerating ? { scale: 1.01, y: -1 } : {}}
              whileTap={canGenerate && !isGenerating ? { scale: 0.98 } : {}}
              className={`flex w-full items-center justify-center gap-2.5 rounded-xl px-8 py-3.5 text-sm font-semibold tracking-wide transition-all duration-300 ${
                canGenerate && !isGenerating
                  ? 'cursor-pointer bg-red-600 text-white shadow-[0_4px_20px_rgba(220,38,38,0.35),0_0_60px_rgba(220,38,38,0.08),inset_0_1px_0_rgba(255,255,255,0.1)] hover:bg-red-700 hover:shadow-[0_6px_30px_rgba(220,38,38,0.45),0_0_80px_rgba(220,38,38,0.12),inset_0_1px_0_rgba(255,255,255,0.15)]'
                  : 'cursor-not-allowed bg-red-600/30 text-white/40 shadow-none'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Gerando imagem...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  Gerar Imagem
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
              {result && (
                <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                  <Sparkles className="h-3 w-3" />
                  Gerada
                </span>
              )}
            </div>

            <div className="relative aspect-[3/4] bg-black/20 sm:aspect-[4/5] lg:aspect-[3/4]">
              {isGenerating ? (
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
                    <p className="text-sm font-semibold text-white">Gerando sua imagem...</p>
                    <p className="mt-1 text-xs text-gray-500">Isso pode levar alguns segundos</p>
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
              ) : result ? (
                <motion.img
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6 }}
                  src={result}
                  alt="Imagem gerada"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03]">
                    <ImageIcon className="h-6 w-6 text-gray-600" />
                  </div>
                  <p className="max-w-[260px] text-center text-sm leading-relaxed text-gray-500">
                    A imagem gerada aparecera aqui. Selecione sua identidade na esquerda.
                  </p>
                </div>
              )}
            </div>

            {result && !isGenerating && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 border-t border-white/[0.06] px-5 py-3.5">
                <button className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs font-semibold tracking-wide text-gray-300 transition-all hover:bg-white/[0.07]">
                  Salvar na Galeria
                </button>
                <button
                  onClick={handleGenerate}
                  className="flex-1 rounded-lg border border-red-600/25 bg-red-600/15 px-4 py-2 text-xs font-semibold tracking-wide text-red-400 transition-all hover:bg-red-600/25"
                >
                  Gerar Novamente
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
