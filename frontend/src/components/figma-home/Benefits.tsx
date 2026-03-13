import { motion } from "motion/react";
import { User, Image, Wand2, TrendingUp } from "lucide-react";

const benefits = [
  {
    icon: User,
    title: "Crie sua prÃ³pria modelo virtual",
    description: "Defina identidade, estilo e caracterÃ­sticas Ãºnicas. Controle total sobre sua criaÃ§Ã£o.",
  },
  {
    icon: Image,
    title: "Gere imagens explÃ­citas com facilidade",
    description: "Prompts simples. Resultados ultra-realistas. Tecnologia de ponta em suas mÃ£os.",
  },
  {
    icon: Wand2,
    title: "Controle visual total",
    description: "Edite, refine e ajuste cada detalhe. Seu poder criativo, sem limites.",
  },
  {
    icon: TrendingUp,
    title: "Transforme em monetizaÃ§Ã£o",
    description: "Use seu conteÃºdo para criar operaÃ§Ãµes digitais rentÃ¡veis e exclusivas.",
  },
];

export function Benefits() {
  return (
    <section className="relative py-20 sm:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-neutral-950 to-black" />
      
      {/* Ambient depth glows */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/[0.04] rounded-full blur-[180px]" />
      <div className="absolute top-1/3 right-1/3 w-[400px] h-[400px] bg-red-800/[0.03] rounded-full blur-[150px]" />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 sm:mb-20"
        >
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
            Poder criativo.<br />
            <span className="text-red-600 drop-shadow-[0_0_30px_rgba(220,38,38,0.3)]">Identidade prÃ³pria.</span>
          </h2>
          <p className="text-base sm:text-xl text-gray-300 max-w-2xl mx-auto">
            Tudo que vocÃª precisa para criar, controlar e monetizar conteÃºdo premium.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 items-stretch">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative h-full"
            >
              <div className="relative h-full p-8 rounded-2xl border border-white/[0.08] bg-gradient-to-b from-neutral-900/60 to-black/60 backdrop-blur-md hover:border-red-600/30 transition-all duration-500 flex flex-col shadow-[0_4px_20px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.03)_inset,0_1px_0_rgba(255,255,255,0.05)_inset] hover:shadow-[0_8px_40px_rgba(0,0,0,0.6),0_0_50px_rgba(220,38,38,0.08),0_0_0_1px_rgba(220,38,38,0.1)_inset,0_1px_0_rgba(255,255,255,0.08)_inset] hover:-translate-y-1">
                {/* Icon */}
                <div className="mb-6 inline-flex p-3 rounded-xl bg-red-600/10 border border-red-600/20 group-hover:bg-red-600/20 transition-all self-start shadow-[0_2px_10px_rgba(220,38,38,0.1),inset_0_1px_0_rgba(255,255,255,0.05)] group-hover:shadow-[0_4px_20px_rgba(220,38,38,0.2),inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <benefit.icon className="w-6 h-6 text-red-500 drop-shadow-[0_0_6px_rgba(220,38,38,0.4)]" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
                <p className="text-gray-400 leading-relaxed flex-1">{benefit.description}</p>

                {/* Bottom light line */}
                <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-red-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Hover glow - multi-layer */}
                <div className="absolute inset-0 rounded-2xl bg-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity blur-xl -z-10" />
                <div className="absolute -inset-1 rounded-3xl bg-red-600/[0.03] opacity-0 group-hover:opacity-100 transition-opacity blur-2xl -z-20" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
