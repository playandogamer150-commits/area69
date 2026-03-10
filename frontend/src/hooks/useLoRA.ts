import { useMutation, useQuery } from '@tanstack/react-query'
import { loraService } from '../services/lora.service'

export function useLoRA(userId: string) {
  const { data: loras, isLoading } = useQuery({
    queryKey: ['loras', userId],
    queryFn: () => loraService.getUserLoRAs(userId),
    enabled: !!userId,
    refetchInterval: 5000,
  })

  const createLoRAMutation = useMutation({
    mutationFn: (data: {
      userId: string
      modelName: string
      triggerWord: string
      enableNsfw: boolean
      referencePhotos: string[]
    }) => loraService.createLoRA(data),
  })

  const uploadPhotosMutation = useMutation({
    mutationFn: (formData: FormData) => loraService.uploadReferencePhotos(formData),
  })

  return {
    loras,
    isLoading,
    createLoRA: createLoRAMutation.mutateAsync,
    uploadPhotos: uploadPhotosMutation.mutateAsync,
    isCreating: createLoRAMutation.isPending,
    isUploading: uploadPhotosMutation.isPending,
    createLoRAError: createLoRAMutation.error,
    uploadPhotosError: uploadPhotosMutation.error,
  }
}

export function useLoRAStatus(loraId: string) {
  return useQuery({
    queryKey: ['lora', loraId],
    queryFn: () => loraService.getLoRAStatus(loraId),
    enabled: !!loraId,
    refetchInterval: 3000,
  })
}
