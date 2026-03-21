'use client';

import { motion } from 'framer-motion';
import {
  ImageIcon,
  Video,
  Sparkles,
  Shield,
  Zap,
  Maximize,
} from 'lucide-react';
import { FadeIn } from '@/components/animations';

const features = [
  {
    icon: ImageIcon,
    title: 'Geração de Imagens com IA',
    description: 'Crie imagens ultra-realistas a partir de uma foto de referência. Múltiplos cenários, poses e estilos.',
  },
  {
    icon: Video,
    title: 'Vídeos em Breve',
    description: 'Gere vídeos curtos a partir das suas imagens. Animação realista com IA de última geração.',
  },
  {
    icon: Shield,
    title: '100% Privado',
    description: 'Suas criações são suas. Nada é salvo em servidores públicos. Galeria privada e criptografada.',
  },
  {
    icon: Sparkles,
    title: 'Sem Censura',
    description: 'Crie sem limites artificiais. Nossa plataforma respeita sua liberdade criativa.',
  },
  {
    icon: Zap,
    title: 'Ultra Rápido',
    description: 'Gere imagens em menos de 10 segundos. GPUs de alta performance para resultados instantâneos.',
  },
  {
    icon: Maximize,
    title: 'Qualidade Profissional',
    description: 'Saídas em alta resolução. Qualidade adequada para qualquer uso, da web à impressão.',
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-red-600/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <FadeIn>
            <span className="inline-block text-xs text-red-400 tracking-[0.3em] uppercase mb-3">
              Recursos
            </span>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 font-['Space_Grotesk',sans-serif]">
              Tudo que Você Precisa
            </h2>
          </FadeIn>
          <FadeIn delay={0.15}>
            <p className="text-base text-gray-400 max-w-xl mx-auto">
              Ferramentas profissionais de IA projetadas para criadores que exigem o melhor.
            </p>
          </FadeIn>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <FadeIn key={feature.title} delay={0.1 + index * 0.05}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.3 }}
                  className="group p-6 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
                >
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-lg border border-white/10 flex items-center justify-center mb-4 group-hover:border-red-500/30 transition-colors">
                    <Icon className="w-5 h-5 text-red-400" />
                  </div>

                  {/* Text */}
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-red-400 transition-colors font-['Space_Grotesk',sans-serif]">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}