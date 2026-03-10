import api from './api'
import type {
  VideoMotionRequest,
  VideoMotionResponse,
  VideoDirectRequest,
  VideoDirectResponse,
} from '../types/api.types'

export const videoService = {
  async generateVideoMotion(data: VideoMotionRequest): Promise<VideoMotionResponse> {
    const response = await api.post<VideoMotionResponse>('/video-motion', data)
    return response.data
  },

  async generateVideoDirect(data: VideoDirectRequest): Promise<VideoDirectResponse> {
    const formData = new FormData()
    formData.append('audio_file', data.audio_file)
    formData.append('image_reference', data.image_reference)

    const response = await api.post<VideoDirectResponse>('/video-directly', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
}
