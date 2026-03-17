import api from './api'
import type { AuthResponse, AuthUser, OAuthStartResponse } from '../types/api.types'
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

  async startOAuth(provider: 'google' | 'discord', deviceFingerprint?: string): Promise<string> {
    const redirectTo = `${window.location.origin}/auth/callback`
    const response = await api.post<OAuthStartResponse>(`/auth/oauth/${provider}/start`, { deviceFingerprint, redirectTo })
    return response.data.authorizationUrl
  },

  completeOAuthCallback(hashOrQuery: string): AuthResponse {
    const raw = hashOrQuery.startsWith('#') || hashOrQuery.startsWith('?') ? hashOrQuery.slice(1) : hashOrQuery
    const params = new URLSearchParams(raw)
    const error = params.get('error')
    if (error) {
      throw new Error(error)
    }

    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    const rawUser = params.get('user')
    if (!accessToken || !rawUser) {
      throw new Error('Resposta de login social incompleta')
    }

    let user: AuthUser
    try {
      user = JSON.parse(rawUser) as AuthUser
    } catch {
      throw new Error('Nao foi possivel ler os dados da conta social')
    }

    const response: AuthResponse = {
      access_token: accessToken,
      refresh_token: refreshToken || '',
      token_type: 'bearer',
      user,
    }
    setSession(response.access_token, response.refresh_token || null, response.user)
    return response
  },
}
