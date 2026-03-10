import axios from 'axios'

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<{ detail?: string }>(error)) {
    return error.response?.data?.detail || error.message || fallback
  }

  if (error instanceof Error) {
    return error.message || fallback
  }

  return fallback
}
