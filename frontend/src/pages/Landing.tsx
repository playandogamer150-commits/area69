import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flame,
  Lock,
  Sparkles,
  Wand2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const heroStats = [
  { value: '100%', label: 'Privado' },
  { value: 'IA', label: 'Ultra-realista' },
  { value: '∞', label: 'Possibilidades' },
  { value: '🔥', label: 'Crie Vazado de Famosos' },
]

const benefits = [
  {
    icon: Sparkles,
    title: 'Crie sua própria modelo virtual',
    description: 'Defina identidade, presença e características únicas para operar com imagem própria.',
  },
  {
    icon: Wand2,
    title: 'Gere imagens explícitas com facilidade',
    description: 'Prompts simples, visual premium e resultados ultra-realistas em escala.',
  },
  {
    icon: Flame,
    title: 'Controle visual total',
    description: 'Refine ângulo, pose, estilo e acabamento para elevar cada criação.',
  },
  {
    icon: Lock,
    title: 'Transforme isso em monetização',
    description: 'Use sua operação visual para criar presença, desejo e vantagem comercial.',
  },
]

const steps = [
  {
    step: '01',
    title: 'Crie sua conta',
    description: 'Entre na plataforma e acesse uma estrutura privada feita para operar com mais poder.',
  },
  {
    step: '02',
    title: 'Monte sua identidade',
    description: 'Crie sua modelo, defina estilo e prepare a presença visual que vai te representar.',
  },
  {
    step: '03',
    title: 'Gere, refine e monetize',
    description: 'Produza conteúdo, refine os resultados e transforme isso em uma operação escalável.',
  },
]

const socialProof = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=120&h=120&fit=crop',
]

const beforeAfterPairs = [
  {
    title: 'Modelo Editorial',
    before: 'https://i.imgur.com/g5L7yok.jpeg',
    after: 'https://i.imgur.com/5Ul0UCF.jpeg',
  },
  {
    title: 'Aesthetic Neon',
    before: 'https://i.imgur.com/ugyV1RE.jpeg',
    after: 'https://i.imgur.com/5WMNhci.jpeg',
  },
  {
    title: 'Cinematic Premium',
    before: 'https://i.imgur.com/vNhxkdw.jpeg',
    after: 'https://i.imgur.com/m1SfJJc.png',
  },
]

const angleShots = [
  {
    title: 'Front View',
    angle: '0°',
    image: 'https://i.imgur.com/PAOJdVl.jpeg',
  },
  {
    title: 'Side Angle',
    angle: '45°',
    image: 'https://i.imgur.com/jA3rpgk.jpeg',
  },
  {
    title: 'Dynamic Pose',
    angle: '90°',
    image: 'https://i.imgur.com/gS6dqLP.jpeg',
  },
]

const roadmap = [
  'LoRA Studio',
  'Vídeos',
  'Edição de Vídeo',
  'Afiliados',
  'Cursos',
  'Expansão do Ecossistema',
]

const faqs = [
  {
    question: 'Preciso saber usar IA?',
    answer:
      'Não. A plataforma foi pensada para deixar a criação visual mais direta, com prompts simples e interface guiada.',
  },
  {
    question: 'Posso criar minha própria modelo?',
    answer:
      'Sim. Você monta identidade, estilo e presença visual para operar com uma personagem exclusiva dentro da sua estratégia.',
  },
  {
    question: 'A plataforma é privada?',
    answer:
      'Sim. A proposta da AREA 69 AI é operar com mais controle, discrição e foco em uma experiência premium.',
  },
  {
    question: 'Como funciona o acesso?',
    answer:
      'Você cria a conta, entra na plataforma e ativa sua licença para liberar a operação completa.',
  },
  {
    question: 'Preciso ter experiência técnica?',
    answer:
      'Não. O foco é reduzir a fricção e deixar a criação, edição e gestão visual mais acessíveis desde o começo.',
  },
]

const scarcityDurationMs = 7 * 60 * 60 * 1000

function formatTime(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

function ScarcityTimer() {
  const storageKey = 'area69_timer_end_v2'
  const [timeLeft, setTimeLeft] = useState(scarcityDurationMs)

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey)
    const now = Date.now()
    let end = saved ? Number(saved) : now + scarcityDurationMs

    if (!saved || Number.isNaN(end) || end <= now) {
      end = now + scarcityDurationMs
      window.localStorage.setItem(storageKey, String(end))
    }

    const update = () => {
      const diff = end - Date.now()
      if (diff <= 0) {
        const nextEnd = Date.now() + scarcityDurationMs
        window.localStorage.setItem(storageKey, String(nextEnd))
        end = nextEnd
        setTimeLeft(scarcityDurationMs)
        return
      }
      setTimeLeft(diff)
    }

    update()
    const interval = window.setInterval(update, 1000)
    return () => window.clearInterval(interval)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-[28px] border border-red-500/25 bg-black/55 p-5 shadow-[0_20px_50px_rgba(220,38,38,0.14)] backdrop-blur-xl"
    >
      <div className="flex items-center gap-3 text-sm font-medium text-red-200">
        <Clock3 className="h-4 w-4 text-primary" />
        Oferta rotativa liberada por tempo limitado
      </div>
      <div className="mt-3 text-3xl font-bold tracking-[0.18em] text-white">{formatTime(timeLeft)}</div>
      <div className="mt-2 text-sm text-zinc-400">247 pessoas monitorando essa janela agora.</div>
      <Link to="/login?mode=register" className="mt-4 inline-flex">
        <Button className="rounded-2xl px-6 shadow-[0_12px_30px_rgba(220,38,38,0.35)]">
          Garantir Agora
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>
    </motion.div>
  )
}

function BeforeAfterCard({
  title,
  before,
  after,
}: {
  title: string
  before: string
  after: string
}) {
  const [position, setPosition] = useState(50)

  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-red-200">
          Antes / Depois
        </span>
      </div>
      <div className="relative aspect-[4/5] overflow-hidden rounded-[22px] border border-white/10">
        <img src={before} alt={`${title} antes`} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
          <img src={after} alt={`${title} depois`} className="h-full w-full object-cover" />
        </div>
        <div className="pointer-events-none absolute inset-y-0" style={{ left: `calc(${position}% - 1px)` }}>
          <div className="h-full w-0.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.65)]" />
          <div className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/65 text-white backdrop-blur">
            <ArrowLeft className="h-4 w-4" />
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(event) => setPosition(Number(event.target.value))}
        className="mt-4 h-2 w-full cursor-pointer accent-red-500"
      />
    </div>
  )
}

export function Landing() {
  const [faqOpen, setFaqOpen] = useState<number | null>(0)
  const [angleIndex, setAngleIndex] = useState(0)
  const currentAngle = useMemo(() => angleShots[angleIndex], [angleIndex])

  return (
    <div className="min-h-screen overflow-x-hidden bg-black text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(220,38,38,0.18),transparent_34%),linear-gradient(180deg,#070707_0%,#080000_40%,#050505_100%)]" />
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:72px_72px] opacity-[0.06]" />

      <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-2xl">
        <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-3">
            <img src="/area69-logo.png" alt="AREA 69 AI" className="h-10 w-auto" />
            <span className="text-xl font-semibold tracking-wide">
              AREA <span className="text-primary">69</span> AI
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="px-4 py-2 text-sm font-medium text-zinc-200 transition hover:text-white">
              Login
            </Link>
            <Link to="/login?mode=register">
              <Button className="rounded-xl px-6 shadow-[0_10px_24px_rgba(220,38,38,0.35)]">Criar Conta</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main>
        <section className="px-6 pb-16 pt-10 lg:pb-24 lg:pt-14">
          <div className="mx-auto max-w-[1280px]">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/10 px-5 py-2 text-sm text-red-100 shadow-[0_0_24px_rgba(220,38,38,0.12)]">
              <Flame className="h-4 w-4 text-primary" />
              Somos a 1º Plataforma de NSFW de IA do Brasil
            </div>

            <div className="mt-8 grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr]">
              <div className="max-w-[760px]">
                <h1 className="text-5xl font-semibold leading-[0.95] tracking-tight text-white sm:text-6xl xl:text-[82px]">
                  Do café ao <span className="text-primary">décimo milésimo</span> sem foto de perfil.
                </h1>
                <p className="mt-8 max-w-[700px] text-xl leading-relaxed text-zinc-300">
                  Você não está criando uma modelo. Você está extraindo o poder de quem ninguém mais pode ter.
                </p>

                <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                  <Link to="/login?mode=register">
                    <Button className="h-auto rounded-2xl px-8 py-5 text-lg shadow-[0_18px_50px_rgba(220,38,38,0.35)]">
                      <Sparkles className="mr-2 h-5 w-5" />
                      Criar Minha Modelo
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button
                      variant="outline"
                      className="h-auto rounded-2xl border-white/15 bg-white/[0.03] px-8 py-5 text-lg text-white hover:bg-white/[0.06]"
                    >
                      Fazer Login
                    </Button>
                  </Link>
                </div>

                <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {heroStats.map((item, index) => (
                    <div
                      key={item.label}
                      className={`rounded-[22px] border border-white/10 bg-white/[0.03] px-5 py-4 shadow-[0_12px_30px_rgba(0,0,0,0.25)] ${
                        index === 3 ? 'xl:max-w-[170px]' : ''
                      }`}
                    >
                      <div className={`text-4xl font-bold ${item.value === '∞' ? 'text-primary' : 'text-white'}`}>
                        {item.value}
                      </div>
                      <div className="mt-1 text-sm leading-snug text-zinc-400">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="overflow-hidden rounded-[30px] border border-red-500/20 shadow-[0_25px_70px_rgba(220,38,38,0.18)]">
                  <img
                    src="https://i.imgur.com/GEeWVvp.jpeg"
                    alt="Banner premium AREA 69 AI"
                    className="h-full w-full object-cover"
                  />
                </div>
                <ScarcityTimer />
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-red-500/25 bg-gradient-to-r from-red-600 via-red-500 to-red-700">
          <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-4 px-6 py-5 text-center text-white md:flex-row md:text-left">
            <div className="text-base font-medium">
              Brilhem os fracos — mas quem se dignifica a clicar <span className="underline">AQUI</span> amarra a própria fortuna.
            </div>
            <Link to="/login?mode=register">
              <Button
                variant="outline"
                className="rounded-full border-white/35 bg-white/10 px-6 text-white hover:bg-white/15"
              >
                Garantir minha vaga
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto max-w-[1280px]">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                Poder criativo.
                <span className="block text-primary">Identidade própria.</span>
              </h2>
              <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-zinc-400">
                Tudo o que você precisa para criar, controlar e monetizar conteúdo premium.
              </p>
            </div>

            <div className="mt-14 grid gap-6 xl:grid-cols-4">
              {benefits.map((benefit) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45 }}
                  className="rounded-[28px] border border-white/10 bg-white/[0.02] p-8 shadow-[0_18px_40px_rgba(0,0,0,0.25)]"
                >
                  <div className="mb-6 inline-flex rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-primary">
                    <benefit.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-3xl font-semibold leading-tight text-white">{benefit.title}</h3>
                  <p className="mt-5 text-lg leading-relaxed text-zinc-400">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto grid max-w-[1280px] gap-10 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm uppercase tracking-[0.24em] text-zinc-300">
                Como funciona
              </div>
              <h2 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Três passos para sair do zero.
                <span className="block text-primary">Um caminho sem volta.</span>
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-zinc-400">
                Entre, monte sua identidade e coloque uma operação visual inteira para rodar com mais controle.
              </p>

              <div className="mt-8 flex items-center gap-4">
                <div className="flex -space-x-4">
                  {socialProof.map((avatar) => (
                    <img
                      key={avatar}
                      src={avatar}
                      alt="Social proof"
                      className="h-12 w-12 rounded-full border-2 border-black object-cover"
                    />
                  ))}
                </div>
                <div className="text-sm text-zinc-400">Criadores já explorando o poder da AREA 69 AI</div>
              </div>
            </div>

            <div className="space-y-5">
              {steps.map((item) => (
                <div
                  key={item.step}
                  className="rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.02] p-7 shadow-[0_18px_36px_rgba(0,0,0,0.28)]"
                >
                  <div className="text-sm font-semibold uppercase tracking-[0.26em] text-primary">{item.step}</div>
                  <h3 className="mt-4 text-2xl font-semibold text-white">{item.title}</h3>
                  <p className="mt-3 text-lg leading-relaxed text-zinc-400">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto max-w-[1280px]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-100">
                  Produto real
                </div>
                <h2 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  Software premium.
                  <span className="block text-primary">Experiência real.</span>
                </h2>
              </div>
              <p className="max-w-2xl text-lg leading-relaxed text-zinc-400">
                Criação de identidade, geração de imagem, edição avançada e área do usuário em uma estrutura com cara de produto sério.
              </p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="flex min-h-[420px] items-center justify-center rounded-[32px] border border-white/10 bg-gradient-to-br from-white/[0.04] to-black/70 p-8 text-center shadow-[0_22px_60px_rgba(0,0,0,0.35)]">
                <div>
                  <div className="text-sm uppercase tracking-[0.3em] text-zinc-500">Preview</div>
                  <div className="mt-4 text-3xl font-semibold text-white">Screenshot da plataforma aqui</div>
                  <p className="mt-4 text-lg text-zinc-400">
                    Esse bloco fica pronto para receber prints reais do painel e reforçar prova visual na próxima passada.
                  </p>
                </div>
              </div>
              <div className="grid gap-5">
                {['Criação de Identidade', 'Geração de Imagem', 'Edição Avançada', 'Área do Usuário'].map((item) => (
                  <div
                    key={item}
                    className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_14px_30px_rgba(0,0,0,0.24)]"
                  >
                    <div className="text-xl font-semibold text-white">{item}</div>
                    <div className="mt-2 text-base leading-relaxed text-zinc-400">
                      Estrutura visual premium pensada para operação privada e experiência refinada.
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto max-w-[1280px]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm uppercase tracking-[0.24em] text-zinc-300">
                  Galeria
                </div>
                <h2 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  Transformação visual
                  <span className="block text-primary">antes e depois.</span>
                </h2>
              </div>
              <p className="max-w-2xl text-lg leading-relaxed text-zinc-400">
                Aqui entram exatamente os sliders comparativos que estavam faltando no primeiro passo.
              </p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {beforeAfterPairs.map((pair) => (
                <BeforeAfterCard key={pair.title} {...pair} />
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto max-w-[1280px]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-100">
                  Enquadramentos
                </div>
                <h2 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  Ângulos, presença
                  <span className="block text-primary">e variação visual.</span>
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full border-white/15 bg-white/[0.03] text-white"
                  onClick={() => setAngleIndex((current) => (current === 0 ? angleShots.length - 1 : current - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full border-white/15 bg-white/[0.03] text-white"
                  onClick={() => setAngleIndex((current) => (current === angleShots.length - 1 ? 0 : current + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-8 shadow-[0_20px_45px_rgba(0,0,0,0.3)]">
                <div className="text-sm uppercase tracking-[0.25em] text-zinc-500">Shot atual</div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentAngle.image}
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -18 }}
                    transition={{ duration: 0.35 }}
                  >
                    <div className="mt-5 text-3xl font-semibold text-white">{currentAngle.title}</div>
                    <div className="mt-2 text-lg text-primary">{currentAngle.angle}</div>
                    <p className="mt-5 text-lg leading-relaxed text-zinc-400">
                      Trabalhe variações de pose, leitura facial e presença visual sem depender de uma única composição.
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="grid gap-6 sm:grid-cols-3">
                {angleShots.map((shot, index) => (
                  <button
                    type="button"
                    key={shot.image}
                    onClick={() => setAngleIndex(index)}
                    className={`overflow-hidden rounded-[28px] border text-left transition ${
                      angleIndex === index
                        ? 'border-red-500/35 shadow-[0_20px_50px_rgba(220,38,38,0.18)]'
                        : 'border-white/10 shadow-[0_18px_40px_rgba(0,0,0,0.22)]'
                    }`}
                  >
                    <img src={shot.image} alt={shot.title} className="aspect-[4/5] w-full object-cover" />
                    <div className="bg-black/70 p-4">
                      <div className="text-base font-medium text-white">{shot.title}</div>
                      <div className="mt-1 text-sm text-zinc-400">{shot.angle}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto max-w-[1280px] rounded-[34px] border border-red-500/15 bg-gradient-to-br from-red-950/30 via-black to-black p-10 shadow-[0_20px_60px_rgba(220,38,38,0.12)]">
            <div className="max-w-4xl">
              <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm uppercase tracking-[0.24em] text-zinc-300">
                Transformação
              </div>
              <h2 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Não é apenas uma ferramenta.
                <span className="block text-primary">É uma nova forma de criar.</span>
              </h2>
              <p className="mt-6 max-w-3xl text-lg leading-relaxed text-zinc-400">
                Exclusividade, poder e oportunidade para construir uma operação visual com mais presença e mais vantagem.
              </p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {[
                ['Exclusividade', 'Crie com identidade própria e saia do lugar comum.'],
                ['Poder', 'Controle visual, narrativa e percepção em uma operação privada.'],
                ['Oportunidade', 'Entre cedo em uma estrutura pensada para escalar desejo e atenção.'],
              ].map(([title, description]) => (
                <div key={title} className="rounded-[26px] border border-white/10 bg-white/[0.03] p-7">
                  <div className="text-2xl font-semibold text-white">{title}</div>
                  <div className="mt-3 text-lg leading-relaxed text-zinc-400">{description}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto max-w-[1280px]">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                O futuro da <span className="text-primary">AREA 69</span>
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-zinc-400">
                Uma evolução contínua para transformar a plataforma em um ecossistema visual cada vez mais completo.
              </p>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {roadmap.map((item) => (
                <div key={item} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6 text-lg font-medium text-white">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto max-w-[980px]">
            <div className="text-center">
              <div className="inline-flex rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-100">
                FAQ
              </div>
              <h2 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Dúvidas frequentes
              </h2>
            </div>

            <div className="mt-10 space-y-4">
              {faqs.map((item, index) => {
                const isOpen = faqOpen === index
                return (
                  <div key={item.question} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
                    <button
                      type="button"
                      onClick={() => setFaqOpen(isOpen ? null : index)}
                      className="flex w-full items-center justify-between gap-4 text-left"
                    >
                      <span className="text-xl font-medium text-white">{item.question}</span>
                      <ChevronDown className={`h-5 w-5 text-zinc-400 transition ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen ? (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <p className="pt-4 text-lg leading-relaxed text-zinc-400">{item.answer}</p>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="px-6 pb-24 pt-10">
          <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-8 rounded-[34px] border border-red-500/20 bg-gradient-to-r from-red-950/35 via-black to-red-950/25 px-8 py-12 shadow-[0_24px_70px_rgba(220,38,38,0.14)] lg:flex-row">
            <div className="max-w-3xl">
              <div className="text-sm uppercase tracking-[0.26em] text-primary">CTA Final</div>
              <h2 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Entre cedo. Crie com identidade própria. Rode sua operação.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-zinc-300">
                AREA 69 AI entrega a estrutura para você sair da intenção e colocar uma operação visual premium para funcionar.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link to="/login?mode=register">
                <Button className="h-auto rounded-2xl px-8 py-5 text-lg shadow-[0_16px_40px_rgba(220,38,38,0.3)]">
                  Quero acessar
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  variant="outline"
                  className="h-auto rounded-2xl border-white/15 bg-white/[0.03] px-8 py-5 text-lg text-white hover:bg-white/[0.06]"
                >
                  Entrar na plataforma
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
