import { Navigate } from 'react-router-dom'
import { canUseImageEdit } from '@/utils/session'

export function ImageEditRoute({ children }: { children: JSX.Element }) {
  if (!canUseImageEdit()) {
    return <Navigate to="/profile" replace />
  }
  return children
}
