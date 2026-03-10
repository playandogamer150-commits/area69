import api from './api'
import type { EditImagesUploadResponse, ImageEditRequest, ImageEditResponse, GenerationResponse } from '../types/api.types'

export const imageEditService = {
  async uploadImages(formData: FormData): Promise<EditImagesUploadResponse> {
    const response = await api.post<EditImagesUploadResponse>('/upload/edit-images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    })
    return response.data
  },

  async editImage(data: ImageEditRequest): Promise<ImageEditResponse> {
    const response = await api.post<ImageEditResponse>('/generate/image-edit', data, {
      timeout: 120000,
    })
    return response.data
  },

  async getStatus(taskId: string): Promise<GenerationResponse> {
    const response = await api.get<GenerationResponse>(`/generate/status/${taskId}`)
    return response.data
  },
}
