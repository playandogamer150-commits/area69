import { useState, useEffect, useRef } from 'react'
import { NSFWControls } from '@/components/generation/NSFWControls'
import { PromptInput } from '@/components/generation/PromptInput'
import { NegativePromptInput } from '@/components/generation/NegativePromptInput'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
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

export function ImageGeneration() {
  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [selectedLoRA, setSelectedLoRA] = useState<string>('')
  const [generationValues, setGenerationValues] = useState(defaultGenerationValues)
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [loras, setLoras] = useState<LoRAStatus[]>([])
  const { toast } = useToast()
  const userId = useCurrentUserId()
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

   useEffect(() => {
     // Carregar identidades recém treinadas (LoRAs do usuário atual)
     const loadLoras = async () => {
       try {
         const userLoras = await loraService.getUserLoRAs(userId)
         // Filtrar apenas LoRAs que não estão com status failed
         const validLoras = (userLoras || []).filter(l => l && l.status !== 'failed')
         setLoras(validLoras)
       } catch (error) {
         console.error("Failed to load user LoRAs", error)
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
        toast({ title: 'Erro', description: 'Falha na geração da imagem', variant: 'destructive' })
      }
    } catch (error) {
      console.error("Failed to poll status", error)
    }
  }

  const handleGenerate = async () => {
    if (!selectedLoRA || !prompt) {
      toast({ title: 'Erro', description: 'Selecione uma identidade e escreva um prompt', variant: 'destructive' })
      return
    }

    const selectedModel = loras.find(l => l.modelName === selectedLoRA)
    if (selectedModel && selectedModel.status !== 'ready') {
      toast({ title: 'Aviso', description: 'Esta identidade ainda não terminou o treinamento (status: ' + selectedModel.status + ').', variant: 'destructive' })
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
        // Inicializar polling
        if (pollingRef.current) clearInterval(pollingRef.current)
        pollingRef.current = setInterval(() => pollStatus(response.taskId), 3000)
        toast({ title: 'Aviso', description: 'Geração iniciada, aguardando resultado...' })
      } else {
        setIsGenerating(false)
        toast({ title: 'Erro', description: 'Resposta inválida do servidor', variant: 'destructive' })
      }
    } catch (error) {
      setIsGenerating(false)
      const errDetail = getApiErrorMessage(error, 'Falha ao gerar imagem')
      toast({ title: 'Erro', description: errDetail, variant: 'destructive' })
    }
  }

  return (
    <div className="p-8 grid grid-cols-2 gap-8">
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <PromptInput value={prompt} onChange={setPrompt} />
            <NegativePromptInput value={negativePrompt} onChange={setNegativePrompt} />

            <div className="space-y-2">
              <Label>Modelo LoRA (Identidade)</Label>
              <Select 
                key={`loras-${loras.length}`}
                value={selectedLoRA}
                onValueChange={(v) => setSelectedLoRA(v || '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar identidade" />
                </SelectTrigger>
                <SelectContent>
                  {loras.length === 0 && <SelectItem value="none" disabled>Nenhuma identidade encontrada</SelectItem>}
                  {loras.map(lora => lora && (
                    <SelectItem key={lora.loraId} value={lora.modelName} disabled={lora.status !== 'ready'}>
                      {lora.modelName} {lora.status !== 'ready' ? `(${lora.status})` : ''} - <i>{lora.triggerWord}</i>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <NSFWControls
              values={generationValues}
              onChange={(vals) => setGenerationValues(prev => ({ ...prev, ...vals }))}
            />
          </CardContent>
        </Card>

        <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
          {isGenerating ? 'Gerando...' : 'Gerar Imagem'}
        </Button>
      </div>

      <div>
        <Card>
          <CardContent className="pt-6">
            {result ? (
              <img
                src={result}
                alt="Generated"
                className="w-full rounded-lg"
              />
            ) : (
              <div className="h-96 flex flex-col items-center justify-center text-muted-foreground text-center">
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                    <p>Gerando sua imagem via Replicate...</p>
                  </>
                ) : (
                  <p>A imagem gerada aparecerá aqui. Selecione sua identidade na esquerda.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
