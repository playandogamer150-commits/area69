import type { GalleryItem, GallerySourceType } from '@/types/api.types'

export const IMAGE_EDIT_HISTORY_STORAGE_KEY = 'image-edit-history'

export type ImageEditHistoryItem = GalleryItem

export function inferLegacyGallerySourceType(item: Pick<ImageEditHistoryItem, 'size'>): GallerySourceType {
  return item.size.includes('*') ? 'image_edit' : 'image_generation'
}

export function loadImageEditHistory(): ImageEditHistoryItem[] {
  try {
    const raw = localStorage.getItem(IMAGE_EDIT_HISTORY_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ImageEditHistoryItem[]) : []
  } catch {
    return []
  }
}

export function saveImageEditHistory(items: ImageEditHistoryItem[]) {
  localStorage.setItem(IMAGE_EDIT_HISTORY_STORAGE_KEY, JSON.stringify(items))
}
