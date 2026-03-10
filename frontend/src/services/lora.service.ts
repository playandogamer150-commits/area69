import api from './api'
import type { LoRAResponse, LoRAStatus } from '../types/api.types'

interface UploadResponse {
  ok: boolean
  saved: Array<{ path: string; filename: string; size: number; contentType: string }>
  message: string
  userId: string
  modelName: string
  enableNsfw: boolean
}

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

  async uploadReferencePhotos(formData: FormData): Promise<UploadResponse> {
    const response = await api.post<UploadResponse>('/upload/reference-photos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
}
