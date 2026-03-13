import { Link } from 'react-router-dom'
import { ArrowRight, Flame, Image as ImageIcon, Sparkles, Wand2, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

const benefits = [
  {
    icon: Sparkles,
    title: 'Crie sua propria modelo virtual',
    description: 'Defina identidade, visual e presenca sem depender de terceiros para construir sua operacao.',
  },
  {
    icon: ImageIcon,
    title: 'Gere imagens ultra-realistas',
    description: 'Prompts simples, visual premium e producao privada para escalar conteudo com velocidade.',
  },
  {
    icon: Wand2,
    title: 'Edite e refine cada detalhe',
    description: 'Ajuste poses, expressao e acabamento em um fluxo visual pensado para controle total.',
  },
  {
    icon: Flame,
    title: 'Transforme em operacao digital',
    description: 'Use sua estrutura para criar presenca, desejo e monetizacao com uma identidade propria.',
  },
]

const steps = [
  {
    number: '01',
    title: 'Crie sua conta',
    description: 'Entre na AREA 69 AI e acesse uma plataforma privada com visual premium e foco total em performance.',
  },
  {
    number: '02',
    title: 'Monte sua identidade',
    description: 'Organize estilo, referencias e a base da sua modelo para criar uma presenca visual exclusiva.',
  },
  {
    number: '03',
    title: 'Gere, refine e monetize',
    description: 'Produza imagens, controle o resultado e transforme isso em uma operacao digital mais forte.',
  },
]

export function Landing() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-black text-white">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-2xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <img src="/area69-wordmark.png" alt="AREA 69 AI" className="h-10 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-300 transition hover:text-white">
              Login
            </Link>
            <Link to="/login?mode=register">
              <Button className="rounded-xl px-5 shadow-[0_8px_30px_rgba(220,38,38,0.28)]">
                Criar Conta
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-20">
        <section className="relative overflow-hidden px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 via-black to-black" />
          <div className="absolute left-1/2 top-0 h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-red-600/10 blur-[160px]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_at_center,black_32%,transparent_72%)]" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-red-600/30 bg-red-950/30 px-4 py-2 text-xs uppercase tracking-[0.24em] text-red-100 shadow-[0_0_18px_rgba(220,38,38,0.14)]">
                <Zap className="h-4 w-4 text-red-500" />
                Plataforma privada de IA
              </div>

              <div className="space-y-5">
                <h1 className="max-w-4xl text-5xl font-bold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
                  Crie sua propria
                  <span className="mt-2 block text-primary drop-shadow-[0_0_30px_rgba(220,38,38,0.35)]">
                    modelo com IA
                  </span>
                </h1>
                <p className="max-w-2xl text-lg leading-relaxed text-gray-300 sm:text-xl">
                  Gere conteudo explicito ultra-realista, refine cada detalhe e transforme isso em uma operacao
                  digital premium com identidade propria.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link to="/login?mode=register">
                  <Button
                    size="lg"
                    className="h-auto rounded-2xl px-8 py-5 text-base font-semibold shadow-[0_10px_30px_rgba(220,38,38,0.35)]"
                  >
                    <Zap className="mr-2 h-5 w-5" />
                    Criar Minha Modelo
                  </Button>
                </Link>
                <Link to="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-auto rounded-2xl border-white/15 bg-white/[0.03] px-8 py-5 text-base text-white hover:bg-white/[0.06]"
                  >
                    Fazer Login
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 sm:flex sm:items-center sm:gap-8">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur-sm">
                  <div className="text-3xl font-bold">100%</div>
                  <div className="text-sm text-gray-400">Privado</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur-sm">
                  <div className="text-3xl font-bold">IA</div>
                  <div className="text-sm text-gray-400">Ultra-realista</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur-sm sm:min-w-[10rem]">
                  <div className="text-3xl font-bold text-primary">∞</div>
                  <div className="text-sm text-gray-400">Possibilidades</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 rounded-[2rem] bg-red-600/10 blur-3xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-red-600/25 shadow-[0_18px_60px_rgba(0,0,0,0.55),0_0_70px_rgba(220,38,38,0.16)]">
                <img
                  src="/landing-hero-banner.png"
                  alt="AREA 69 AI Hero"
                  className="hidden w-full object-cover lg:block"
                  onError={(e) => {
                    const target = e.currentTarget
                    target.style.display = 'none'
                    const sibling = target.nextElementSibling as HTMLElement | null
                    if (sibling) sibling.style.display = 'flex'
                  }}
                />
                <div className="hidden min-h-[30rem] flex-col justify-between bg-[radial-gradient(circle_at_top,rgba(220,38,38,0.32),transparent_42%),linear-gradient(135deg,#140000_0%,#050505_48%,#100000_100%)] p-8 lg:flex">
                  <div className="max-w-[18rem] rounded-2xl border border-white/10 bg-white/95 p-4 text-black shadow-2xl">
                    <div className="text-xs uppercase tracking-[0.2em] text-gray-500">Volume privado</div>
                    <div className="mt-2 text-3xl font-bold text-primary">R$ 12.332</div>
                    <div className="mt-1 text-xs text-gray-500">estrutura pronta para escalar</div>
                  </div>
                  <div className="space-y-5 rounded-[1.75rem] border border-white/10 bg-black/55 p-8 backdrop-blur-md">
                    <div className="inline-flex items-center gap-2 rounded-full bg-red-600/15 px-4 py-2 text-sm text-red-100">
                      <span className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_10px_rgba(220,38,38,0.7)]" />
                      Presenca, desejo e monetizacao
                    </div>
                    <div className="text-4xl font-bold leading-none text-white">
                      Sua operacao visual
                      <span className="mt-2 block text-primary">com identidade propria.</span>
                    </div>
                    <p className="max-w-md text-base text-gray-300">
                      Crie, refine e opere uma estrutura premium com visual marcante e controle total sobre o conteudo.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-neutral-950 to-black" />
          <div className="absolute left-1/4 top-1/2 h-[28rem] w-[28rem] -translate-y-1/2 rounded-full bg-red-600/[0.05] blur-[180px]" />
          <div className="relative mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Poder criativo.
                <span className="mt-2 block text-primary">Identidade propria.</span>
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-gray-400">
                Tudo o que voce precisa para criar, controlar e transformar conteudo visual em uma operacao premium.
              </p>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {benefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="group relative flex h-full flex-col rounded-[1.75rem] border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.45)] transition-all duration-300 hover:-translate-y-1 hover:border-red-600/30"
                >
                  <div className="mb-6 inline-flex self-start rounded-2xl border border-red-600/20 bg-red-600/10 p-3 shadow-[0_0_18px_rgba(220,38,38,0.08)]">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold">{benefit.title}</h3>
                  <p className="mt-4 flex-1 text-base leading-relaxed text-gray-400">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/[0.03] to-black/70 p-8 shadow-[0_12px_40px_rgba(0,0,0,0.45)] sm:p-10 lg:p-14">
            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs uppercase tracking-[0.24em] text-gray-300">
                  Como funciona
                </div>
                <h2 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
                  Entre cedo.
                  <span className="mt-2 block text-primary">Escalone com controle.</span>
                </h2>
                <p className="mt-5 max-w-xl text-lg leading-relaxed text-gray-400">
                  A AREA 69 AI foi desenhada para encurtar o caminho entre ideia, producao visual e operacao digital.
                </p>
              </div>

              <div className="space-y-6">
                {steps.map((step) => (
                  <div
                    key={step.number}
                    className="rounded-[1.5rem] border border-white/10 bg-black/45 p-6 shadow-[0_6px_24px_rgba(0,0,0,0.4)]"
                  >
                    <div className="text-sm font-semibold uppercase tracking-[0.28em] text-primary">{step.number}</div>
                    <h3 className="mt-3 text-2xl font-bold">{step.title}</h3>
                    <p className="mt-3 text-base leading-relaxed text-gray-400">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-24 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 rounded-[2rem] border border-red-600/20 bg-gradient-to-r from-red-950/35 via-black to-red-950/20 px-8 py-10 shadow-[0_18px_50px_rgba(220,38,38,0.12)] lg:flex-row">
            <div className="max-w-3xl">
              <div className="text-sm font-semibold uppercase tracking-[0.26em] text-primary">AREA 69 AI</div>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Crie a sua presenca visual e entre em operacao com mais poder.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-gray-300 sm:text-lg">
                Cadastro, ativacao por chave, geracao de imagem, edicao e painel do usuario em uma experiencia mais premium.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/login?mode=register">
                <Button size="lg" className="h-auto rounded-2xl px-8 py-5 text-base">
                  Criar Conta
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="h-auto rounded-2xl border-white/15 bg-white/[0.03] px-8 py-5 text-base text-white">
                  Entrar
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
