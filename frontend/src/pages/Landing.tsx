import { Link } from 'react-router-dom'

import { AnglesGallery } from '@/components/figma-home/AnglesGallery'
import { BeforeAfterGallery } from '@/components/figma-home/BeforeAfterGallery'
import { Benefits } from '@/components/figma-home/Benefits'
import { FAQ } from '@/components/figma-home/FAQ'
import { FinalCTA } from '@/components/figma-home/FinalCTA'
import { Footer } from '@/components/figma-home/Footer'
import { Hero } from '@/components/figma-home/Hero'
import { HowItWorks } from '@/components/figma-home/HowItWorks'
import { ProductDemo } from '@/components/figma-home/ProductDemo'
import { Roadmap } from '@/components/figma-home/Roadmap'
import { ScarcityTimer } from '@/components/figma-home/ScarcityTimer'
import { Transformation } from '@/components/figma-home/Transformation'
import { UrgencyBar } from '@/components/figma-home/UrgencyBar'

export function Landing() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-black font-['Inter',sans-serif] text-white antialiased">
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-black/70 shadow-[0_4px_30px_rgba(0,0,0,0.8),0_1px_0_rgba(220,38,38,0.08)] backdrop-blur-2xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between sm:h-20">
            <div className="flex items-center">
              <h1>
                <img
                  src="https://i.imgur.com/4J0vuOn.png"
                  alt="AREA 69 AI"
                  className="h-8 w-auto object-contain sm:h-12"
                />
              </h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                to="/login"
                className="px-3 py-2 font-['Space_Grotesk',sans-serif] text-xs font-medium tracking-wide transition-all hover:text-red-500 hover:drop-shadow-[0_0_8px_rgba(220,38,38,0.4)] sm:px-6 sm:text-sm"
              >
                Login
              </Link>
              <Link
                to="/login?mode=register"
                className="rounded-lg bg-red-600 px-3 py-2 font-['Space_Grotesk',sans-serif] text-xs font-semibold tracking-wide transition-all hover:bg-red-700 shadow-[0_2px_10px_rgba(220,38,38,0.4),0_0_40px_rgba(220,38,38,0.1)] hover:shadow-[0_4px_20px_rgba(220,38,38,0.6),0_0_60px_rgba(220,38,38,0.15)] sm:px-6 sm:text-sm"
              >
                Criar Conta
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-16 sm:pt-20">
        <Hero />
        <UrgencyBar />
        <Benefits />
        <HowItWorks />
        <ProductDemo />
        <BeforeAfterGallery />
        <Transformation />
        <AnglesGallery />
        <Roadmap />
        <FAQ />
        <ScarcityTimer />
        <FinalCTA />
      </main>

      <Footer />
    </div>
  )
}
