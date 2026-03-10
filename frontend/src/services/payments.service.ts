import api from './api'
import type { PixCharge } from '@/types/api.types'

export const paymentsService = {
  async createPixCharge(amountCents?: number): Promise<PixCharge> {
    const response = await api.post<PixCharge>('/payments/pix', { amountCents })
    return response.data
  },

  async getLatestPixCharge(): Promise<PixCharge | null> {
    const response = await api.get<{ charge: PixCharge | null }>('/payments/pix/latest')
    return response.data.charge
  },
}
