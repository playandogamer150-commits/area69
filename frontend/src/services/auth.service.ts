import api from './api'
import type { AuthResponse, AuthUser } from '../types/api.types'
import { clearSession, setSession, updateCurrentUser } from '@/utils/session'

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', { email, password })
    setSession(response.data.access_token, response.data.refresh_token, response.data.user)
    return response.data
  },

  async register(email: string, password: string, name: string, deviceFingerprint?: string, turnstileToken?: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', { email, password, name, deviceFingerprint, turnstileToken })
    setSession(response.data.access_token, response.data.refresh_token, response.data.user)
    return response.data
  },

  logout() {
    clearSession()
    window.location.href = '/login'
  },

  async getCurrentUser(): Promise<AuthUser> {
    const response = await api.get<AuthUser>('/auth/me')
    updateCurrentUser(response.data)
    return response.data
  },

  async updateProfile(name: string): Promise<AuthUser> {
    const response = await api.patch<AuthUser>('/auth/me', { name })
    updateCurrentUser(response.data)
    return response.data
  },

  async activateLicense(licenseKey: string): Promise<{ ok: boolean; message: string; user: AuthUser }> {
    const response = await api.post<{ ok: boolean; message: string; user: AuthUser }>('/auth/activate-license', { licenseKey })
    updateCurrentUser(response.data.user)
    return response.data
  },
}
