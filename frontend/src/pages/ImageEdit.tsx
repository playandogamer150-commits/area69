import { useEffect, useRef, useState } from 'react'
import { ImageEditUpload } from '@/components/edit/ImageEditUpload'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/useToast'
import { useCurrentUserId } from '@/hooks/useCurrentUserId'
import { imageEditService } from '@/services/image-edit.service'
import { ChevronLeft, ChevronRight, Clock3, Download, Loader2, RotateCcw, Sparkles, Star, Trash2 } from 'lucide-react'
import { ImageEditHistoryItem, loadImageEditHistory, saveImageEditHistory } from '@/utils/image-edit-history'

const RESOLUTION_MIN = 256
const RESOLUTION_MAX = 2048

const aspectRatios = [
  { label: '1:1', width: 1, height: 1 },
  { label: '16:9', width: 16, height: 9 },
  { label: '9:16', width: 9, height: 16 },
  { label: '4:3', width: 4, height: 3 },
  { label: '3:4', width: 3, height: 4 },
  { label: '3:2', width: 3, height: 2 },
  { label: '2:3', width: 2, height: 3 },
]

const clampResolution = (value: number) => Math.max(RESOLUTION_MIN, Math.min(RESOLUTION_MAX, value))

const snapResolution = (value: number) => Math.round(clampResolution(value) / 64) * 64

export function ImageEdit() {
  const [files, setFiles] = useState<Array<File | null>>([null])
  const [prompt, setPrompt] = useState('')
  const [width, setWidth] = useState(1024)
  const [height, setHeight] = useState(1024)
  const [selectedRatio, setSelectedRatio] = useState('1:1')
  const [seed, setSeed] = useState('-1')
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [progressValue, setProgressValue] = useState(0)
  const [statusLabel, setStatusLabel] = useState('idle')
  const [history, setHistory] = useState<ImageEditHistoryItem[]>([])
  const [historyCollapsed, setHistoryCollapsed] = useState(false)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()
  const userId = useCurrentUserId()

  const size = `${width}*${height}`

  useEffect(() => {
    setHistory(loadImageEditHistory())

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  const saveHistory = (items: ImageEditHistoryItem[]) => {
    setHistory(items)
    saveImageEditHistory(items)
  }

  const pushHistoryItem = (imageUrl: string, taskId: string) => {
    const nextItem: ImageEditHistoryItem = {
      id: taskId,
      imageUrl,
      prompt,
      size,
      createdAt: new Date().toISOString(),
      favorite: false,
    }
    const deduped = history.filter((item) => item.id !== taskId)
    saveHistory([nextItem, ...deduped].slice(0, 12))
  }

  const pollStatus = async (taskId: string) => {
    try {
      const response = await imageEditService.getStatus(taskId)
      setStatusLabel(response.status)
      if (response.status === 'completed' && response.imageUrl) {
        setResult(response.imageUrl)
        pushHistoryItem(response.imageUrl, taskId)
        setIsProcessing(false)
        setProgressValue(100)
        if (pollingRef.current) clearInterval(pollingRef.current)
        toast({ title: 'Sucesso', description: 'Edicao concluida com sucesso!' })
      } else if (response.status === 'failed') {
        setIsProcessing(false)
        setProgressValue(100)
        if (pollingRef.current) clearInterval(pollingRef.current)
        toast({ title: 'Erro', description: 'Falha ao editar imagem', variant: 'destructive' })
      } else {
        setProgressValue((current) => Math.min(current + 7, 92))
      }
    } catch {
      setIsProcessing(false)
      setStatusLabel('failed')
      setProgressValue(100)
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }

  const handleSubmit = async () => {
    const selectedFiles = files.filter((file): file is File => Boolean(file))

    if (!selectedFiles.length) {
      toast({ title: 'Erro', description: 'Selecione ao menos uma imagem', variant: 'destructive' })
      return
    }
    if (!prompt.trim()) {
      toast({ title: 'Erro', description: 'Descreva a edicao desejada', variant: 'destructive' })
      return
    }

    setIsProcessing(true)
    setResult(null)
    setProgressValue(10)
    setStatusLabel('uploading')
    try {
      const formData = new FormData()
      selectedFiles.forEach((file) => formData.append('images', file))
      formData.append('userId', userId)

      const uploadResponse = await imageEditService.uploadImages(formData)
      const response = await imageEditService.editImage({
        userId,
        images: uploadResponse.saved.map((file) => file.path),
        prompt,
        size,
        seed: Number(seed || '-1'),
      })

      if (response.status === 'completed' && response.imageUrl) {
        setResult(response.imageUrl)
        pushHistoryItem(response.imageUrl, response.taskId)
        setIsProcessing(false)
        setProgressValue(100)
        setStatusLabel('completed')
      } else if (response.taskId) {
        setProgressValue(25)
        setStatusLabel(response.status)
        if (pollingRef.current) clearInterval(pollingRef.current)
        pollingRef.current = setInterval(() => pollStatus(response.taskId), 3000)
        toast({ title: 'Processando', description: 'Edicao enviada para a WaveSpeed.' })
      }
    } catch (error: any) {
      setIsProcessing(false)
      setStatusLabel('failed')
      setProgressValue(100)
      toast({
        title: 'Erro',
        description: error.response?.data?.detail || 'Falha ao iniciar edicao',
        variant: 'destructive',
      })
    }
  }

  const applyAspectRatio = (ratioLabel: string) => {
    const ratio = aspectRatios.find((item) => item.label === ratioLabel)
    if (!ratio) return

    const nextWidth = snapResolution(width)
    const nextHeight = snapResolution((nextWidth * ratio.height) / ratio.width)

    if (nextHeight > RESOLUTION_MAX) {
      const adjustedHeight = RESOLUTION_MAX
      const adjustedWidth = snapResolution((adjustedHeight * ratio.width) / ratio.height)
      setWidth(clampResolution(adjustedWidth))
      setHeight(clampResolution(adjustedHeight))
    } else {
      setWidth(clampResolution(nextWidth))
      setHeight(clampResolution(nextHeight))
    }

    setSelectedRatio(ratioLabel)
  }

  const handleWidthChange = (value: number) => {
    setWidth(snapResolution(value))
  }

  const handleHeightChange = (value: number) => {
    setHeight(snapResolution(value))
  }

  const restoreHistoryItem = (item: ImageEditHistoryItem) => {
    setPrompt(item.prompt)
    setResult(item.imageUrl)
    const [historyWidth, historyHeight] = item.size.split('*').map((value) => Number(value))
    if (historyWidth) setWidth(historyWidth)
    if (historyHeight) setHeight(historyHeight)
  }

  const clearHistory = () => {
    saveHistory([])
  }

  const toggleFavorite = (id: string) => {
    const updated = history.map((item) => item.id === id ? { ...item, favorite: !item.favorite } : item)
    updated.sort((a, b) => Number(Boolean(b.favorite)) - Number(Boolean(a.favorite)) || b.createdAt.localeCompare(a.createdAt))
    saveHistory(updated)
  }

  const removeHistoryItem = (id: string) => {
    saveHistory(history.filter((item) => item.id !== id))
  }

  const readableStatus = (() => {
    if (!isProcessing && statusLabel === 'idle') return 'pronto'
    switch (statusLabel) {
      case 'uploading':
        return 'enviando arquivos'
      case 'created':
        return 'criado'
      case 'pending':
        return 'na fila'
      case 'processing':
        return 'processando'
      case 'completed':
        return 'concluido'
      case 'failed':
        return 'falhou'
      default:
        return statusLabel || 'processando'
    }
  })()

  return (
    <div className="p-8">
      <div className="grid grid-cols-[minmax(0,1fr)_420px] gap-8 items-start">
      <div className="space-y-6 min-w-0">
        <Card>
          <CardHeader>
            <CardTitle>Editar Imagem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Images</Label>
              <ImageEditUpload files={files} onFilesSelected={setFiles} maxFiles={6} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editPrompt">Prompt</Label>
              <Textarea
                id="editPrompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Descreva a edicao desejada..."
                className="min-h-32"
              />
            </div>

            <div className="space-y-4 rounded-lg border p-4 bg-background/80">
              <div className="flex items-center justify-between">
                <Label>Size</Label>
                <span className="text-xs text-muted-foreground">Range: {RESOLUTION_MIN} - {RESOLUTION_MAX}</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {aspectRatios.map((ratio) => (
                  <Button
                    key={ratio.label}
                    type="button"
                    variant={selectedRatio === ratio.label ? 'default' : 'outline'}
                    size="sm"
                    className="min-w-14"
                    onClick={() => applyAspectRatio(ratio.label)}
                  >
                    {ratio.label}
                  </Button>
                ))}
              </div>

              <div className="grid grid-cols-[1fr_120px] gap-4 items-center">
                <div className="space-y-2">
                  <Label>Width</Label>
                  <Slider min={RESOLUTION_MIN} max={RESOLUTION_MAX} step={64} value={[width]} onValueChange={([v]) => handleWidthChange(v)} />
                </div>
                <Input value={String(width)} onChange={(e) => handleWidthChange(Number(e.target.value) || RESOLUTION_MIN)} />
              </div>

              <div className="grid grid-cols-[1fr_120px] gap-4 items-center">
                <div className="space-y-2">
                  <Label>Height</Label>
                  <Slider min={RESOLUTION_MIN} max={RESOLUTION_MAX} step={64} value={[height]} onValueChange={([v]) => handleHeightChange(v)} />
                </div>
                <Input value={String(height)} onChange={(e) => handleHeightChange(Number(e.target.value) || RESOLUTION_MIN)} />
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{width} x {height} px</span>
                <span>{size}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="seed">Seed</Label>
                <Input id="seed" value={seed} onChange={(e) => setSeed(e.target.value)} placeholder="-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSubmit} disabled={isProcessing} className="w-full">
          {isProcessing ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Editando...
            </span>
          ) : 'Executar Edicao'}
        </Button>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <Clock3 className="w-5 h-5 text-primary" />
              <CardTitle>Historico</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {history.length > 0 && (
                <Button type="button" variant="outline" size="sm" onClick={clearHistory}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpar
                </Button>
              )}
              <Button type="button" variant="outline" size="icon" onClick={() => setHistoryCollapsed((value) => !value)}>
                {historyCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </Button>
            </div>
          </CardHeader>
          {!historyCollapsed && (
            <CardContent>
              {history.length > 0 ? (
                <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                  {history.map((item) => (
                    <div key={item.id} className="rounded-2xl border bg-background/80 p-4">
                      <div className="flex gap-4">
                        <button type="button" onClick={() => restoreHistoryItem(item)} className="shrink-0">
                          <img src={item.imageUrl} alt="History item" className="w-24 h-24 object-cover rounded-xl border" />
                        </button>
                        <div className="min-w-0 flex-1 space-y-3">
                          <div className="text-xs text-muted-foreground">
                            {new Date(item.createdAt).toLocaleString()} - {item.size}
                          </div>
                          <p className="text-sm leading-6 line-clamp-3">{item.prompt}</p>
                          <div className="grid grid-cols-2 gap-2">
                            <Button type="button" size="sm" variant={item.favorite ? 'default' : 'outline'} onClick={() => toggleFavorite(item.id)}>
                              <Star className={`w-4 h-4 mr-2 ${item.favorite ? 'fill-current' : ''}`} />
                              {item.favorite ? 'Favorito' : 'Favoritar'}
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => restoreHistoryItem(item)}>
                              <RotateCcw className="w-4 h-4 mr-2" />
                              Reabrir
                            </Button>
                            <Button type="button" size="sm" variant="outline" asChild>
                              <a href={item.imageUrl} target="_blank" rel="noreferrer">
                                <Download className="w-4 h-4 mr-2" />
                                Baixar
                              </a>
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => removeHistoryItem(item.id)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remover
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground text-center">
                  As edicoes geradas vao aparecendo aqui para reuso rapido.
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </div>

      <aside className="sticky top-6 self-start">
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Resultado</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {isProcessing ? (
              <div className="h-[540px] flex items-center justify-center text-muted-foreground text-center">
                <div className="flex flex-col items-center gap-4 w-full max-w-sm">
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                    <div className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                    <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                  </div>
                  <div className="space-y-3 w-full">
                    <p className="font-medium text-foreground">Gerando sua edicao...</p>
                    <div className="space-y-2 text-left">
                      <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        <span>Status</span>
                        <span>{readableStatus}</span>
                      </div>
                      <Progress value={progressValue} className="h-2" />
                      <div className="text-xs text-muted-foreground text-right">{progressValue}%</div>
                    </div>
                    <p className="text-sm text-muted-foreground">A imagem editada aparecera aqui quando a WaveSpeed concluir.</p>
                  </div>
                </div>
              </div>
            ) : result ? (
              <img src={result} alt="Edited output" className="w-full rounded-lg" />
            ) : (
              <div className="h-[540px] flex items-center justify-center text-muted-foreground text-center">
                Nenhuma edicao executada ainda.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </aside>
      </div>
    </div>
  )
}
