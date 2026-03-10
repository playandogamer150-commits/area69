import { getCurrentUserId } from '@/utils/session'

export function useCurrentUserId() {
  return getCurrentUserId()
}
