import api from './api'
import type { UploadResponse } from '../types/api.types'

export const uploadService = {
  async uploadReferencePhotos(
    files: File[],
    userId: string,
    modelName: string,
    enableNsfw: boolean
  ): Promise<UploadResponse[]> {
    const formData = new FormData()
    files.forEach((file) => formData.append('referencePhotos', file))
    formData.append('userId', userId)
    formData.append('modelName', modelName)
    formData.append('enableNsfw', enableNsfw.toString())

    const response = await api.post<UploadResponse[]>('/upload/reference-photos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  async uploadFile(file: File, endpoint: string): Promise<UploadResponse> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post<UploadResponse>(endpoint, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
}
