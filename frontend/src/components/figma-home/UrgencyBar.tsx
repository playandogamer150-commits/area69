import { motion } from "motion/react";
import { Link } from "react-router-dom";

export function UrgencyBar() {
  return (
    <section className="relative bg-red-600 overflow-hidden py-3 sm:py-5 shadow-[0_4px_30px_rgba(220,38,38,0.3),0_1px_0_rgba(255,255,255,0.1)_inset]">
      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Animated glow pulse */}
      <motion.div
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 bg-gradient-to-r from-red-800/40 via-transparent to-red-800/40 pointer-events-none"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-center"
        >
          {/* Flame icon */}
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg className="w-7 h-7 text-white flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C12 2 8 6.5 8 10.5C8 12.43 8.93 14.16 10.37 15.27C10.14 14.71 10 14.12 10 13.5C10 11.5 11.5 9.5 12 8C12.5 9.5 14 11.5 14 13.5C14 14.12 13.86 14.71 13.63 15.27C15.07 14.16 16 12.43 16 10.5C16 8 14 5 12 2Z" />
              <path d="M12 22C9.24 22 7 19.76 7 17C7 14.5 9 12.5 9 12.5C9 12.5 9.5 14 11 14.5C11 13.5 11.5 12.5 12 12C12.5 12.5 13 13.5 13 14.5C14.5 14 15 12.5 15 12.5C15 12.5 17 14.5 17 17C17 19.76 14.76 22 12 22Z" />
            </svg>
          </motion.div>

          {/* Main text */}
          <p className="text-sm sm:text-lg font-semibold text-white tracking-wide">
            Brilhem os fracos —{" "}
            <span className="italic font-normal opacity-90">mas quem se dignifica a clicar</span>{" "}
            <Link
              to="/auth"
              className="underline underline-offset-4 decoration-white/70 font-bold hover:decoration-white transition-all cursor-pointer uppercase tracking-wider"
            >
              AQUI
            </Link>{" "}
            <span className="italic font-normal opacity-90">amarra a própria fortuna.</span>
          </p>

          {/* Arrow CTA */}
          <Link to="/auth">
            <motion.div
              whileHover={{ x: 4 }}
              transition={{ type: "spring", stiffness: 400 }}
              className="flex items-center gap-2 bg-black/30 hover:bg-black/50 border border-white/30 text-white text-sm font-bold px-5 py-2 rounded-full transition-all flex-shrink-0 shadow-[0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.5)] backdrop-blur-sm"
            >
              Garantir minha vaga
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
