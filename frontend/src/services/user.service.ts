import api from './api'
import type { DashboardStatsResponse, LoRAStatus } from '../types/api.types'

export const userService = {
  async getDashboardStats(userId: string): Promise<DashboardStatsResponse> {
    const response = await api.get<DashboardStatsResponse>(`/user/stats?userId=${userId}`)
    return response.data
  },

  async getUserLoras(userId: string): Promise<LoRAStatus[]> {
    const response = await api.get<LoRAStatus[]>(`/user/loras?userId=${userId}`)
    return response.data
  },
}
