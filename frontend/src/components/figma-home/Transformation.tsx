import { motion } from "motion/react";
import { Crown, Zap, Lock } from "lucide-react";

export function Transformation() {
  return (
    <section className="relative py-20 sm:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Dark background */}
      <div className="absolute inset-0 bg-black" />
      
      {/* Subtle red lines with glow */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-600/50 to-transparent shadow-[0_0_15px_rgba(220,38,38,0.3)]" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-600/50 to-transparent shadow-[0_0_15px_rgba(220,38,38,0.3)]" />

      {/* Depth ambient glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-red-600/[0.05] rounded-full blur-[200px]" />
      <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-red-800/[0.04] rounded-full blur-[120px]" />

      <div className="relative z-10 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          {/* Premium badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-red-600/30 bg-red-950/30 backdrop-blur-md mb-12 shadow-[0_4px_20px_rgba(220,38,38,0.1),inset_0_1px_0_rgba(255,255,255,0.05)]"
          >
            <Crown className="w-5 h-5 text-red-500 drop-shadow-[0_0_6px_rgba(220,38,38,0.5)]" />
            <span className="text-sm font-medium">Exclusivo. Premium. Transformador.</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-bold mb-6 sm:mb-8 leading-tight"
          >
            NÃ£o Ã© apenas uma ferramenta.<br />
            Ã‰ uma <span className="text-red-600 drop-shadow-[0_0_30px_rgba(220,38,38,0.3)]">nova forma de criar</span>.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-base sm:text-xl text-gray-300 mb-8 sm:mb-12 leading-relaxed max-w-3xl mx-auto"
          >
            AREA 69 AI entrega poder criativo, identidade prÃ³pria e potencial de monetizaÃ§Ã£o.
            Uma plataforma privada que coloca vocÃª no controle do seu conteÃºdo e do seu futuro digital.
          </motion.p>

          {/* Feature highlights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mt-12 sm:mt-16"
          >
            <div className="group relative p-8 rounded-2xl border border-white/[0.08] bg-gradient-to-b from-neutral-900/40 to-black/40 backdrop-blur-sm transition-all duration-500 hover:border-white/15 hover:-translate-y-1 shadow-[0_4px_25px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.6),0_0_50px_rgba(220,38,38,0.05),inset_0_1px_0_rgba(255,255,255,0.08)]">
              <Lock className="w-12 h-12 text-red-500 mb-4 mx-auto drop-shadow-[0_0_10px_rgba(220,38,38,0.3)]" />
              <h3 className="text-2xl font-bold mb-3">Exclusividade</h3>
              <p className="text-gray-400">Acesso restrito. Comunidade selecionada. ExperiÃªncia premium.</p>
              <div className="absolute -inset-1 rounded-3xl bg-white/[0.01] opacity-0 group-hover:opacity-100 transition-opacity blur-xl -z-10" />
            </div>

            <div className="group relative p-8 rounded-2xl border border-red-600/30 bg-gradient-to-b from-red-950/30 to-black/40 backdrop-blur-sm transition-all duration-500 hover:border-red-600/40 hover:-translate-y-1 shadow-[0_4px_25px_rgba(0,0,0,0.5),0_0_40px_rgba(220,38,38,0.08),inset_0_1px_0_rgba(255,255,255,0.05)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.6),0_0_70px_rgba(220,38,38,0.12),inset_0_1px_0_rgba(255,255,255,0.08)]">
              <Zap className="w-12 h-12 text-red-500 mb-4 mx-auto drop-shadow-[0_0_10px_rgba(220,38,38,0.3)]" />
              <h3 className="text-2xl font-bold mb-3">Poder</h3>
              <p className="text-gray-400">Controle total. CriaÃ§Ã£o ilimitada. Tecnologia de ponta.</p>
              <div className="absolute -inset-1 rounded-3xl bg-red-600/[0.03] opacity-0 group-hover:opacity-100 transition-opacity blur-xl -z-10" />
            </div>

            <div className="group relative p-8 rounded-2xl border border-white/[0.08] bg-gradient-to-b from-neutral-900/40 to-black/40 backdrop-blur-sm transition-all duration-500 hover:border-white/15 hover:-translate-y-1 shadow-[0_4px_25px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.6),0_0_50px_rgba(220,38,38,0.05),inset_0_1px_0_rgba(255,255,255,0.08)]">
              <Crown className="w-12 h-12 text-red-500 mb-4 mx-auto drop-shadow-[0_0_10px_rgba(220,38,38,0.3)]" />
              <h3 className="text-2xl font-bold mb-3">Oportunidade</h3>
              <p className="text-gray-400">Monetize seu conteÃºdo. Construa sua operaÃ§Ã£o digital.</p>
              <div className="absolute -inset-1 rounded-3xl bg-white/[0.01] opacity-0 group-hover:opacity-100 transition-opacity blur-xl -z-10" />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
