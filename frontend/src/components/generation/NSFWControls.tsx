import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { GenerationRequest } from '@/types/api.types'

interface NSFWControlsProps {
  values: Omit<GenerationRequest, 'prompt' | 'negativePrompt' | 'loraName' | 'width' | 'height'>
  onChange: (values: Partial<GenerationRequest>) => void
}

export function NSFWControls({ values, onChange }: NSFWControlsProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="cumEffect">Efeito Cum</Label>
        <Slider
          id="cumEffect"
          min={0}
          max={1}
          step={0.1}
          value={[values.cumEffect]}
          onValueChange={([v]) => onChange({ cumEffect: v })}
        />
        <span className="text-xs text-muted-foreground">{Math.round(values.cumEffect * 100)}%</span>
      </div>

      <div className="space-y-2">
        <Label htmlFor="makeup">Maquiagem</Label>
        <Slider
          id="makeup"
          min={0}
          max={1}
          step={0.1}
          value={[values.makeup]}
          onValueChange={([v]) => onChange({ makeup: v })}
        />
        <span className="text-xs text-muted-foreground">{Math.round(values.makeup * 100)}%</span>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pose">Pose</Label>
        <Select
          value={values.pose}
          onValueChange={(v) => onChange({ pose: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecionar pose" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="standing">Em pé</SelectItem>
            <SelectItem value="sitting">Sentada</SelectItem>
            <SelectItem value="lying">Deitada</SelectItem>
            <SelectItem value="kneeling">De joelhos</SelectItem>
            <SelectItem value="custom">Custom (upload)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="strength">Intensidade NSFW</Label>
        <Slider
          id="strength"
          min={0}
          max={1}
          step={0.1}
          value={[values.strength]}
          onValueChange={([v]) => onChange({ strength: v })}
        />
        <span className="text-xs text-muted-foreground">{Math.round(values.strength * 100)}%</span>
      </div>

      <div className="space-y-2">
        <Label htmlFor="loraStrength">Força da Identidade (LoRA)</Label>
        <Slider
          id="loraStrength"
          min={0}
          max={1}
          step={0.05}
          value={[values.loraStrength]}
          onValueChange={([v]) => onChange({ loraStrength: v })}
        />
        <span className="text-xs text-muted-foreground">{Math.round(values.loraStrength * 100)}%</span>
      </div>

      <div className="space-y-2">
        <Label htmlFor="girlLoraStrength">Força Identidade Feminina</Label>
        <Slider
          id="girlLoraStrength"
          min={0}
          max={1}
          step={0.05}
          value={[values.girlLoraStrength ?? 0.5]}
          onValueChange={([v]) => onChange({ girlLoraStrength: v })}
        />
        <span className="text-xs text-muted-foreground">{Math.round((values.girlLoraStrength ?? 0.5) * 100)}%</span>
      </div>
    </div>
  )
}
