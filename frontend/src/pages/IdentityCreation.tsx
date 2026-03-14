import { useCallback, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  AlertCircle,
  Check,
  Key,
  Loader2,
  ShieldAlert,
  Sparkles,
  Upload,
  User,
  X,
} from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { useCurrentUserId } from '@/hooks/useCurrentUserId'
import { loraService } from '@/services/lora.service'

interface UploadedFile {
  id: string
  file: File
  preview: string
}

const MIN_PHOTOS = 5
const MAX_PHOTOS = 20
const MAX_SIZE_MB = 10

export function IdentityCreation() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [modelName, setModelName] = useState('')
  const [triggerWord, setTriggerWord] = useState('')
  const [enableNsfw, setEnableNsfw] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const userId = useCurrentUserId()

  const handleFiles = useCallback(
    (incoming: FileList | null) => {
      if (!incoming) return

      const accepted: UploadedFile[] = []

      for (let index = 0; index < incoming.length; index += 1) {
        const file = incoming[index]
        if (!file.type.startsWith('image/')) continue
        if (file.size > MAX_SIZE_MB * 1024 * 1024) continue
        if (files.length + accepted.length >= MAX_PHOTOS) break

        accepted.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          file,
          preview: URL.createObjectURL(file),
        })
      }

      setFiles((current) => [...current, ...accepted])
    },
    [files.length],
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

    setIsLoading(true)
    try {
      const formData = new FormData()
      files.forEach((file) => formData.append('referencePhotos', file.file))
      formData.append('userId', userId)
      formData.append('modelName', modelName)
      formData.append('enableNsfw', enableNsfw.toString())

      const uploadResponse = await loraService.uploadReferencePhotos(formData)
      const referencePhotos = uploadResponse.saved.map((file) => file.path)

      await loraService.createLoRA({
        userId,
        modelName,
        triggerWord,
        enableNsfw,
        referencePhotos,
      })

      toast({
        title: 'Sucesso',
        description: 'Soul ID iniciado. Voce pode acompanhar o status no dashboard.',
      })
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } }
      toast({
        title: 'Erro',
        description: err.response?.data?.detail || 'Falha ao criar identidade',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const isValid = files.length >= MIN_PHOTOS && modelName.trim() && triggerWord.trim()

  return (
    <div className="mx-auto max-w-[800px] p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Criar Nova Identidade</h1>
      </motion.div>

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="rounded-xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-5 shadow-[0_4px_25px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm sm:p-8"
      >
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
                  Minimo {MIN_PHOTOS}, maximo {MAX_PHOTOS} fotos. Tamanho maximo: {MAX_SIZE_MB}MB cada.
                </p>
                <p className="mt-1 text-[11px] text-gray-600">Use fotos claras do rosto, angulos variados e boa iluminacao.</p>
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
                    <span className={files.length >= MIN_PHOTOS ? 'text-emerald-400' : 'text-red-400'}>{files.length}</span>/{MAX_PHOTOS} fotos
                  </span>
                  {files.length >= MIN_PHOTOS && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                      <Check className="h-3 w-3" />
                      Minimo atingido
                    </span>
                  )}
                </div>

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
            placeholder="Palavra que ativa o LoRA"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),0_1px_0_rgba(255,255,255,0.02)] focus:border-red-600/40 focus:bg-white/[0.06] focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),0_0_20px_rgba(220,38,38,0.06)]"
          />
          <p className="ml-0.5 mt-1.5 text-[11px] text-gray-600">Use uma palavra unica que nao apareca em prompts normais.</p>
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
            Esta flag e critica e prepara o modelo para conteudo explicito.
          </p>
        </div>

        <motion.button
          type="submit"
          disabled={!isValid || isLoading}
          whileHover={isValid && !isLoading ? { scale: 1.01, y: -1 } : {}}
          whileTap={isValid && !isLoading ? { scale: 0.98 } : {}}
          className={`flex items-center justify-center gap-2.5 rounded-xl px-8 py-3.5 text-sm font-semibold tracking-wide transition-all duration-300 ${
            isValid && !isLoading
              ? 'cursor-pointer bg-red-600 text-white shadow-[0_4px_20px_rgba(220,38,38,0.35),0_0_60px_rgba(220,38,38,0.08),inset_0_1px_0_rgba(255,255,255,0.1)] hover:bg-red-700 hover:shadow-[0_6px_30px_rgba(220,38,38,0.45),0_0_80px_rgba(220,38,38,0.12),inset_0_1px_0_rgba(255,255,255,0.15)]'
              : 'cursor-not-allowed bg-red-600/30 text-white/40 shadow-none'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Treinando modelo...
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
                Adicione pelo menos {MIN_PHOTOS} fotos ({files.length}/{MIN_PHOTOS})
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
      </motion.form>

      <div className="h-8" />
    </div>
  )
}
