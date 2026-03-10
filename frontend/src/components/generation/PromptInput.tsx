import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface PromptInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function PromptInput({ value, onChange, placeholder }: PromptInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="prompt">Prompt</Label>
      <Textarea
        id="prompt"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'Descreva a imagem que deseja gerar...'}
        className="min-h-[100px]"
      />
    </div>
  )
}
