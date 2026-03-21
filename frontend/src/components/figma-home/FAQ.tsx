'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { FadeIn } from '@/components/animations';

const faqs = [
  {
    question: 'Como funciona a geração de imagens?',
    answer: 'Você faz upload de uma foto de referência, escolhe o cenário/pose desejado, e nossa IA gera imagens ultra-realistas em segundos. Tudo isso com sua modelo virtual consistente.',
  },
  {
    question: 'A plataforma é realmente privada?',
    answer: 'Sim. Suas imagens e criações são armazenadas de forma criptografada e nunca são compartilhadas. Você tem controle total sobre sua galeria.',
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
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="relative py-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <FadeIn>
            <span className="inline-block text-xs text-red-400 tracking-[0.3em] uppercase mb-3">
              FAQ
            </span>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 font-['Space_Grotesk',sans-serif]">
              Perguntas Frequentes
            </h2>
          </FadeIn>
        </div>

        {/* FAQ Items */}
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <FadeIn key={index} delay={0.1 + index * 0.05}>
              <motion.div
                className="rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left"
                >
                  <span className="font-medium text-white font-['Space_Grotesk',sans-serif]">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform ${
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
                  <p className="px-6 pb-4 text-sm text-gray-400">
                    {faq.answer}
                  </p>
                </motion.div>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}