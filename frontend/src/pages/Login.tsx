import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, Lock, Mail, User, Zap } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { authService } from '@/services/auth.service'
import { getApiErrorMessage } from '@/utils/api-error'

export function Login() {
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const defaultMode = useMemo<'login' | 'register'>(
    () => (new URLSearchParams(location.search).get('mode') === 'register' ? 'register' : 'login'),
    [location.search],
  )

  const [mode, setMode] = useState<'login' | 'register'>(defaultMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setMode(defaultMode)
  }, [defaultMode])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await authService.login(email.trim().toLowerCase(), password)
      toast({ title: 'Sucesso', description: 'Login realizado com sucesso!' })
      navigate('/dashboard')
    } catch (error) {
      toast({ title: 'Erro', description: getApiErrorMessage(error, 'Falha ao fazer login'), variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    const trimmedEmail = email.trim().toLowerCase()

    if (!trimmedName) {
      toast({ title: 'Erro', description: 'Informe seu nome para criar a conta', variant: 'destructive' })
      return
    }
    if (password.length < 6) {
      toast({ title: 'Erro', description: 'A senha precisa ter pelo menos 6 caracteres', variant: 'destructive' })
      return
    }
    if (password !== confirmPassword) {
      toast({ title: 'Erro', description: 'As senhas nao coincidem', variant: 'destructive' })
      return
    }

    setIsLoading(true)
    try {
      await authService.register(trimmedEmail, password, trimmedName)
      toast({ title: 'Conta criada', description: 'Conta criada com sucesso. Agora ative sua licenca no perfil.' })
      navigate('/profile')
    } catch (error) {
      toast({ title: 'Erro', description: getApiErrorMessage(error, 'Falha ao criar conta'), variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-black text-white">
      <div className="absolute inset-0 bg-gradient-to-b from-red-950/15 via-black to-black" />
      <div className="absolute left-1/2 top-0 h-[56rem] w-[56rem] -translate-x-1/2 rounded-full bg-red-600/[0.08] blur-[180px]" />
      <div className="absolute bottom-0 right-1/4 h-[30rem] w-[30rem] rounded-full bg-red-900/[0.06] blur-[160px]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />

      <nav className="relative z-10 border-b border-white/10 bg-black/50 backdrop-blur-2xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <img src="/area69-wordmark.png" alt="AREA 69 AI" className="h-10 w-auto object-contain" />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm tracking-wide text-gray-400 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </div>
      </nav>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1fr_26rem] lg:gap-16">
          <div className="hidden space-y-8 lg:block">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-600/30 bg-red-950/30 px-4 py-2 text-xs uppercase tracking-[0.24em] text-red-100">
              <Zap className="h-4 w-4 text-primary" />
              Private AI Visual Studio
            </div>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-6xl font-bold leading-[0.95] tracking-tight">
                Entre na sua
                <span className="mt-2 block text-primary">operacao visual.</span>
              </h1>
              <p className="max-w-2xl text-xl leading-relaxed text-gray-300">
                Crie conta, ative sua chave e opere em uma plataforma privada com geracao e edicao de imagem em um fluxo premium.
              </p>
            </div>
            <div className="grid max-w-2xl gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="text-3xl font-bold">01</div>
                <p className="mt-2 text-sm text-gray-400">Crie sua conta e entre no painel.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="text-3xl font-bold">02</div>
                <p className="mt-2 text-sm text-gray-400">Ative sua licenca no perfil.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="text-3xl font-bold">03</div>
                <p className="mt-2 text-sm text-gray-400">Comece a criar sua operacao.</p>
              </div>
            </div>
          </div>

          <div className="w-full max-w-md justify-self-center lg:justify-self-end">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.7),0_0_80px_rgba(220,38,38,0.08)] sm:p-8">
              <div className="absolute left-1/2 top-0 h-24 w-56 -translate-x-1/2 rounded-full bg-red-600/[0.08] blur-[48px]" />
              <div className="relative">
                <div className="mb-8 text-center">
                  <img src="/area69-wordmark.png" alt="AREA 69" className="mx-auto h-12 w-auto object-contain" />
                  <h2 className="mt-6 text-3xl font-bold tracking-tight">AREA 69</h2>
                  <p className="mt-2 text-sm tracking-[0.24em] text-gray-500">PRIVATE AI VISUAL STUDIO</p>
                </div>

                <div className="relative mb-8 flex rounded-xl border border-white/10 bg-white/[0.04] p-1 shadow-[inset_0_2px_4px_rgba(0,0,0,0.35)]">
                  <div
                    className={`absolute bottom-1 top-1 rounded-lg border border-white/10 bg-white/[0.08] transition-all duration-300 ${
                      mode === 'login' ? 'left-1 w-[calc(50%-4px)]' : 'left-[calc(50%)] w-[calc(50%-4px)]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className={`relative z-10 flex-1 rounded-lg py-2.5 text-sm font-semibold tracking-wide transition ${
                      mode === 'login' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    Entrar
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className={`relative z-10 flex-1 rounded-lg py-2.5 text-sm font-semibold tracking-wide transition ${
                      mode === 'register' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    Cadastrar
                  </button>
                </div>

                {mode === 'login' ? (
                  <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                      <label className="mb-2 block text-sm font-medium tracking-wide text-gray-300">Email</label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="seu@email.com"
                          className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-4 text-sm text-white outline-none transition focus:border-red-600/40 focus:bg-white/[0.06]"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium tracking-wide text-gray-300">Senha</label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-12 text-sm text-white outline-none transition focus:border-red-600/40 focus:bg-white/[0.06]"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((current) => !current)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-gray-300"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold tracking-wide text-white shadow-[0_8px_24px_rgba(220,38,38,0.35)] transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <Zap className="h-4 w-4" />
                      {isLoading ? 'Entrando...' : 'Entrar'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-5">
                    <div>
                      <label className="mb-2 block text-sm font-medium tracking-wide text-gray-300">Nome</label>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                        <input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Seu nome"
                          className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-4 text-sm text-white outline-none transition focus:border-red-600/40 focus:bg-white/[0.06]"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium tracking-wide text-gray-300">Email</label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="seu@email.com"
                          className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-4 text-sm text-white outline-none transition focus:border-red-600/40 focus:bg-white/[0.06]"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium tracking-wide text-gray-300">Senha</label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-12 text-sm text-white outline-none transition focus:border-red-600/40 focus:bg-white/[0.06]"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((current) => !current)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-gray-300"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium tracking-wide text-gray-300">Confirmar senha</label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-12 text-sm text-white outline-none transition focus:border-red-600/40 focus:bg-white/[0.06]"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((current) => !current)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-gray-300"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold tracking-wide text-white shadow-[0_8px_24px_rgba(220,38,38,0.35)] transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isLoading ? 'Criando...' : 'Criar conta'}
                    </button>
                  </form>
                )}

                <p className="mt-8 text-center text-xs leading-relaxed text-gray-600">
                  Ao continuar, voce concorda com nossos Termos de Uso e Politica de Privacidade.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 border-t border-white/[0.04] px-4 py-4 text-center text-xs text-gray-600">
        © 2026 AREA 69 AI. Todos os direitos reservados.
      </div>
    </div>
  )
}
