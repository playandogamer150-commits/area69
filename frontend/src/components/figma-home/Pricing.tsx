import { motion } from 'framer-motion';
import { Check, Sparkles, Zap, Crown, ArrowRight } from 'lucide-react';
import { FadeIn } from '@/components/animations/FadeIn';
import { Link } from 'react-router-dom';

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
    cta: 'Começar Agora',
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
    cta: 'Falar com Vendas',
    href: '/auth',
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative py-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[180px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <FadeIn>
            <span className="inline-block text-xs text-red-400 tracking-[0.3em] uppercase mb-3">
              Preços
            </span>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 font-['Space_Grotesk',sans-serif]">
              Planos Simples
            </h2>
          </FadeIn>
          <FadeIn delay={0.15}>
            <p className="text-base text-gray-400 max-w-xl mx-auto">
              Comece com o Starter, faça upgrade quando precisar. Sem taxas escondidas.
            </p>
          </FadeIn>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <FadeIn key={plan.name} delay={0.1 + index * 0.05}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.3 }}
                  className={`relative rounded-xl p-6 ${
                    plan.highlighted
                      ? 'bg-gradient-to-b from-red-600/20 to-black border border-red-500/30'
                      : 'bg-white/[0.02] border border-white/5'
                  }`}
                >
                  {/* Popular badge */}
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-medium rounded-full">
                        Mais Popular
                      </span>
                    </div>
                  )}

                  {/* Plan Header */}
                  <div className="text-center mb-4">
                    <div className="w-10 h-10 rounded-lg border border-white/10 flex items-center justify-center mx-auto mb-3">
                      <Icon className={`w-5 h-5 ${plan.highlighted ? 'text-red-400' : 'text-white'}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1 font-['Space_Grotesk',sans-serif]">
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline justify-center gap-1 mb-1">
                      <span className="text-3xl font-bold text-white font-['Space_Grotesk',sans-serif]">
                        R${plan.price.toFixed(2).replace('.00', '')}
                      </span>
                      <span className="text-xs text-gray-400">/{plan.period}</span>
                    </div>
                    <p className="text-xs text-gray-500">{plan.description}</p>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-2 mb-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-xs">
                        <Check className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Link
                    to={plan.href}
                    className={`group flex items-center justify-center gap-2 w-full py-3 rounded-lg text-sm font-medium transition-colors ${
                      plan.highlighted
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <span>{plan.cta}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
              </FadeIn>
            );
          })}
        </div>

        {/* Trust indicators */}
        <FadeIn delay={0.4}>
          <div className="mt-10 text-center">
            <p className="text-xs text-gray-500 mb-4">
              Pagamento seguro via PIX ou cartão. Cancele quando quiser.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-400">
              {['Não precisa de cartão', 'Cancele quando quiser', 'Suporte humano'].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-red-400" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}