import { motion } from "motion/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";

const faqs = [
  {
    question: "Preciso saber usar IA?",
    answer: "Não. A AREA 69 AI foi desenvolvida para ser intuitiva e acessível. Você só precisa escrever prompts simples e a plataforma cuida de todo o resto. Nossa tecnologia transforma suas ideias em resultados profissionais.",
  },
  {
    question: "Posso criar minha própria modelo?",
    answer: "Sim, absolutamente. Você tem controle total sobre a criação da sua modelo virtual. Defina aparência, estilo, características e identidade visual. Sua modelo será única e exclusivamente sua.",
  },
  {
    question: "A plataforma é privada?",
    answer: "100% privada. Seu conteúdo, suas criações e suas operações ficam totalmente protegidas. AREA 69 AI é uma plataforma fechada com acesso exclusivo apenas para membros.",
  },
  {
    question: "Como funciona o acesso?",
    answer: "Crie sua conta, ative sua licença e comece a usar imediatamente. O processo é simples, rápido e totalmente privado. Você recebe acesso completo à plataforma.",
  },
  {
    question: "Preciso ter experiência?",
    answer: "Não é necessária nenhuma experiência prévia. Nossa interface foi projetada para ser poderosa e ao mesmo tempo acessível. Desde iniciantes até profissionais, todos conseguem criar conteúdo de alto nível.",
  },
];

export function FAQ() {
  return (
    <section className="relative py-20 sm:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-black" />

      {/* Depth ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/[0.03] rounded-full blur-[180px]" />

      <div className="relative z-10 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-10 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
            Perguntas <span className="text-red-600">frequentes</span>
          </h2>
          <p className="text-base sm:text-xl text-gray-300">
            Tudo que você precisa saber sobre a AREA 69 AI
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border border-white/[0.08] rounded-xl bg-gradient-to-b from-neutral-900/40 to-black/40 px-6 backdrop-blur-sm data-[state=open]:border-red-600/30 shadow-[0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.04)] data-[state=open]:shadow-[0_4px_25px_rgba(0,0,0,0.5),0_0_40px_rgba(220,38,38,0.06),inset_0_1px_0_rgba(255,255,255,0.06)] transition-shadow"
              >
                <AccordionTrigger className="text-left text-base sm:text-lg hover:text-red-500 transition-colors py-5 sm:py-6">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-300 leading-relaxed pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}