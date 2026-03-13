import { motion } from "motion/react";
import { useState } from "react";
import { Link } from "react-router-dom";

const angles = [
  {
    id: 1,
    src: "https://i.imgur.com/PAOJdVl.jpeg",
    label: "Front View",
    angle: "0°",
  },
  {
    id: 2,
    src: "https://i.imgur.com/jA3rpgk.jpeg",
    label: "Side Angle",
    angle: "45°",
  },
  {
    id: 3,
    src: "https://i.imgur.com/gS6dqLP.jpeg",
    label: "Dynamic Pose",
    angle: "90°",
  },
];

export function AnglesGallery() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <section className="relative py-20 sm:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-black" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-600/30 to-transparent" />

      {/* Ambient glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-red-600/[0.04] rounded-full blur-[200px]" />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-red-800/[0.03] rounded-full blur-[150px]" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-red-600/30 bg-red-600/10 text-red-400 text-sm mb-8 tracking-wider uppercase font-['Space_Grotesk',sans-serif]">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Controle Total de Câmera
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 font-['Space_Grotesk',sans-serif]">
            Um cenário. <span className="text-red-600">Infinitos ângulos.</span>
          </h2>

          <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto mb-4">
            Com o sistema de <span className="text-white font-medium">ÂNGULOS</span> da AREA 69, você controla a câmera como um diretor de cinema. Mesmo cenário, mesma modelo — resultados completamente diferentes a cada ângulo.
          </p>

          <p className="text-sm text-gray-500 max-w-xl mx-auto">
            Gire, ajuste e explore cada perspectiva. Crie sets fotográficos completos sem sair da plataforma.
          </p>
        </motion.div>

        {/* Angle indicator bar */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          whileInView={{ opacity: 1, scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex justify-center mb-10 sm:mb-16"
        >
          <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full border border-white/[0.06] bg-white/[0.03] backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)]">
            {angles.map((angle, i) => (
              <div key={angle.id} className="flex items-center gap-3">
                <button
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseLeave={() => setActiveIndex(null)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-full transition-all duration-300 ${
                    activeIndex === i
                      ? "bg-red-600/20 border border-red-600/40 text-red-400"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                  </svg>
                  <span className="text-[10px] sm:text-xs tracking-wider uppercase font-['Space_Grotesk',sans-serif] font-medium">
                    {angle.angle}
                  </span>
                </button>
                {i < angles.length - 1 && (
                  <div className="w-4 sm:w-8 h-px bg-gradient-to-r from-red-600/30 to-red-600/10" />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Gallery grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 lg:gap-7">
          {angles.map((angle, index) => (
            <motion.div
              key={angle.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: index * 0.15 }}
              className="relative group"
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {/* Image container */}
              <div
                className={`relative aspect-[3/4] rounded-2xl overflow-hidden border transition-all duration-500 ${
                  activeIndex === index
                    ? "border-red-600/40 shadow-[0_8px_40px_rgba(220,38,38,0.15),0_0_80px_rgba(220,38,38,0.06)]"
                    : "border-white/[0.08] shadow-[0_8px_35px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.03)]"
                }`}
              >
                <img
                  src={angle.src}
                  alt={`Ângulo ${angle.angle} — AREA 69 AI`}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Top gradient */}
                <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-black/50 to-transparent pointer-events-none z-10" />

                {/* Bottom gradient */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none z-10" />

                {/* Angle badge — top left */}
                <div className="absolute top-4 left-4 z-20">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/70 border border-white/10 backdrop-blur-xl shadow-[0_4px_12px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]">
                    <svg className="w-3.5 h-3.5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12a9 9 0 11-6.22-8.56" />
                      <path d="M21 3v5h-5" />
                    </svg>
                    <span className="text-[11px] tracking-[0.2em] uppercase text-white/80 font-['Space_Grotesk',sans-serif] font-medium">
                      {angle.angle}
                    </span>
                  </div>
                </div>

                {/* Label — bottom */}
                <div className="absolute bottom-5 left-5 right-5 z-20 flex items-end justify-between">
                  <div>
                    <span className="block text-xs tracking-[0.2em] uppercase text-red-400/80 font-['Space_Grotesk',sans-serif] mb-1">
                      Ângulo
                    </span>
                    <span className="block text-sm text-white font-medium font-['Space_Grotesk',sans-serif]">
                      {angle.label}
                    </span>
                  </div>

                  {/* Camera icon */}
                  <div className="w-9 h-9 rounded-full bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </div>
                </div>

                {/* Red border glow on hover */}
                <div className="absolute inset-0 rounded-2xl border-2 border-red-600/0 group-hover:border-red-600/20 transition-all duration-500 pointer-events-none z-30" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom text + CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 sm:gap-6 px-6 sm:px-8 py-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-md mb-8 shadow-[0_4px_25px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)]">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
              <span>
                <span className="text-white font-medium">+50 ângulos</span> disponíveis
              </span>
            </div>
            <div className="w-px h-5 bg-white/10" />
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Cenários ilimitados
            </div>
          </div>

          <div>
            <Link to="/auth" className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-300 font-['Space_Grotesk',sans-serif] font-semibold tracking-wide shadow-[0_4px_15px_rgba(220,38,38,0.4),0_0_60px_rgba(220,38,38,0.1),inset_0_1px_0_rgba(255,255,255,0.1)] hover:shadow-[0_6px_30px_rgba(220,38,38,0.5),0_0_80px_rgba(220,38,38,0.15),inset_0_1px_0_rgba(255,255,255,0.15)] hover:-translate-y-0.5">
              Explorar Todos os Ângulos
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}