import { useMutation } from '@tanstack/react-query'
import { videoService } from '../services/video.service'
import type { VideoMotionRequest, VideoDirectRequest } from '../types/api.types'

export function useVideo() {
  const motionMutation = useMutation({
    mutationFn: (data: VideoMotionRequest) => videoService.generateVideoMotion(data),
  })

  const directMutation = useMutation({
    mutationFn: (data: VideoDirectRequest) => videoService.generateVideoDirect(data),
  })

  return {
    generateMotion: motionMutation.mutateAsync,
    generateDirect: directMutation.mutateAsync,
    isGenerating: motionMutation.isPending || directMutation.isPending,
    result: motionMutation.data || directMutation.data,
    error: motionMutation.error || directMutation.error,
  }
}
