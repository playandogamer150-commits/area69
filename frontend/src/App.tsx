import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { ImageEditRoute } from '@/components/auth/ImageEditRoute'
import { LicensedRoute } from '@/components/auth/LicensedRoute'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ToastProvider } from '@/hooks/useToast'
import { MainLayout } from '@/components/layout/MainLayout'

const queryClient = new QueryClient()
const Landing = lazy(() => import('@/pages/Landing').then((module) => ({ default: module.Landing })))
const Dashboard = lazy(() => import('@/pages/Dashboard').then((module) => ({ default: module.Dashboard })))
const IdentityCreation = lazy(() => import('@/pages/IdentityCreation').then((module) => ({ default: module.IdentityCreation })))
const ImageGeneration = lazy(() => import('@/pages/ImageGeneration').then((module) => ({ default: module.ImageGeneration })))
const ImageEdit = lazy(() => import('@/pages/ImageEdit').then((module) => ({ default: module.ImageEdit })))
const Gallery = lazy(() => import('@/pages/Gallery').then((module) => ({ default: module.Gallery })))
const Login = lazy(() => import('@/pages/Login').then((module) => ({ default: module.Login })))
const OAuthCallback = lazy(() => import('@/pages/OAuthCallback').then((module) => ({ default: module.OAuthCallback })))
const Profile = lazy(() => import('@/pages/Profile').then((module) => ({ default: module.Profile })))

function RouteLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-8 py-7 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10">
          <Loader2 className="h-6 w-6 animate-spin text-red-400" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold tracking-wide text-white">Abrindo AREA 69</p>
          <p className="mt-1 text-xs tracking-[0.18em] text-gray-500">PRIVATE AI VISUAL STUDIO</p>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <Suspense fallback={<RouteLoader />}>
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
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}

export default App
