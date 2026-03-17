import api from './api'

import type { GalleryItem, GallerySourceType } from '@/types/api.types'

interface SaveGalleryItemPayload {
  clientId: string
  sourceType: GallerySourceType
  imageUrl: string
  prompt: string
  size: string
  favorite?: boolean
  createdAt?: string
}

export const galleryService = {
  async getGalleryItems(sourceType?: GallerySourceType): Promise<GalleryItem[]> {
    const response = await api.get<GalleryItem[]>('/user/gallery', {
      params: sourceType ? { sourceType } : undefined,
    })
    return response.data
  },

  async saveGalleryItem(payload: SaveGalleryItemPayload): Promise<GalleryItem> {
    const response = await api.post<GalleryItem>('/user/gallery', payload)
    return response.data
  },

  async updateFavorite(id: string, favorite: boolean): Promise<GalleryItem> {
    const response = await api.patch<GalleryItem>(`/user/gallery/${id}`, { favorite })
    return response.data
  },

  async deleteGalleryItem(id: string): Promise<void> {
    await api.delete(`/user/gallery/${id}`)
  },

  async clearGallery(sourceType?: GallerySourceType): Promise<void> {
    await api.delete('/user/gallery', {
      params: sourceType ? { sourceType } : undefined,
    })
  },
}
