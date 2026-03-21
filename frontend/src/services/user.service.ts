import api from './api'
import type { DashboardStatsResponse } from '../types/api.types'

export const userService = {
  async getDashboardStats(userId: string): Promise<DashboardStatsResponse> {
    const response = await api.get<DashboardStatsResponse>(`/user/stats?userId=${userId}`)
    return response.data
  },
}