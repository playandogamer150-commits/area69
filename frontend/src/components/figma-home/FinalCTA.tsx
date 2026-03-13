import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "./ui/button";

export function FinalCTA() {
  return (
    <section className="relative py-20 sm:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Dramatic background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-red-950/20 to-black" />
      
      {/* Multi-layer depth glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-600/20 rounded-full blur-[150px]" />
      <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-red-800/10 rounded-full blur-[180px]" />
      <div className="absolute bottom-1/3 right-1/3 w-[350px] h-[350px] bg-red-600/8 rounded-full blur-[160px]" />

      {/* Top and bottom lines with glow */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-600 to-transparent shadow-[0_0_20px_rgba(220,38,38,0.4)]" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-600 to-transparent shadow-[0_0_20px_rgba(220,38,38,0.4)]" />

      {/* Subtle grid for digital feel */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(220,38,38,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(220,38,38,0.01)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {/* Premium badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-red-600/50 bg-red-950/40 backdrop-blur-md mb-12 shadow-[0_4px_20px_rgba(220,38,38,0.15),inset_0_1px_0_rgba(255,255,255,0.06)]"
          >
            <Sparkles className="w-5 h-5 text-red-500 drop-shadow-[0_0_6px_rgba(220,38,38,0.5)]" />
            <span className="text-sm font-medium">Acesso Exclusivo DisponÃ­vel</span>
          </motion.div>

          {/* Main headline */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-3xl sm:text-5xl lg:text-7xl font-bold mb-6 sm:mb-8 leading-tight font-['Space_Grotesk',sans-serif]"
          >
            Pronto para criar<br />
            <span className="text-red-600 drop-shadow-[0_0_40px_rgba(220,38,38,0.4)]">algo diferente?</span>
          </motion.h2>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-lg sm:text-2xl text-gray-300 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            Entre agora para AREA 69 AI. Crie sua modelo, gere conteÃºdo premium e transforme isso em uma operaÃ§Ã£o digital poderosa.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
          >
            <Link to="/auth">
              <Button
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-white px-8 sm:px-12 py-6 sm:py-8 text-base sm:text-xl h-auto group font-['Space_Grotesk',sans-serif] font-semibold tracking-wide shadow-[0_6px_25px_rgba(220,38,38,0.5),0_0_80px_rgba(220,38,38,0.15),inset_0_1px_0_rgba(255,255,255,0.12)] hover:shadow-[0_8px_40px_rgba(220,38,38,0.6),0_0_120px_rgba(220,38,38,0.2),inset_0_1px_0_rgba(255,255,255,0.18)] transition-all hover:-translate-y-1"
              >
                Quero Acessar Agora
                <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform drop-shadow-[0_0_6px_rgba(255,255,255,0.5)]" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 hover:bg-white/5 text-white px-8 sm:px-12 py-6 sm:py-8 text-base sm:text-xl h-auto font-['Space_Grotesk',sans-serif] font-semibold tracking-wide shadow-[0_4px_20px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)] hover:shadow-[0_6px_30px_rgba(0,0,0,0.6),0_0_40px_rgba(220,38,38,0.08),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all hover:-translate-y-0.5 backdrop-blur-sm"
              >
                JÃ¡ Tenho Conta
              </Button>
            </Link>
          </motion.div>

          {/* Social proof / features */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap justify-center gap-8 text-sm text-gray-400"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.6)]" />
              <span>Acesso Imediato</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.6)]" />
              <span>100% Privado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.6)]" />
              <span>IA Ultra-realista</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.6)]" />
              <span>Sem Limites</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
