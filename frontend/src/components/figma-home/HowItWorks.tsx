import { motion } from "motion/react";

const steps = [
  {
    number: "01",
    title: "Acesse o Círculo Restrito",
    description:
      "Enquanto outros esperam na fila, você entra direto. Cadastro blindado, sem exposição, sem julgamento. Apenas os escolhidos operam aqui.",
    badge: "ACESSO LIMITADO",
  },
  {
    number: "02",
    title: "Crie Sua Máquina de Desejo",
    description:
      "Modele personagens únicos que ninguém mais terá. Sua identidade visual exclusiva vira um ativo digital — quanto antes criar, mais território você domina.",
    badge: "VANTAGEM COMPETITIVA",
  },
  {
    number: "03",
    title: "Monetize Enquanto Outros Assistem",
    description:
      "Criadores da primeira leva já estão faturando. A janela está aberta agora — mas cada vaga preenchida é uma a menos pra quem ficou de fora.",
    badge: "RECEITA RECORRENTE",
  },
];

const socialProofAvatars = [
  "https://images.unsplash.com/photo-1762753674498-73ec49feafc4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMG1hbiUyMHBvcnRyYWl0JTIwaGVhZHNob3QlMjBwcm9mZXNzaW9uYWx8ZW58MXx8fHwxNzczMTAxNzA2fDA&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1705830337569-47a1a24b0ad2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHdvbWFuJTIwcG9ydHJhaXQlMjBoZWFkc2hvdCUyMGNhc3VhbHxlbnwxfHx8fDE3NzMxNDA4NDh8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1552766990-9c55313f926f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXRpbiUyMG1hbiUyMHBvcnRyYWl0JTIwZmFjZSUyMGNsb3NldXB8ZW58MXx8fHwxNzczMjAwNTU0fDA&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1562944567-de8d41d876fe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicmF6aWxpYW4lMjB3b21hbiUyMHBvcnRyYWl0JTIwc21pbGUlMjBoZWFkc2hvdHxlbnwxfHx8fDE3NzMyMDA1NTV8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1737574821698-862e77f044c1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMGVudHJlcHJlbmV1ciUyMG1hbiUyMHBvcnRyYWl0JTIwY29uZmlkZW50fGVufDF8fHx8MTc3MzIwMDU1NXww&ixlib=rb-4.1.0&q=80&w=1080",
];

function StepIcon({ index }: { index: number }) {
  if (index === 0) {
    return (
      <svg className="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C12 2 7 7.5 7 12C7 14.76 9.24 17 12 17C14.76 17 17 14.76 17 12C17 9 15 6 13.5 4C13.5 4 13.5 6.5 12 7.5C10.5 6.5 12 2 12 2ZM12 19C8.13 19 5 15.87 5 12C5 8 8 4.5 8 4.5C8 4.5 7.5 8 9.5 9.5C9.5 9.5 9 7.5 10.5 6.5C10.5 6.5 10 10 12 11C14 10 13.5 6.5 13.5 6.5C15 7.5 14.5 9.5 14.5 9.5C16.5 8 16 4.5 16 4.5C16 4.5 19 8 19 12C19 15.87 15.87 19 12 19Z" />
      </svg>
    );
  }
  if (index === 1) {
    return (
      <svg className="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C8.5 2 5.5 4 4 7C3.3 8.4 3 9.9 3 11.5C3 15.09 5.41 18.09 8.72 19.41C9.39 19.68 9.83 20.32 9.83 21H14.17C14.17 20.32 14.61 19.68 15.28 19.41C18.59 18.09 21 15.09 21 11.5C21 9.9 20.7 8.4 20 7C18.5 4 15.5 2 12 2ZM9 12.5C8.17 12.5 7.5 11.83 7.5 11C7.5 10.17 8.17 9.5 9 9.5C9.83 9.5 10.5 10.17 10.5 11C10.5 11.83 9.83 12.5 9 12.5ZM12 16C10.5 16 9.25 15.19 8.5 14H15.5C14.75 15.19 13.5 16 12 16ZM15 12.5C14.17 12.5 13.5 11.83 13.5 11C13.5 10.17 14.17 9.5 15 9.5C15.83 9.5 16.5 10.17 16.5 11C16.5 11.83 15.83 12.5 15 12.5Z" />
      </svg>
    );
  }
  return (
    <svg className="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 1L15.5 8.5L23 9.5L17.5 14.8L19 22L12 18.3L5 22L6.5 14.8L1 9.5L8.5 8.5L12 1Z" />
    </svg>
  );
}

export function HowItWorks() {
  return (
    <section className="relative py-20 sm:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-black" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-50" />

      {/* Depth ambient glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-600/[0.06] rounded-full blur-[150px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-red-800/[0.03] rounded-full blur-[180px]" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 sm:mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full border border-red-600/30 bg-red-600/10 text-red-400 text-xs sm:text-sm mb-6 sm:mb-8 tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Método validado por +2.400 criadores
          </div>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 font-['Space_Grotesk',sans-serif]">
            Três passos para sair do zero.
            <br />
            <span className="text-red-600">Um caminho sem volta.</span>
          </h2>
          <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto">
            Quem entrou primeiro já está colhendo resultados. O processo é simples
            — mas a vantagem é de quem age agora.
          </p>
        </motion.div>

        {/* Steps grid */}
        <div className="relative">
          {/* Horizontal connecting line (desktop) */}
          <div className="hidden lg:block absolute top-[88px] left-[16.67%] right-[16.67%] h-px">
            
            
          </div>

          <div className="grid lg:grid-cols-3 gap-8 lg:gap-6 items-stretch">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="relative flex flex-col"
              >
                {/* Card — flex-1 forces equal height */}
                <div className="relative flex-1 flex flex-col rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-8 pt-20 overflow-hidden transition-all duration-500 hover:border-red-600/25 hover:bg-white/[0.05] group shadow-[0_4px_25px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.03)_inset,0_1px_0_rgba(255,255,255,0.06)_inset] hover:shadow-[0_12px_45px_rgba(0,0,0,0.6),0_0_60px_rgba(220,38,38,0.07),0_0_0_1px_rgba(220,38,38,0.1)_inset,0_1px_0_rgba(255,255,255,0.08)_inset] hover:-translate-y-1 backdrop-blur-sm">
                  {/* Large background number — watermark */}
                  <div
                    className="absolute -top-4 -left-1 font-['Space_Grotesk',sans-serif] font-bold text-[120px] leading-none text-transparent select-none pointer-events-none"
                    style={{
                      WebkitTextStroke: "1.5px rgba(220, 38, 38, 0.12)",
                    }}
                  >
                    {step.number}
                  </div>

                  {/* Icon + Badge row */}
                  <div className="relative z-10 flex items-center gap-3 mb-8">
                    {/* Icon circle */}
                    <div className="relative shrink-0">
                      <div className="absolute inset-0 bg-red-600/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="relative w-12 h-12 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center backdrop-blur-sm shadow-[0_2px_10px_rgba(220,38,38,0.15),inset_0_1px_0_rgba(255,255,255,0.05)]">
                        <StepIcon index={index} />
                      </div>
                    </div>

                    {/* Badge */}
                    <div className="px-3 py-1 rounded-full bg-red-600/10 border border-red-600/25 text-red-400 text-[11px] tracking-[0.15em] uppercase font-medium font-['Space_Grotesk',sans-serif] shadow-[0_2px_8px_rgba(220,38,38,0.1)]">
                      {step.badge}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="relative z-10 text-[22px] font-bold mb-3 font-['Space_Grotesk',sans-serif] leading-tight">
                    {step.title}
                  </h3>

                  {/* Description — flex-1 pushes to fill remaining space */}
                  <p className="relative z-10 flex-1 text-[15px] text-gray-400 leading-relaxed">
                    {step.description}
                  </p>

                  {/* Bottom accent line */}
                  <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-red-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>

                {/* Step connector dot (desktop) */}
                <div className="hidden lg:flex absolute -top-[5px] left-1/2 -translate-x-1/2 items-center justify-center">
                  <div className="w-[10px] h-[10px] rounded-full bg-red-600 shadow-[0_0_12px_rgba(220,38,38,0.6)]" />
                  <div className="absolute w-5 h-5 rounded-full border border-red-600/30 animate-ping" />
                </div>

                {/* Mobile vertical connector */}
                {index < steps.length - 1 && (
                  <div className="lg:hidden flex justify-center py-2">
                    <div className="w-px h-8 bg-gradient-to-b from-red-600/40 to-transparent" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Social proof + urgency footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-20 text-center"
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 sm:gap-8 px-8 py-5 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-3">
                {socialProofAvatars.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`Usuário ${i + 1}`}
                    className="w-9 h-9 rounded-full border-2 border-black object-cover"
                  />
                ))}
                
              </div>
              <span className="text-sm text-gray-400">
                <span className="text-white font-semibold">+127 pessoas</span>{" "}
                entraram hoje
              </span>
            </div>
            <div className="hidden sm:block w-px h-6 bg-white/20" />
            <span className="text-sm text-gray-400">
              Tempo médio para primeiro resultado:{" "}
              <span className="text-red-400 font-semibold">menos de 24h</span>
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}