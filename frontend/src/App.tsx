import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ImageEditRoute } from '@/components/auth/ImageEditRoute'
import { LicensedRoute } from '@/components/auth/LicensedRoute'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ToastProvider } from '@/hooks/useToast'
import { MainLayout } from '@/components/layout/MainLayout'
import { Landing } from '@/pages/Landing'
import { Dashboard } from '@/pages/Dashboard'
import { IdentityCreation } from '@/pages/IdentityCreation'
import { ImageGeneration } from '@/pages/ImageGeneration'
import { ImageEdit } from '@/pages/ImageEdit'
import { Gallery } from '@/pages/Gallery'
import { Login } from '@/pages/Login'
import { OAuthCallback } from '@/pages/OAuthCallback'
import { Profile } from '@/pages/Profile'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth" element={<Login />} />
            <Route path="/auth/callback" element={<OAuthCallback />} />
            <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/identity" element={<LicensedRoute><IdentityCreation /></LicensedRoute>} />
              <Route path="/generate" element={<LicensedRoute><ImageGeneration /></LicensedRoute>} />
              <Route path="/edit-image" element={<ImageEditRoute><ImageEdit /></ImageEditRoute>} />
              <Route path="/faceswap" element={<Navigate to="/dashboard" replace />} />
              <Route path="/video" element={<Navigate to="/dashboard" replace />} />
              <Route path="/gallery" element={<LicensedRoute><Gallery /></LicensedRoute>} />
              <Route path="/profile" element={<Profile />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}

export default App
