import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles, Shield, Zap } from 'lucide-react'
import { FadeIn } from '@/components/animations/FadeIn'

export function CTA() {
  return (
    <section id="cta" className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-600/5 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-600/10 rounded-full blur-[200px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <FadeIn>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-600/10 border border-red-500/20 mb-8">
            <Sparkles className="w-4 h-4 text-red-400" />
            <span className="text-sm text-red-200 font-medium">
              Beta — vagas limitadas
            </span>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight">
            Pronto para começar?
          </h2>
        </FadeIn>

        <FadeIn delay={0.15}>
          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-8">
            Junte-se a milhares de criadores que já estão usando a plataforma mais avançada de geração de imagens por IA do Brasil.
          </p>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link
              to="/auth"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-lg transition-all duration-200 hover:shadow-[0_0_40px_rgba(220,38,38,0.3)] active:scale-[0.98]"
            >
              <span>Criar conta grátis</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#pricing"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-900/50 text-zinc-300 hover:text-white font-semibold text-lg transition-all duration-200"
            >
              Ver planos
            </a>
          </div>
        </FadeIn>

        <FadeIn delay={0.3}>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-500">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-zinc-600" />
              <span>Pagamento seguro</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-zinc-600" />
              <span>Comece em 30 segundos</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-600">✓</span>
              <span>Sem cartão para testar</span>
            </div>
          </div>
        </FadeIn>

        {/* Trust badges */}
        <FadeIn delay={0.4}>
          <div className="mt-12 pt-8 border-t border-zinc-800">
            <p className="text-xs text-zinc-600 mb-4">
              Usado por criadores em todo o Brasil
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 opacity-50">
              {/* Placeholder for trust badges/logos */}
              <div className="px-4 py-2 rounded bg-zinc-900 text-zinc-500 text-xs">
                SSL Certificado
              </div>
              <div className="px-4 py-2 rounded bg-zinc-900 text-zinc-500 text-xs">
                PCI Compliant
              </div>
              <div className="px-4 py-2 rounded bg-zinc-900 text-zinc-500 text-xs">
                LGPD Compliance
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}