import axios from 'axios'

export function getApiErrorMessage(error: unknown, fallback: string = 'Ocorreu um erro'): string {
  if (axios.isAxiosError<{ detail?: string | Array<{ msg?: string; loc?: Array<string | number> }> }>(error)) {
    const detail = error.response?.data?.detail

    if (typeof detail === 'string' && detail.trim()) {
      return detail
    }

    if (Array.isArray(detail) && detail.length > 0) {
      const firstError = detail[0]
      const location = firstError.loc?.join(' > ')
      if (firstError.msg && location) {
        return `${location}: ${firstError.msg}`
      }
      if (firstError.msg) {
        return firstError.msg
      }
    }

    return error.message || fallback
  }

  if (error instanceof Error) {
    return error.message || fallback
  }

  return fallback
}
