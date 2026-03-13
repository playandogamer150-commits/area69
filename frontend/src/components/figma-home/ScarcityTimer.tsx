import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";

function getInitialTime() {
  const stored = localStorage.getItem("area69_timer_end_v2");
  if (stored) {
    const end = parseInt(stored);
    const remaining = end - Date.now();
    if (remaining > 0) return Math.floor(remaining / 1000);
  }
  const seconds = 72 * 3600 + 47 * 60 + 33;
  localStorage.setItem("area69_timer_end_v2", String(Date.now() + seconds * 1000));
  return seconds;
}

export function ScarcityTimer() {
  const [timeLeft, setTimeLeft] = useState(getInitialTime);
  const [pulse, setPulse] = useState(false);
  const [spotsLeft] = useState(247); // fake scarcity number

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          const newSeconds = 72 * 3600 + 47 * 60 + 33;
          localStorage.setItem("area69_timer_end_v2", String(Date.now() + newSeconds * 1000));
          return newSeconds;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // pulse every second on the seconds digit
  useEffect(() => {
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 300);
    return () => clearTimeout(t);
  }, [timeLeft]);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const pad = (n: number) => String(n).padStart(2, "0");

  const isUrgent = timeLeft < 3600; // less than 1 hour

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`relative overflow-hidden ${isUrgent ? "bg-red-950" : "bg-neutral-950"} border-b border-red-600/40 shadow-[0_4px_30px_rgba(0,0,0,0.6),0_0_20px_rgba(220,38,38,0.08)]`}
    >
      {/* animated background sweep */}
      <motion.div
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-red-600/10 to-transparent pointer-events-none"
      />

      <div className="relative max-w-7xl mx-auto px-4 py-3 sm:py-2">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 text-center">

          {/* Warning icon + text */}
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              <svg className="w-4 h-4 text-red-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
              </svg>
            </motion.div>
            <span className="text-[10px] sm:text-sm text-red-400 font-semibold uppercase tracking-widest">
              Oferta expira em
            </span>
          </div>

          {/* Countdown blocks */}
          <div className="flex items-center gap-1.5">
            {/* Hours */}
            <div className="flex flex-col items-center">
              <div className="bg-black border border-red-600/50 rounded-lg px-2 sm:px-2.5 py-1 min-w-[38px] sm:min-w-[44px] text-center shadow-[0_2px_10px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)]">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={hours}
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 10, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-lg sm:text-xl font-bold text-white tabular-nums block"
                  >
                    {pad(hours)}
                  </motion.span>
                </AnimatePresence>
              </div>
              <span className="text-[8px] sm:text-[9px] text-gray-500 mt-0.5 uppercase tracking-wider">horas</span>
            </div>

            <span className="text-red-500 text-lg sm:text-xl font-bold mb-3.5">:</span>

            {/* Minutes */}
            <div className="flex flex-col items-center">
              <div className="bg-black border border-red-600/50 rounded-lg px-2 sm:px-2.5 py-1 min-w-[38px] sm:min-w-[44px] text-center shadow-[0_2px_10px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)]">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={minutes}
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 10, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-lg sm:text-xl font-bold text-white tabular-nums block"
                  >
                    {pad(minutes)}
                  </motion.span>
                </AnimatePresence>
              </div>
              <span className="text-[8px] sm:text-[9px] text-gray-500 mt-0.5 uppercase tracking-wider">min</span>
            </div>

            <span className="text-red-500 text-lg sm:text-xl font-bold mb-3.5">:</span>

            {/* Seconds */}
            <div className="flex flex-col items-center">
              <div className={`bg-black border rounded-lg px-2 sm:px-2.5 py-1 min-w-[38px] sm:min-w-[44px] text-center transition-colors duration-200 shadow-[0_2px_10px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)] ${pulse ? "border-red-500 shadow-[0_2px_10px_rgba(0,0,0,0.5),0_0_15px_rgba(220,38,38,0.2),inset_0_1px_0_rgba(255,255,255,0.04)]" : "border-red-600/50"}`}>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={seconds}
                    initial={{ scale: 1.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.7, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="text-lg sm:text-xl font-bold text-red-500 tabular-nums block"
                  >
                    {pad(seconds)}
                  </motion.span>
                </AnimatePresence>
              </div>
              <span className="text-[8px] sm:text-[9px] text-gray-500 mt-0.5 uppercase tracking-wider">seg</span>
            </div>
          </div>

          {/* Spots left */}
          <div className="flex items-center gap-1.5 bg-red-600/10 border border-red-600/30 rounded-full px-3 py-1 shadow-[0_2px_8px_rgba(220,38,38,0.1),inset_0_1px_0_rgba(255,255,255,0.04)]">
            <motion.div
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"
            />
            <span className="text-[10px] sm:text-sm text-white font-semibold">
              Apenas <span className="text-red-400 font-bold">{spotsLeft} vagas</span> restantes
            </span>
          </div>

          {/* CTA mini */}
          <Link to="/auth">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="bg-red-600 hover:bg-red-500 text-white text-[10px] sm:text-xs font-bold px-3 sm:px-4 py-1.5 rounded-full uppercase tracking-wider transition-all flex-shrink-0 shadow-[0_2px_10px_rgba(220,38,38,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] hover:shadow-[0_4px_20px_rgba(220,38,38,0.5)]"
            >
              Garantir Agora â†’
            </motion.div>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
