export interface SessionUser {
  id: number
  email: string
  name?: string | null
  isActive?: boolean
  licenseStatus?: string
  licensePlan?: string | null
  licenseKey?: string | null
  licenseActivatedAt?: string | null
  licenseExpiresAt?: string | null
  createdAt?: string | null
}

const TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const USER_KEY = 'current_user'

export function setSession(accessToken: string, refreshToken: string | null, user: SessionUser) {
  localStorage.setItem(TOKEN_KEY, accessToken)
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getCurrentUser(): SessionUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as SessionUser) : null
  } catch {
    return null
  }
}

export function updateCurrentUser(user: SessionUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function getCurrentUserId(): string {
  const user = getCurrentUser()
  return user?.id ? String(user.id) : 'user-1'
}

export function hasActiveSession() {
  return Boolean(getAccessToken())
}

export function hasActiveLicense() {
  const user = getCurrentUser()
  return (user?.licenseStatus || 'inactive') === 'active'
}
