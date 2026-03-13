import { motion } from "motion/react";
import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";

const comparisons = [
  {
    id: 1,
    before:
      "https://i.imgur.com/g5L7yok.jpeg",
    after:
      "https://i.imgur.com/5Ul0UCF.jpeg",
    label: "Modelo Editorial",
  },
  {
    id: 2,
    before:
      "https://i.imgur.com/ugyV1RE.jpeg",
    after:
      "https://i.imgur.com/5WMNhci.jpeg",
    label: "Aesthetic Neon",
  },
  {
    id: 3,
    before:
      "https://i.imgur.com/vNhxkdw.jpeg",
    after:
      "https://i.imgur.com/m1SfJJc.png",
    label: "Cinematic Premium",
  },
];

function ComparisonSlider({
  before,
  after,
  label,
}: {
  before: string;
  after: string;
  label: string;
}) {
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateSlider = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPos(percent);
    },
    []
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      setIsDragging(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      updateSlider(e.clientX);
    },
    [updateSlider]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      updateSlider(e.clientX);
    },
    [isDragging, updateSlider]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Animate slider in on first view
  const [hasAnimated, setHasAnimated] = useState(false);
  useEffect(() => {
    if (!hasAnimated) {
      const timeout = setTimeout(() => {
        setSliderPos(35);
        setTimeout(() => {
          setSliderPos(65);
          setTimeout(() => {
            setSliderPos(50);
            setHasAnimated(true);
          }, 400);
        }, 400);
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [hasAnimated]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7 }}
      className="relative group"
    >
      {/* Label */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
        <div className="px-4 py-1.5 rounded-full bg-black/80 border border-white/10 backdrop-blur-xl text-xs tracking-widest uppercase text-gray-300 font-['Space_Grotesk',sans-serif] shadow-[0_4px_15px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.06)]">
          {label}
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative aspect-[3/4] sm:aspect-[4/5] rounded-2xl overflow-hidden cursor-col-resize select-none border border-white/[0.08] shadow-[0_8px_40px_rgba(0,0,0,0.6),0_0_60px_rgba(220,38,38,0.06),inset_0_1px_0_rgba(255,255,255,0.04)]"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ touchAction: "none" }}
      >
        {/* After image (full background) */}
        <img
          src={after}
          alt="Depois â€” AREA 69 AI"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />

        {/* Before image (clipped) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPos}%` }}
        >
          <img
            src={before}
            alt="Antes"
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              width: containerRef.current
                ? `${containerRef.current.offsetWidth}px`
                : "100vw",
              maxWidth: "none",
            }}
            draggable={false}
          />

          {/* Grainy overlay on before */}
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* Labels ANTES / DEPOIS */}
        <div
          className="absolute bottom-6 left-6 z-20 transition-opacity duration-300"
          style={{ opacity: sliderPos > 20 ? 1 : 0 }}
        >
          <span className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-xs tracking-widest uppercase text-white/80 font-['Space_Grotesk',sans-serif]">
            Antes
          </span>
        </div>
        <div
          className="absolute bottom-6 right-6 z-20 transition-opacity duration-300"
          style={{ opacity: sliderPos < 80 ? 1 : 0 }}
        >
          <span className="px-3 py-1.5 rounded-lg bg-red-600/30 backdrop-blur-md border border-red-500/30 text-xs tracking-widest uppercase text-red-200 font-['Space_Grotesk',sans-serif]">
            Depois
          </span>
        </div>

        {/* Slider line */}
        <div
          className="absolute top-0 bottom-0 z-20 w-[2px]"
          style={{
            left: `${sliderPos}%`,
            transform: "translateX(-50%)",
            transition: isDragging ? "none" : "left 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {/* Glowing line */}
          <div className="absolute inset-0 w-[2px] bg-white shadow-[0_0_12px_rgba(255,255,255,0.5)]" />

          {/* Red glow pulse */}
          <div className="absolute inset-0 w-[2px] bg-red-500/50 blur-[4px] animate-pulse" />

          {/* Handle */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform duration-300"
            style={{ transform: `translate(-50%, -50%) scale(${isDragging || isHovered ? 1.15 : 1})` }}
          >
            {/* Outer glow ring */}
            <div className="absolute inset-0 -m-2 rounded-full bg-red-500/20 blur-md animate-pulse" />

            <div className="relative w-12 h-12 rounded-full bg-black/80 border-2 border-white/90 backdrop-blur-xl flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.4)]">
              {/* Arrows */}
              <svg
                className="w-5 h-5 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 12L3 12M3 12L5.5 9.5M3 12L5.5 14.5" />
                <path d="M17 12L21 12M21 12L18.5 9.5M21 12L18.5 14.5" />
              </svg>
            </div>
          </div>
        </div>

        {/* Top red gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/40 to-transparent pointer-events-none z-10" />
        {/* Bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-10" />
      </div>
    </motion.div>
  );
}

export function BeforeAfterGallery() {
  return (
    <section className="relative py-20 sm:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-black" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-600/40 to-transparent" />

      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/8 rounded-full blur-[180px]" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-red-600/5 rounded-full blur-[120px]" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-6"
        >
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full border border-red-600/30 bg-red-600/10 text-red-400 text-xs sm:text-sm mb-6 sm:mb-8 tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Arraste para comparar
          </div>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 font-['Space_Grotesk',sans-serif]">
            Veja a diferenÃ§a com{" "}
            <span className="text-red-600">seus prÃ³prios olhos.</span>
          </h2>
          <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto">
            De um prompt bÃ¡sico para uma criaÃ§Ã£o ultra-realista em segundos.
            Deslize a barra e comprove o poder da AREA 69 AI.
          </p>
        </motion.div>

        {/* Instruction hint (mobile) */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="flex justify-center mb-12"
        >
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg className="w-4 h-4 animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M7 12h10M12 7l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Arraste a barra para revelar a transformaÃ§Ã£o
          </div>
        </motion.div>

        {/* Gallery grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 lg:gap-8">
          {comparisons.map((comp) => (
            <ComparisonSlider
              key={comp.id}
              before={comp.before}
              after={comp.after}
              label={comp.label}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <p className="text-gray-500 text-sm mb-6">
            Essas imagens foram geradas 100% por IA. Nenhuma modelo real foi utilizada.
          </p>
          <Link to="/auth" className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-300 font-['Space_Grotesk',sans-serif] font-semibold tracking-wide shadow-[0_4px_15px_rgba(220,38,38,0.4),0_0_60px_rgba(220,38,38,0.1),inset_0_1px_0_rgba(255,255,255,0.1)] hover:shadow-[0_6px_30px_rgba(220,38,38,0.5),0_0_80px_rgba(220,38,38,0.15),inset_0_1px_0_rgba(255,255,255,0.15)] hover:-translate-y-0.5">
            Quero Criar as Minhas Agora
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
