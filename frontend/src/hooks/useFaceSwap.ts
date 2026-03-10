import { useMutation } from '@tanstack/react-query'
import { faceswapService } from '../services/faceswap.service'
import type { FaceSwapImageRequest, FaceSwapVideoRequest } from '../types/api.types'

export function useFaceSwap() {
  const imageSwapMutation = useMutation({
    mutationFn: (data: FaceSwapImageRequest) => faceswapService.faceSwapImage(data),
  })

  const videoSwapMutation = useMutation({
    mutationFn: (data: FaceSwapVideoRequest) => faceswapService.faceSwapVideo(data),
  })

  const imageFaceSwapMutation = useMutation({
    mutationFn: (data: { image_url: string; source_url: string; dest_url: string }) =>
      faceswapService.imageFaceSwap(data),
  })

  return {
    swapImage: imageSwapMutation.mutateAsync,
    swapVideo: videoSwapMutation.mutateAsync,
    imageFaceSwap: imageFaceSwapMutation.mutateAsync,
    isSwapping:
      imageSwapMutation.isPending || videoSwapMutation.isPending || imageFaceSwapMutation.isPending,
    result: imageSwapMutation.data || videoSwapMutation.data || imageFaceSwapMutation.data,
    error: imageSwapMutation.error || videoSwapMutation.error || imageFaceSwapMutation.error,
  }
}
