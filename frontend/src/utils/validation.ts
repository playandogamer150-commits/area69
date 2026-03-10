import { z } from 'zod'

export const loraSchema = z.object({
  userId: z.string().min(1, 'ID do usuário é obrigatório'),
  modelName: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  triggerWord: z.string().min(2, 'Trigger word é obrigatório'),
  enableNsfw: z.boolean(),
  falLoraUrl: z.string().url().optional(),
})

export const generationSchema = z.object({
  prompt: z.string().min(5, 'Prompt deve ter pelo menos 5 caracteres'),
  negativePrompt: z.string().optional(),
  loraName: z.string().min(1, 'Selecione uma identidade'),
  loraStrength: z.number().min(0).max(1),
  girlLoraStrength: z.number().min(0).max(1).optional(),
  cumEffect: z.number().min(0).max(1),
  makeup: z.number().min(0).max(1),
  pose: z.string().min(1),
  strength: z.number().min(0).max(1),
  width: z.number().optional(),
  height: z.number().optional(),
  seed: z.number().optional(),
  steps: z.number().optional(),
  guidanceScale: z.number().optional(),
})

export const faceSwapSchema = z.object({
  sourceImageUrl: z.string().url('URL da imagem de origem inválida'),
  targetImageUrl: z.string().url('URL da imagem de destino inválida'),
  loraStrength: z.number().min(0).max(1),
})

export const videoMotionSchema = z.object({
  imagePrompt: z.string().min(5, 'Prompt da imagem é obrigatório'),
  loraName: z.string().optional(),
  loraStrength: z.number().min(0).max(1),
})

export const uploadSchema = z.object({
  file: z.any(),
  maxSize: z.number().optional(),
  allowedTypes: z.array(z.string()).optional(),
})
