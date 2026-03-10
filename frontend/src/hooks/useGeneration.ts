import { useMutation } from '@tanstack/react-query'
import { generateService } from '../services/generate.service'
import type { GenerationRequest } from '../types/api.types'

export function useGeneration() {
  const generateMutation = useMutation({
    mutationFn: (data: GenerationRequest) => generateService.generateImage(data),
  })

  const checkStatusMutation = useMutation({
    mutationFn: (taskId: string) => generateService.getGenerationStatus(taskId),
  })

  return {
    generate: generateMutation.mutateAsync,
    checkStatus: checkStatusMutation.mutateAsync,
    isGenerating: generateMutation.isPending,
    generationResult: generateMutation.data,
    generationError: generateMutation.error,
    isCheckingStatus: checkStatusMutation.isPending,
  }
}
