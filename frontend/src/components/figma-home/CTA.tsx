import { ArrowRight, Sparkles } from 'lucide-react';
import { FadeIn } from '@/components/animations';
import { Link } from 'react-router-dom';

export function CTA() {
  return (
    <section id="cta" className="relative py-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-600/5 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-600/10 rounded-full blur-[200px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-8 text-center">
        <FadeIn>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-600/10 border border-red-500/30 mb-6">
            <Sparkles className="w-4 h-4 text-red-400" />
            <span className="text-xs text-white font-medium">
              Acesso Antecipado — Vagas Limitadas
            </span>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 font-['Space_Grotesk',sans-serif]">
            Pronto para Começar?
          </h2>
        </FadeIn>

        <FadeIn delay={0.15}>
          <p className="text-base text-gray-400 max-w-xl mx-auto mb-8">
            Junte-se a milhares de criadores que já estão usando a plataforma mais avançada de geração de imagens por IA do Brasil.
          </p>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/auth"
              className="group flex items-center gap-2 px-8 py-4 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors font-['Space_Grotesk',sans-serif]"
            >
              <span>Criar Minha Modelo</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#pricing"
              className="group flex items-center gap-2 px-8 py-4 bg-white/5 text-white font-medium rounded-lg hover:bg-white/10 transition-colors border border-white/10 font-['Space_Grotesk',sans-serif]"
            >
              <span>Ver Planos</span>
            </a>
          </div>
        </FadeIn>

        <FadeIn delay={0.3}>
          <p className="mt-6 text-xs text-gray-500">
            Não precisa de cartão de crédito • Cancele quando quiser • Suporte humano
          </p>
        </FadeIn>
      </div>
    </section>
  );
}