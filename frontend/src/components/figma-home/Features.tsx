import { motion } from 'framer-motion'
import { ImageIcon, Video, Shield, Sparkles, Zap, Maximize2 } from 'lucide-react'
import { FadeIn } from '@/components/animations/FadeIn'

const features = [
  {
    icon: ImageIcon,
    title: 'Geração de Imagens com IA',
    description: 'Crie imagens ultra-realistas a partir de uma foto de referência. Múltiplos cenários, poses e estilos em segundos.',
    gradient: 'from-red-500 to-orange-500',
  },
  {
    icon: Video,
    title: 'Vídeos em Breve',
    description: 'Gere vídeos curtos a partir das suas imagens. Animação realista com IA de última geração.',
    gradient: 'from-violet-500 to-purple-500',
    comingSoon: true,
  },
  {
    icon: Shield,
    title: '100% Privado',
    description: 'Suas criações são suas. Nada é salvo em servidores públicos. Galeria privada e criptografada.',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Sparkles,
    title: 'Sem Censura',
    description: 'Crie sem limites artificiais. Nossa plataforma respeita sua liberdade criativa.',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    icon: Zap,
    title: 'Ultra Rápido',
    description: 'Gere imagens em menos de 10 segundos. GPUs de alta performance para resultados instantâneos.',
    gradient: 'from-amber-500 to-yellow-500',
  },
  {
    icon: Maximize2,
    title: 'Qualidade Profissional',
    description: 'Saídas em alta resolução. Qualidade adequada para qualquer uso, da web à impressão.',
    gradient: 'from-cyan-500 to-blue-500',
  },
]

export function Features() {
  return (
    <section id="features" className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
        <div className="absolute bottom-1/3 right-0 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <FadeIn>
            <span className="inline-block text-sm text-red-400 tracking-wide uppercase mb-4">
              Recursos
            </span>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
              Tudo que você precisa
            </h2>
          </FadeIn>
          <FadeIn delay={0.15}>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
              Ferramentas profissionais de IA projetadas para criadores que exigem o melhor.
            </p>
          </FadeIn>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <FadeIn key={feature.title} delay={0.1 + index * 0.05}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="group relative p-6 rounded-2xl border border-zinc-800/50 bg-zinc-900/30 hover:bg-zinc-900/50 hover:border-zinc-700 transition-all duration-200"
                >
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} p-[1px] mb-4`}>
                    <div className="w-full h-full rounded-xl bg-zinc-900 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-red-400 transition-colors">
                    {feature.title}
                    {feature.comingSoon && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Em breve
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Hover glow */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </motion.div>
              </FadeIn>
            )
          })}
        </div>
      </div>
    </section>
  )
}