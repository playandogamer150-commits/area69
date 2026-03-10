import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface NegativePromptInputProps {
  value: string
  onChange: (value: string) => void
}

export function NegativePromptInput({ value, onChange }: NegativePromptInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="negativePrompt">Prompt Negativo</Label>
      <Textarea
        id="negativePrompt"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="O que você NÃO quer na imagem (baixa qualidade, deformações, etc.)"
        className="min-h-[80px]"
      />
    </div>
  )
}
