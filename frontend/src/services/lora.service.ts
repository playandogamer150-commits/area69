import api from './api'
import type {
  GenerateReferenceImagesUploadResponse,
  LoRAResponse,
  LoRAStatus,
  ReferencePhotosUploadResponse,
} from '../types/api.types'

export const loraService = {
  async createLoRA(data: {
    userId: string
    modelName: string
    triggerWord: string
    enableNsfw: boolean
    referencePhotos: string[]
  }): Promise<LoRAResponse> {
    const response = await api.post<LoRAResponse>('/admin/lora-recovery', data)
    return response.data
  },

  async getUserLoRAs(userId: string): Promise<LoRAStatus[]> {
    const response = await api.get<LoRAStatus[]>(`/user/loras?userId=${userId}`)
    return response.data
  },

  async getLoRAStatus(loraId: string): Promise<LoRAStatus> {
    const response = await api.get<LoRAStatus>(`/user/loras/${loraId}`)
    return response.data
  },

  async uploadReferencePhotos(formData: FormData): Promise<ReferencePhotosUploadResponse> {
    const response = await api.post<ReferencePhotosUploadResponse>('/upload/reference-photos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  async uploadGenerateReferenceImages(formData: FormData): Promise<GenerateReferenceImagesUploadResponse> {
    const response = await api.post<GenerateReferenceImagesUploadResponse>('/upload/generate-reference-images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
}
