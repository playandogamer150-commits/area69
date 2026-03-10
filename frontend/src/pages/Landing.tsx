import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <img src="/area69-icon.png" alt="AREA 69" className="h-12 w-12 object-contain" />
            <img src="/area69-wordmark.png" alt="AREA 69" className="h-10 w-auto object-contain" />
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login"><Button variant="outline">Entrar</Button></Link>
            <Link to="/login?mode=register"><Button>Criar conta</Button></Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-20 space-y-20">
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
          <div className="space-y-6">
            <div className="inline-flex rounded-full border border-border bg-muted px-3 py-1 text-xs uppercase tracking-[0.22em] text-muted-foreground">
              AREA 69
            </div>
            <h1 className="text-5xl font-bold leading-tight">Venda acesso com chave de licenca e entregue uma plataforma pronta para criacao visual com IA.</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Cadastro, login, ativacao de licenca, geracao de imagem, edicao de imagem e painel do usuario em uma experiencia unica.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/login?mode=register"><Button size="lg">Comecar agora</Button></Link>
              <Link to="/login"><Button size="lg" variant="outline">Ja tenho conta</Button></Link>
            </div>
          </div>
          <div className="rounded-3xl border bg-[#090909] p-8 shadow-[0_20px_80px_rgba(255,32,32,0.12)]">
            <img src="/area69-icon.png" alt="AREA 69 logo" className="mx-auto h-72 w-72 object-contain" />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border p-6">
            <h2 className="text-xl font-semibold">Licenca por chave</h2>
            <p className="mt-2 text-sm text-muted-foreground">O cliente cria a conta, entra no perfil e ativa a chave comprada.</p>
          </div>
          <div className="rounded-2xl border p-6">
            <h2 className="text-xl font-semibold">Geracao com identidade</h2>
            <p className="mt-2 text-sm text-muted-foreground">Treino via Replicate com fine-tune e uso direto no painel.</p>
          </div>
          <div className="rounded-2xl border p-6">
            <h2 className="text-xl font-semibold">Edicao de imagem</h2>
            <p className="mt-2 text-sm text-muted-foreground">Fluxo real com WaveSpeed, historico, favoritos e galeria integrada.</p>
          </div>
        </section>
      </main>
    </div>
  )
}
