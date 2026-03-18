import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Sparkles, X } from 'lucide-react'

interface GuidedDashboardTourStep {
  id: string
  title: string
  description: string
  selector: string
  ctaLabel?: string
  ctaPath?: string
}

interface GuidedDashboardTourProps {
  open: boolean
  steps: GuidedDashboardTourStep[]
  onClose: (completed: boolean) => void
}

const SPOTLIGHT_PADDING = 12

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function GuidedDashboardTour({ open, steps, onClose }: GuidedDashboardTourProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  const activeStep = steps[activeIndex]

  useEffect(() => {
    if (!open) {
      setActiveIndex(0)
      setTargetRect(null)
    }
  }, [open])

  useEffect(() => {
    if (!open || !activeStep) return

    let frame = 0

    const updateTargetRect = () => {
      const element = document.querySelector(activeStep.selector) as HTMLElement | null
      if (!element) {
        setTargetRect(null)
        return
      }

      element.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' })

      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        setTargetRect(element.getBoundingClientRect())
      })
    }

    updateTargetRect()
    window.addEventListener('resize', updateTargetRect)
    window.addEventListener('scroll', updateTargetRect, true)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', updateTargetRect)
      window.removeEventListener('scroll', updateTargetRect, true)
    }
  }, [activeStep, open])

  const spotlight = useMemo(() => {
    if (!targetRect) return null
    return {
      top: clamp(targetRect.top - SPOTLIGHT_PADDING, 0, window.innerHeight),
      left: clamp(targetRect.left - SPOTLIGHT_PADDING, 0, window.innerWidth),
      width: clamp(targetRect.width + SPOTLIGHT_PADDING * 2, 0, window.innerWidth),
      height: clamp(targetRect.height + SPOTLIGHT_PADDING * 2, 0, window.innerHeight),
    }
  }, [targetRect])

  const tooltipStyle = useMemo(() => {
    if (!spotlight) {
      return {
        top: Math.max(window.innerHeight / 2 - 140, 24),
        left: Math.max(window.innerWidth / 2 - 180, 24),
      }
    }

    const preferredTop = spotlight.top + spotlight.height + 18
    const fallbackTop = spotlight.top - 210
    const top = preferredTop + 220 < window.innerHeight ? preferredTop : Math.max(fallbackTop, 24)
    const left = clamp(spotlight.left, 24, Math.max(window.innerWidth - 384, 24))
    return { top, left }
  }, [spotlight])

  if (!open || !activeStep) return null

  const content = (
    <div className="pointer-events-none fixed inset-0 z-[140]">
      {spotlight ? (
        <>
          <div className="fixed left-0 top-0 bg-black/78 backdrop-blur-[2px]" style={{ width: '100vw', height: spotlight.top }} />
          <div className="fixed left-0 bg-black/78 backdrop-blur-[2px]" style={{ top: spotlight.top, width: spotlight.left, height: spotlight.height }} />
          <div
            className="fixed right-0 bg-black/78 backdrop-blur-[2px]"
            style={{ top: spotlight.top, left: spotlight.left + spotlight.width, height: spotlight.height }}
          />
          <div
            className="fixed bottom-0 left-0 bg-black/78 backdrop-blur-[2px]"
            style={{ top: spotlight.top + spotlight.height, width: '100vw' }}
          />

          <div
            className="pointer-events-none fixed rounded-[1.4rem] border border-red-500/70 shadow-[0_0_0_1px_rgba(248,113,113,0.2),0_0_0_9999px_rgba(0,0,0,0),0_0_36px_rgba(220,38,38,0.28)]"
            style={{
              top: spotlight.top,
              left: spotlight.left,
              width: spotlight.width,
              height: spotlight.height,
            }}
          />
        </>
      ) : (
        <div className="fixed inset-0 bg-black/78 backdrop-blur-[2px]" />
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="pointer-events-auto fixed w-[min(360px,calc(100vw-32px))] rounded-[1.6rem] border border-white/[0.08] bg-neutral-950/96 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55),0_0_40px_rgba(220,38,38,0.08)]"
        style={tooltipStyle}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-red-200">
              <Sparkles className="h-3.5 w-3.5" />
              Tour guiado
            </div>
            <h3 className="text-lg font-bold text-white">{activeStep.title}</h3>
          </div>
          <button
            type="button"
            onClick={() => onClose(false)}
            className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-2 text-gray-400 transition hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm leading-6 text-gray-300">{activeStep.description}</p>

        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            {steps.map((step, index) => (
              <span
                key={step.id}
                className={`h-2 rounded-full transition-all ${index === activeIndex ? 'w-6 bg-red-500' : 'w-2 bg-white/[0.14]'}`}
              />
            ))}
          </div>
          <p className="text-xs font-medium tracking-wide text-gray-500">
            {activeIndex + 1}/{steps.length}
          </p>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {activeStep.ctaLabel && activeStep.ctaPath && (
            <Link
              to={activeStep.ctaPath}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(220,38,38,0.24)] transition hover:bg-red-700"
            >
              {activeStep.ctaLabel}
            </Link>
          )}

          <button
            type="button"
            onClick={() => setActiveIndex((current) => Math.max(current - 1, 0))}
            disabled={activeIndex === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-gray-200 transition hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>

          <button
            type="button"
            onClick={() => {
              if (activeIndex === steps.length - 1) {
                onClose(true)
                return
              }
              setActiveIndex((current) => current + 1)
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.05]"
          >
            {activeIndex === steps.length - 1 ? 'Concluir' : 'Proximo'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </div>
  )

  return createPortal(content, document.body)
}
