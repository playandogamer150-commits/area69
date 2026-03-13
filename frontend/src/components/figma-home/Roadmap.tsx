import { motion } from "motion/react";
import { Layers, Video, Film, Users, GraduationCap, Boxes } from "lucide-react";

const roadmapItems = [
  {
    icon: Layers,
    title: "LoRA Studio",
    description: "Treinamento personalizado de modelos IA",
  },
  {
    icon: Video,
    title: "VÃ­deos",
    description: "GeraÃ§Ã£o de vÃ­deo com IA",
  },
  {
    icon: Film,
    title: "EdiÃ§Ã£o de VÃ­deo",
    description: "Suite completa de ediÃ§Ã£o",
  },
  {
    icon: Users,
    title: "Afiliados",
    description: "Programa de afiliaÃ§Ã£o premium",
  },
  {
    icon: GraduationCap,
    title: "Cursos",
    description: "Academia completa dentro da plataforma",
  },
  {
    icon: Boxes,
    title: "ExpansÃ£o do Ecossistema",
    description: "Novas ferramentas e integraÃ§Ãµes",
  },
];

export function Roadmap() {
  return (
    <section className="relative py-20 sm:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-neutral-950 to-black" />

      {/* Depth ambient glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-red-600/[0.04] rounded-full blur-[180px]" />

      <div className="relative z-10 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 sm:mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-600/30 bg-red-950/20 mb-8">
            <span className="text-sm text-red-100">Em Desenvolvimento</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
            O futuro da <span className="text-red-600">AREA 69</span>
          </h2>
          <p className="text-base sm:text-xl text-gray-300 max-w-2xl mx-auto">
            Uma visÃ£o de expansÃ£o contÃ­nua. Novas funcionalidades premium que ampliam ainda mais seu poder criativo.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {roadmapItems.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="group relative"
            >
              <div className="relative p-8 rounded-2xl border border-white/[0.06] bg-gradient-to-b from-neutral-900/40 to-black/50 backdrop-blur-sm hover:border-red-600/25 transition-all duration-500 hover:-translate-y-1 shadow-[0_4px_20px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.6),0_0_50px_rgba(220,38,38,0.06),inset_0_1px_0_rgba(255,255,255,0.07)]">
                {/* Icon */}
                <div className="mb-6 inline-flex p-3 rounded-xl bg-neutral-800/50 border border-white/5 group-hover:bg-red-600/10 group-hover:border-red-600/20 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.04)] group-hover:shadow-[0_4px_15px_rgba(220,38,38,0.1)]">
                  <item.icon className="w-6 h-6 text-gray-400 group-hover:text-red-500 transition-colors" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.description}</p>

                {/* Coming soon badge */}
                <div className="absolute top-4 right-4">
                  <span className="text-xs px-3 py-1 rounded-full bg-red-950/40 border border-red-600/20 text-red-400 shadow-[0_2px_8px_rgba(220,38,38,0.08)]">
                    IncluÃ­do
                  </span>
                </div>

                {/* Hover glow */}
                <div className="absolute -inset-1 rounded-3xl bg-red-600/[0.02] opacity-0 group-hover:opacity-100 transition-opacity blur-xl -z-10" />
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="text-center mt-16"
        >
          <p className="text-gray-400">
            E muito mais por vir. A evoluÃ§Ã£o nunca para.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
