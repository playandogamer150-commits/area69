import api from './api'
import type {
  FaceSwapImageRequest,
  FaceSwapVideoRequest,
  FaceSwapResponse,
  FaceSwapVideoResponse,
  ImageFaceswapRequest,
  ImageFaceswapResponse,
} from '../types/api.types'

export const faceswapService = {
  async faceSwapImage(data: FaceSwapImageRequest): Promise<FaceSwapResponse> {
    const response = await api.post<FaceSwapResponse>('/face-swap', data)
    return response.data
  },

  async faceSwapVideo(data: FaceSwapVideoRequest): Promise<FaceSwapVideoResponse> {
    const response = await api.post<FaceSwapVideoResponse>('/face-swap-video', data)
    return response.data
  },

  async imageFaceSwap(data: ImageFaceswapRequest): Promise<ImageFaceswapResponse> {
    const response = await api.post<ImageFaceswapResponse>('/image-faceswap', data)
    return response.data
  },
}
