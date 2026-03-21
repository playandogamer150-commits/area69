import { motion } from 'framer-motion'
import { Check, Sparkles, Zap, Crown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { FadeIn } from '@/components/animations/FadeIn'

const plans = [
  {
    name: 'Starter',
    icon: Sparkles,
    price: 29.90,
    period: 'mês',
    description: 'Perfeito para começar',
    features: [
      '50 imagens por mês',
      'Qualidade HD (1080p)',
      'Modelo Seedream 4.5',
      'Suporte por email',
      'Geração em até 30s',
    ],
    cta: 'Começar grátis',
    href: '/auth',
    highlighted: false,
  },
  {
    name: 'Padrão',
    icon: Zap,
    price: 69.90,
    period: 'mês',
    description: 'Mais popular',
    features: [
      '150 imagens por mês',
      'Qualidade Full HD',
      'Todos os modelos',
      'Fila de prioridade',
      'Suporte prioritário',
      'Geração em até 15s',
      'Sem marca d\'água',
    ],
    cta: 'Escolher Padrão',
    href: '/auth',
    highlighted: true,
  },
  {
    name: 'Empresarial',
    icon: Crown,
    price: 149.90,
    period: 'mês',
    description: 'Para profissionais',
    features: [
      '500+ imagens por mês',
      'Qualidade máxima',
      'Modelos exclusivos',
      'Velocidade máxima',
      'API de integração',
      'Suporte dedicado 24/7',
      'Licença comercial',
    ],
    cta: 'Falar com vendas',
    href: '/auth',
    highlighted: false,
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[180px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <FadeIn>
            <span className="inline-block text-sm text-red-400 tracking-wide uppercase mb-4">
              Preços
            </span>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
              Preço simples, valor infinito
            </h2>
          </FadeIn>
          <FadeIn delay={0.15}>
            <p className="text-lg text-zinc-400 max-w-xl mx-auto">
              Escolha o plano ideal. Cancele quando quiser.
            </p>
          </FadeIn>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, index) => {
            const Icon = plan.icon
            return (
              <FadeIn key={plan.name} delay={0.1 + index * 0.05}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className={`relative rounded-2xl p-6 ${
                    plan.highlighted
                      ? 'bg-gradient-to-b from-red-600/20 to-zinc-900 border-2 border-red-500/30'
                      : 'border border-zinc-800/50 bg-zinc-900/30'
                  }`}
                >
                  {/* Popular badge */}
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 rounded-full bg-red-600 text-white text-xs font-semibold shadow-lg shadow-red-900/30">
                        Mais Popular
                      </span>
                    </div>
                  )}

                  {/* Icon + Name */}
                  <div className="text-center mb-6">
                    <div className={`w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center ${
                      plan.highlighted ? 'bg-red-500/20' : 'bg-zinc-800'
                    }`}>
                      <Icon className={`w-5 h-5 ${plan.highlighted ? 'text-red-400' : 'text-zinc-400'}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl font-bold text-white">
                        R${plan.price.toFixed(2).replace('.00', '')}
                      </span>
                      <span className="text-sm text-zinc-500">
                        /{plan.period}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-500 mt-1">
                      {plan.description}
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-zinc-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link
                    to={plan.href}
                    className={`group flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                      plan.highlighted
                        ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20'
                        : 'border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800 text-zinc-300 hover:text-white'
                    }`}
                  >
                    <span>{plan.cta}</span>
                    <svg
                      className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </motion.div>
              </FadeIn>
            )
          })}
        </div>

        {/* Trust */}
        <FadeIn delay={0.4}>
          <div className="mt-12 text-center">
            <p className="text-sm text-zinc-500 mb-4">
              Pagamento seguro via PIX ou cartão. Cancele quando quiser.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-400">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-red-400" />
                <span>Não precisa de cartão</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-red-400" />
                <span>Cancele quando quiser</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-red-400" />
                <span>Suporte humano</span>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}