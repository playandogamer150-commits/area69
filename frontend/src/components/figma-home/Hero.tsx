import { motion } from "motion/react";
import { Zap } from "lucide-react";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8 py-12 sm:py-0">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 via-black to-black" />
      
      {/* Layered depth glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-red-600/10 rounded-full blur-[120px]" />
      <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] bg-red-800/8 rounded-full blur-[200px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-red-600/5 rounded-full blur-[160px]" />

      {/* Subtle grid for digital depth */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:80px_80px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />

      <div className="relative z-10 max-w-7xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left side - Text content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-left"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full border border-red-600/30 bg-red-950/30 backdrop-blur-md mb-6 sm:mb-8 shadow-[0_0_20px_rgba(220,38,38,0.1),inset_0_1px_0_rgba(255,255,255,0.05)]"
            >
              <svg className="w-4 h-4 text-red-500 drop-shadow-[0_0_4px_rgba(220,38,38,0.6)]" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C12 2 8 6.5 8 10.5C8 12.43 8.93 14.16 10.37 15.27C10.14 14.71 10 14.12 10 13.5C10 11.5 11.5 9.5 12 8C12.5 9.5 14 11.5 14 13.5C14 14.12 13.86 14.71 13.63 15.27C15.07 14.16 16 12.43 16 10.5C16 8 14 5 12 2Z" />
                <path d="M12 22C9.24 22 7 19.76 7 17C7 14.5 9 12.5 9 12.5C9 12.5 9.5 14 11 14.5C11 13.5 11.5 12.5 12 12C12.5 12.5 13 13.5 13 14.5C14.5 14 15 12.5 15 12.5C15 12.5 17 14.5 17 17C17 19.76 14.76 22 12 22Z" />
              </svg>
              <span className="text-xs sm:text-sm text-red-100">A 1º Plataforma de NSFW de IA do Brasil</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-3xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-4 sm:mb-6 leading-[1.1] font-['Space_Grotesk',sans-serif]"
            >
              Do café ao{" "}
              <span className="text-red-600 drop-shadow-[0_0_30px_rgba(220,38,38,0.4)]">décimo milésimo</span>{" "}
              sem foto de perfil.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-base sm:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed max-w-2xl"
            >
              Você não está criando uma modelo. Você está extraindo o poder de quem ninguém mais pode ter.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link to="/auth">
                <Button
                  size="lg"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg h-auto font-['Space_Grotesk',sans-serif] font-semibold tracking-wide shadow-[0_4px_15px_rgba(16,185,129,0.4),0_0_60px_rgba(16,185,129,0.15),inset_0_1px_0_rgba(255,255,255,0.1)] hover:shadow-[0_6px_25px_rgba(16,185,129,0.5),0_0_80px_rgba(16,185,129,0.2),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all hover:-translate-y-0.5"
                >
                  <Zap className="w-5 h-5 mr-2 drop-shadow-[0_0_6px_rgba(255,255,255,0.5)]" />
                  Criar Minha Modelo
                </Button>
              </Link>
              <Link to="/auth">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 hover:bg-white/5 text-white px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg h-auto font-['Space_Grotesk',sans-serif] font-semibold tracking-wide shadow-[0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] hover:shadow-[0_6px_25px_rgba(0,0,0,0.5),0_0_30px_rgba(220,38,38,0.08),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all hover:-translate-y-0.5 backdrop-blur-sm"
                >
                  Fazer Login
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="mt-8 sm:mt-12 grid grid-cols-2 sm:flex sm:items-center gap-4 sm:gap-8"
            >
              <div className="px-3 py-2 rounded-xl bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="text-2xl sm:text-3xl font-bold text-white">100%</div>
                <div className="text-xs sm:text-sm text-gray-400">Privado</div>
              </div>
              <div className="hidden sm:block h-12 w-px bg-white/10" />
              <div className="px-3 py-2 rounded-xl bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="text-2xl sm:text-3xl font-bold text-white">IA</div>
                <div className="text-xs sm:text-sm text-gray-400">Ultra-realista</div>
              </div>
              <div className="hidden sm:block h-12 w-px bg-white/10" />
              <div className="px-3 py-2 rounded-xl bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="text-2xl sm:text-3xl font-bold text-white">∞</div>
                <div className="text-xs sm:text-sm text-gray-400">Possibilidades</div>
              </div>
              <div className="hidden sm:block h-12 w-px bg-white/10" />
              <div className="px-3 py-2 rounded-xl bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="text-2xl sm:text-3xl font-bold text-red-500">🔥</div>
                <div className="text-xs sm:text-sm text-gray-400">Crie Vazado de Famosos</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right side - Product mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 1 }}
            className="relative"
            style={{ perspective: "1200px" }}
          >
            <div
              className="relative rounded-2xl border border-red-600/30 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.6),0_0_60px_rgba(220,38,38,0.15),0_0_120px_rgba(220,38,38,0.05)]"
              style={{ transform: "rotateY(-2deg) rotateX(1deg)" }}
            >
              <div style={{ overflow: "hidden" }}>
                <img
                  src="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_2zqAykxhZv8T7wdIyvYmthk1mqC%2Fhf_20260321_162540_987bb76a-5694-41d9-9023-8a14d57f50ec.jpeg&w=1280&q=85"
                  alt="AREA 69 AI Banner"
                  className="w-full h-auto block"
                  style={{ transform: "scale(1.15) translateX(-3%)", transformOrigin: "center center" }}
                />
              </div>
              {/* Subtle vignette overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />
              {/* Inner light reflection */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-transparent pointer-events-none" />
              {/* Red glow border effect */}
              <div className="absolute inset-0 rounded-2xl ring-1 ring-red-600/20 pointer-events-none" />
            </div>
            {/* Multi-layer outer glow */}
            <div className="absolute -inset-4 bg-red-600/10 rounded-3xl blur-2xl -z-10" />
            <div className="absolute -inset-8 bg-red-600/5 rounded-3xl blur-[60px] -z-20" />
            {/* Floating reflection below */}
            <div className="absolute -bottom-8 left-[10%] right-[10%] h-16 bg-red-600/8 rounded-full blur-2xl -z-10" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}