import { useState } from 'react'
import { ReferencePhotoUpload } from '@/components/identity/ReferencePhotoUpload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/useToast'
import { useCurrentUserId } from '@/hooks/useCurrentUserId'
import { loraService } from '@/services/lora.service'

export function IdentityCreation() {
  const [files, setFiles] = useState<File[]>([])
  const [modelName, setModelName] = useState('')
  const [triggerWord, setTriggerWord] = useState('')
  const [enableNsfw, setEnableNsfw] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const userId = useCurrentUserId()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (files.length < 5) {
      toast({ title: 'Erro', description: 'Mínimo 5 fotos necessárias', variant: 'destructive' })
      return
    }

    setIsLoading(true)
    try {
      const formData = new FormData()
      files.forEach((file) => formData.append('referencePhotos', file))
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
        description: 'Treinamento LoRA iniciado. Você pode acompanhar na página inicial.' 
      })
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } }
      toast({ 
        title: 'Erro', 
        description: err.response?.data?.detail || 'Falha ao criar identidade', 
        variant: 'destructive' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Criar Nova Identidade</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <ReferencePhotoUpload 
              onFilesSelected={setFiles} 
              maxFiles={20}
            />

            <div className="space-y-2">
              <Label htmlFor="modelName">Nome do Modelo</Label>
              <Input
                id="modelName"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="ex: minha-identidade-01"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="triggerWord">Trigger Word</Label>
              <Input
                id="triggerWord"
                value={triggerWord}
                onChange={(e) => setTriggerWord(e.target.value)}
                placeholder="Palavra que ativa o LoRA"
                required
              />
              <p className="text-xs text-muted-foreground">
                Use uma palavra única que não apareça em prompts normais.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="enableNsfw"
                checked={enableNsfw}
                onCheckedChange={setEnableNsfw}
              />
              <Label htmlFor="enableNsfw">Habilitar geração NSFW</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Esta flag é CRÍTICA - instrui o treinamento a preparar o modelo para conteúdo explícito.
            </p>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Processando...' : 'Iniciar Treinamento'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
