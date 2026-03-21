import api from './api'
import type { GenerationRequest, GenerationResponse, GenerateReferenceImagesUploadResponse } from '../types/api.types'

export const generateService = {
  async generateImage(data: GenerationRequest): Promise<GenerationResponse> {
    const response = await api.post<GenerationResponse>('/generate/image', data)
    return response.data
  },

  async getGenerationStatus(taskId: string): Promise<GenerationResponse> {
    const response = await api.get<GenerationResponse>(`/generate/status/${taskId}`)
    return response.data
  },

  async uploadReferenceImages(formData: FormData): Promise<GenerateReferenceImagesUploadResponse> {
    const response = await api.post<GenerateReferenceImagesUploadResponse>('/upload/generate-reference-images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
}
