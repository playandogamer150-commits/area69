import { Link } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { Menu, X, Zap } from 'lucide-react'
import { useState } from 'react'

const Hero = lazy(() => import('@/components/figma-home/Hero').then(m => ({ default: m.Hero })))
const Features = lazy(() => import('@/components/figma-home/Features').then(m => ({ default: m.Features })))
const Pricing = lazy(() => import('@/components/figma-home/Pricing').then(m => ({ default: m.Pricing })))
const FAQ = lazy(() => import('@/components/figma-home/FAQ').then(m => ({ default: m.FAQ })))
const CTA = lazy(() => import('@/components/figma-home/CTA').then(m => ({ default: m.CTA })))
const Footer = lazy(() => import('@/components/figma-home/Footer').then(m => ({ default: m.Footer })))

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-xl border border-red-500/20 bg-red-500/10 flex items-center justify-center">
          <Zap className="w-6 h-6 text-red-400 animate-pulse" />
        </div>
        <p className="text-sm text-zinc-500">Carregando...</p>
      </div>
    </div>
  )
}

export function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-zinc-950 text-white antialiased">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg border border-red-500/30 bg-red-500/10 flex items-center justify-center">
                <span className="text-red-400 font-bold text-lg">A</span>
              </div>
              <span className="font-bold text-white text-lg tracking-tight hidden sm:block">
                AREA 69
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-zinc-400 hover:text-white transition-colors">
                Recursos
              </a>
              <a href="#pricing" className="text-sm text-zinc-400 hover:text-white transition-colors">
                Preços
              </a>
              <a href="#faq" className="text-sm text-zinc-400 hover:text-white transition-colors">
                FAQ
              </a>
            </div>

            {/* Desktop CTAs */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/auth"
                className="text-sm text-zinc-300 hover:text-white transition-colors px-4 py-2"
              >
                Entrar
              </Link>
              <Link
                to="/auth?mode=register"
                className="text-sm font-medium text-white bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg transition-colors"
              >
                Começar grátis
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-zinc-400 hover:text-white"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-xl">
            <div className="px-4 py-4 space-y-3">
              <a
                href="#features"
                className="block text-sm text-zinc-400 hover:text-white transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Recursos
              </a>
              <a
                href="#pricing"
                className="block text-sm text-zinc-400 hover:text-white transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Preços
              </a>
              <a
                href="#faq"
                className="block text-sm text-zinc-400 hover:text-white transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                FAQ
              </a>
              <hr className="border-zinc-800" />
              <Link
                to="/auth"
                className="block text-sm text-zinc-300 hover:text-white transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Entrar
              </Link>
              <Link
                to="/auth?mode=register"
                className="block text-sm font-medium text-white bg-red-600 hover:bg-red-500 px-4 py-3 rounded-lg text-center transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Começar grátis
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="pt-16">
        <Suspense fallback={<LoadingFallback />}>
          <Hero />
          <Features />
          <Pricing />
          <FAQ />
          <CTA />
        </Suspense>
      </main>

      <Suspense fallback={<LoadingFallback />}>
        <Footer />
      </Suspense>
    </div>
  )
}