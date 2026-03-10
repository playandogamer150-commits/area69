export const IMAGE_EDIT_HISTORY_STORAGE_KEY = 'image-edit-history'

export interface ImageEditHistoryItem {
  id: string
  imageUrl: string
  prompt: string
  size: string
  createdAt: string
  favorite?: boolean
}

export function loadImageEditHistory(): ImageEditHistoryItem[] {
  try {
    const raw = localStorage.getItem(IMAGE_EDIT_HISTORY_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveImageEditHistory(items: ImageEditHistoryItem[]) {
  localStorage.setItem(IMAGE_EDIT_HISTORY_STORAGE_KEY, JSON.stringify(items))
}
