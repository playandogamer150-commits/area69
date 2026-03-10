import { Navigate } from 'react-router-dom'
import { hasActiveSession } from '@/utils/session'

export function ProtectedRoute({ children }: { children: JSX.Element }) {
  if (!hasActiveSession()) {
    return <Navigate to="/login" replace />
  }
  return children
}
