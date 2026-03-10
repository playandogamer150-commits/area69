import { Navigate } from 'react-router-dom'
import { hasActiveLicense } from '@/utils/session'

export function LicensedRoute({ children }: { children: JSX.Element }) {
  if (!hasActiveLicense()) {
    return <Navigate to="/profile" replace />
  }
  return children
}
