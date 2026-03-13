import { motion } from "motion/react";
import { User, Image, Edit, LayoutDashboard } from "lucide-react";

const features = [
  {
    icon: User,
    title: "CriaÃ§Ã£o de Identidade",
    description: "Defina caracterÃ­sticas, estilo e personalidade da sua modelo virtual.",
  },
  {
    icon: Image,
    title: "GeraÃ§Ã£o de Imagem",
    description: "Prompts simples transformados em imagens ultra-realistas instantaneamente.",
  },
  {
    icon: Edit,
    title: "EdiÃ§Ã£o AvanÃ§ada",
    description: "Refine, ajuste e personalize cada detalhe das suas criaÃ§Ãµes.",
  },
  {
    icon: LayoutDashboard,
    title: "Ãrea do UsuÃ¡rio",
    description: "Gerencie tudo em um dashboard premium e intuitivo.",
  },
];

export function ProductDemo() {
  return (
    <section className="relative py-20 sm:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-red-950/10 to-black" />
      
      {/* Layered depth glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-red-600/10 rounded-full blur-[150px]" />
      <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-red-800/[0.05] rounded-full blur-[200px]" />

      <div className="relative z-10 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
            Software premium.<br />
            <span className="text-red-600 drop-shadow-[0_0_30px_rgba(220,38,38,0.3)]">ExperiÃªncia real.</span>
          </h2>
          <p className="text-base sm:text-xl text-gray-300 max-w-2xl mx-auto">
            Uma plataforma completa para criaÃ§Ã£o, ediÃ§Ã£o e gestÃ£o do seu conteÃºdo.
          </p>
        </motion.div>

        {/* Main product showcase */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-20"
          style={{ perspective: "1200px" }}
        >
          <div className="relative aspect-[4/3] sm:aspect-[16/9] max-w-5xl mx-auto rounded-2xl sm:rounded-3xl border border-white/10 bg-gradient-to-br from-neutral-900 via-black to-neutral-950 overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.7),0_0_80px_rgba(220,38,38,0.06),inset_0_1px_0_rgba(255,255,255,0.06)]">
            {/* Grid pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
            
            {/* Inner light reflection */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-transparent pointer-events-none" />
            
            {/* Center content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="inline-flex p-6 rounded-2xl bg-red-600/10 border border-red-600/20 backdrop-blur-sm mb-6 shadow-[0_4px_25px_rgba(220,38,38,0.15),inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <LayoutDashboard className="w-16 h-16 text-red-500 drop-shadow-[0_0_10px_rgba(220,38,38,0.4)]" />
                </div>
                <p className="text-gray-400 text-lg">Screenshot da plataforma aqui</p>
              </div>
            </div>

            {/* Decorative corners */}
            <div className="hidden sm:block absolute top-8 left-8 w-32 h-32 border-t-2 border-l-2 border-red-600/20 rounded-tl-2xl" />
            <div className="hidden sm:block absolute top-8 right-8 w-32 h-32 border-t-2 border-r-2 border-red-600/20 rounded-tr-2xl" />
            <div className="hidden sm:block absolute bottom-8 left-8 w-32 h-32 border-b-2 border-l-2 border-red-600/20 rounded-bl-2xl" />
            <div className="hidden sm:block absolute bottom-8 right-8 w-32 h-32 border-b-2 border-r-2 border-red-600/20 rounded-br-2xl" />
          </div>
          {/* Shadow reflection below */}
          <div className="absolute -bottom-6 left-[15%] right-[15%] h-12 bg-red-600/[0.06] rounded-full blur-2xl" />
        </motion.div>

        {/* Features grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group p-6 rounded-xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-black/60 backdrop-blur-sm transition-all duration-500 hover:border-red-600/25 hover:-translate-y-1 shadow-[0_4px_20px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)] hover:shadow-[0_8px_35px_rgba(0,0,0,0.6),0_0_40px_rgba(220,38,38,0.06),inset_0_1px_0_rgba(255,255,255,0.08)]"
            >
              <div className="mb-4 inline-flex p-2 rounded-lg bg-red-600/10 shadow-[0_2px_8px_rgba(220,38,38,0.1),inset_0_1px_0_rgba(255,255,255,0.05)] group-hover:shadow-[0_4px_15px_rgba(220,38,38,0.2)]  transition-shadow">
                <feature.icon className="w-5 h-5 text-red-500 drop-shadow-[0_0_4px_rgba(220,38,38,0.4)]" />
              </div>
              <h3 className="font-bold mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
