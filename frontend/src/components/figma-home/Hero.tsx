import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Shield, Zap, Users } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden" aria-label="Hero">
      {/* Background layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 via-zinc-950 to-zinc-950" aria-hidden="true" />
      
      {/* Noise texture for premium feel */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJiaWx1bmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iLjAzIi8+PC9zdmc+')] opacity-[0.02] pointer-events-none" aria-hidden="true" />
      
      {/* Radial gradient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[800px] bg-red-600/8 rounded-full blur-[150px] pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[200px] pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Left - Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-red-500/20 bg-red-500/10 backdrop-blur-sm mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
                <span className="text-sm text-red-100 font-medium">
                  Beta — vagas limitadas
                </span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.21, 0.47, 0.32, 0.98] }}
            >
              <span className="text-white">Crie imagens </span>
              <span className="bg-gradient-to-r from-red-400 via-red-500 to-pink-500 bg-clip-text text-transparent">
                ultra-realistas
              </span>
              <br />
              <span className="text-white">em segundos.</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              className="text-lg sm:text-xl text-zinc-400 max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
            >
              A única plataforma NSFW brasileira com IA de última geração.
              Sem censura. Sem complicação. Resultados que impressionam.
            </motion.p>

            {/* CTAs */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
            >
              <Link
                to="/auth"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-lg transition-all duration-200 hover:shadow-[0_0_40px_rgba(220,38,38,0.3)] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
              >
                <span>Começar grátis</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/auth"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-900/50 text-zinc-300 hover:text-white font-semibold text-lg transition-all duration-200 active:scale-[0.98]"
              >
                Ver exemplos
              </Link>
            </motion.div>

            {/* Social Proof */}
            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              {/* Users */}
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-zinc-950 bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-xs text-zinc-400"
                      aria-hidden="true"
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <span className="text-sm text-zinc-400">
                  <strong className="text-zinc-200">+2.500</strong> criadores ativos
                </span>
              </div>

              {/* Divider */}
              <div className="hidden sm:block w-px h-4 bg-zinc-800" />

              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex text-amber-400" aria-label="4.9 de 5 estrelas">
                  {'★'.repeat(5)}
                </div>
                <span className="text-sm text-zinc-400">
                  <strong className="text-zinc-200">4.9</strong> de 5.0
                </span>
              </div>

              {/* Divider */}
              <div className="hidden sm:block w-px h-4 bg-zinc-800" />

              {/* Trust */}
              <div className="flex items-center gap-2 text-zinc-500">
                <Shield className="w-4 h-4" />
                <span className="text-sm">SSL Seguro</span>
              </div>
            </motion.div>
          </div>

          {/* Right - Visual */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
          >
            {/* Main image */}
            <div className="relative rounded-2xl overflow-hidden border border-zinc-800 shadow-[0_25px_50px-12px_rgba(0,0,0,0.8)]">
              <img
                src="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_2zqAykxhZv8T7wdIyvYmthk1mqC%2Fhf_20260321_162540_987bb76a-5694-41d9-9023-8a14d57f50ec.jpeg&w=1280&q=85"
                alt="AREA 69 - Plataforma de criação de imagens com IA"
                className="w-full h-auto"
              />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Glow effect */}
            <div className="absolute -inset-4 bg-red-600/10 rounded-3xl blur-2xl -z-10" aria-hidden="true" />
            <div className="absolute -inset-8 bg-red-600/5 rounded-3xl blur-[60px] -z-20" aria-hidden="true" />

            {/* Floating badge */}
            <motion.div
              className="absolute -bottom-4 -right-4 sm:bottom-4 sm:right-4 bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-xl p-4 shadow-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-600/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Tempo real</div>
                  <div className="text-xs text-zinc-500">~10 segundos por imagem</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Features mini */}
        <motion.div
          className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
        >
          {[
            { icon: Sparkles, label: 'Ultra-realista', desc: 'Qualidade 4K' },
            { icon: Shield, label: '100% Privado', desc: 'Sem logs' },
            { icon: Zap, label: 'Super rápido', desc: '10s por imagem' },
            { icon: Users, label: '2.500+ usuários', desc: 'Comunidade ativa' },
          ].map((feature, i) => (
            <div
              key={i}
              className="group p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/30 hover:bg-zinc-900/50 hover:border-zinc-700 transition-all duration-200"
            >
              <feature.icon className="w-5 h-5 text-red-400 mb-2" />
              <div className="text-sm font-medium text-white">{feature.label}</div>
              <div className="text-xs text-zinc-500">{feature.desc}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}