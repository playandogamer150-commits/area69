import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { FadeIn } from '@/components/animations/FadeIn'

const faqs = [
  {
    question: 'Como funciona a geração de imagens?',
    answer: 'Você faz upload de uma foto de referência, escolhe o cenário/pose desejado, e nossa IA gera imagens ultra-realistas em segundos. Tudo isso mantendo a consistência da modelo.',
  },
  {
    question: 'A plataforma é realmente privada?',
    answer: 'Sim. Suas imagens e criações são armazenadas de forma criptografada e nunca são compartilhadas. Você tem controle total sobre sua galeria e pode excluir tudo a qualquer momento.',
  },
  {
    question: 'Posso cancelar a qualquer momento?',
    answer: 'Absolutamente. Você pode cancelar sua assinatura a qualquer momento. Não há taxas de cancelamento ou compromissos de longo prazo.',
  },
  {
    question: 'Qual a qualidade das imagens geradas?',
    answer: 'Nossas imagens são geradas em alta resolução (até 1080p no plano Starter, qualidade máxima nos planos superiores). Utilizamos modelos de última geração para realismo superior.',
  },
  {
    question: 'Como funciona o pagamento?',
    answer: 'Aceitamos PIX, cartão de crédito e débito. Pagamentos processados de forma segura. Você recebe acesso imediatamente após a confirmação.',
  },
  {
    question: 'Posso usar as imagens comercialmente?',
    answer: 'Os planos Padrão e Empresarial incluem licença comercial. O plano Starter é apenas para uso pessoal.',
  },
  {
    question: 'Quanto tempo leva para gerar uma imagem?',
    answer: 'Em média, 10-30 segundos por imagem. Usuários dos planos superiores têm prioridade na fila e tempos de geração ainda menores.',
  },
  {
    question: 'O que acontece se eu exceder meu limite mensal?',
    answer: 'Você pode comprar créditos adicionais a qualquer momento. Também oferecemos upgrade de plano sem perder suas configurações e histórico.',
  },
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <FadeIn>
            <span className="inline-block text-sm text-red-400 tracking-wide uppercase mb-4">
              FAQ
            </span>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
              Perguntas frequentes
            </h2>
          </FadeIn>
          <FadeIn delay={0.15}>
            <p className="text-lg text-zinc-400">
              Tudo que você precisa saber sobre a plataforma.
            </p>
          </FadeIn>
        </div>

        {/* FAQ Items */}
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <FadeIn key={index} delay={0.1 + index * 0.03}>
              <motion.div
                className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 overflow-hidden"
                initial={false}
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left group"
                  aria-expanded={openIndex === index}
                >
                  <span className="font-medium text-white group-hover:text-red-400 transition-colors">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-zinc-500 transition-transform duration-200 ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <motion.div
                  initial={false}
                  animate={{
                    height: openIndex === index ? 'auto' : 0,
                    opacity: openIndex === index ? 1 : 0,
                  }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <p className="px-6 pb-4 text-sm text-zinc-400 leading-relaxed">
                    {faq.answer}
                  </p>
                </motion.div>
              </motion.div>
            </FadeIn>
          ))}
        </div>

        {/* CTA */}
        <FadeIn delay={0.5}>
          <div className="mt-12 text-center">
            <p className="text-zinc-500 mb-4">
              Ainda tem dúvidas?
            </p>
            <a
              href="https://wa.me/5521959552492"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
            >
              <span>Fale conosco no WhatsApp</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}