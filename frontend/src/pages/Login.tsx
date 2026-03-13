import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, Lock, Mail, User, Zap } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { authService } from '@/services/auth.service'
import { getApiErrorMessage } from '@/utils/api-error'

type AuthMode = 'login' | 'register'

export function Login() {
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const defaultMode = useMemo<AuthMode>(
    () => (new URLSearchParams(location.search).get('mode') === 'register' ? 'register' : 'login'),
    [location.search],
  )

  const [mode, setMode] = useState<AuthMode>(defaultMode)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setMode(defaultMode)
  }, [defaultMode])

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode)
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsLoading(true)
    try {
      await authService.login(email.trim().toLowerCase(), password)
      toast({ title: 'Sucesso', description: 'Login realizado com sucesso.' })
      navigate('/dashboard')
    } catch (error) {
      toast({ title: 'Erro', description: getApiErrorMessage(error, 'Falha ao fazer login'), variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault()
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
      toast({ title: 'Erro', description: 'As senhas não coincidem', variant: 'destructive' })
      return
    }

    setIsLoading(true)
    try {
      await authService.register(trimmedEmail, password, trimmedName)
      toast({ title: 'Conta criada', description: 'Conta criada com sucesso. Agora ative sua licença no perfil.' })
      navigate('/profile')
    } catch (error) {
      toast({ title: 'Erro', description: getApiErrorMessage(error, 'Falha ao criar conta'), variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-black text-white">
      <div className="absolute inset-0 bg-gradient-to-b from-red-950/15 via-black to-black" />
      <div className="absolute left-1/2 top-0 h-[56rem] w-[56rem] -translate-x-1/2 rounded-full bg-red-600/[0.07] blur-[180px]" />
      <div className="absolute bottom-0 right-1/4 h-[30rem] w-[30rem] rounded-full bg-red-800/[0.04] blur-[160px]" />
      <div className="absolute top-1/3 left-1/4 h-[25rem] w-[25rem] rounded-full bg-red-600/[0.03] blur-[140px]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />

      <nav className="relative z-20 border-b border-white/[0.06] bg-black/50 backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <img src="/area69-wordmark.png" alt="AREA 69 AI" className="h-8 w-auto object-contain sm:h-12" />
          </Link>
          <Link
            to="/"
            className="flex items-center gap-2 text-xs tracking-wide text-gray-400 transition hover:text-white sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </div>
      </nav>

      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-12 sm:px-6 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="relative overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-6 shadow-[0_8px_50px_rgba(0,0,0,0.7),0_0_80px_rgba(220,38,38,0.05),inset_0_1px_0_rgba(255,255,255,0.06)] sm:rounded-[2rem] sm:p-10">
            <div className="absolute left-1/2 top-0 h-[2px] w-[300px] -translate-x-1/2 bg-gradient-to-r from-transparent via-red-600/40 to-transparent" />
            <div className="absolute left-1/2 top-0 h-20 w-[200px] -translate-x-1/2 rounded-full bg-red-600/[0.06] blur-[40px]" />

            <div className="relative">
              <div className="mb-8 text-center">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className="mb-5 inline-flex"
                >
                  <img src="/area69-wordmark.png" alt="AREA 69" className="h-10 w-auto object-contain sm:h-12" />
                </motion.div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">AREA 69</h1>
                <p className="mt-1.5 text-sm tracking-[0.24em] text-gray-500">PRIVATE AI VISUAL STUDIO</p>
              </div>

              <div className="relative mb-8 flex rounded-xl border border-white/[0.06] bg-white/[0.04] p-1 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]">
                <motion.div
                  layout
                  className="absolute bottom-1 top-1 rounded-lg border border-white/[0.1] bg-gradient-to-b from-white/[0.1] to-white/[0.04] shadow-[0_2px_10px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.08)]"
                  style={{
                    width: 'calc(50% - 4px)',
                    left: mode === 'login' ? '4px' : 'calc(50% + 0px)',
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className={`relative z-10 flex-1 rounded-lg py-2.5 text-sm font-semibold tracking-wide transition ${
                    mode === 'login' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className={`relative z-10 flex-1 rounded-lg py-2.5 text-sm font-semibold tracking-wide transition ${
                    mode === 'register' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  Cadastrar
                </button>
              </div>

              <form onSubmit={mode === 'login' ? handleLogin : handleRegister}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={mode}
                    initial={{ opacity: 0, x: mode === 'login' ? -15 : 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: mode === 'login' ? 15 : -15 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-5"
                  >
                    {mode === 'register' && (
                      <div>
                        <label className="mb-2 block text-sm font-medium tracking-wide text-gray-300">Nome</label>
                        <div className="group relative">
                          <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 transition-colors group-focus-within:text-red-500" />
                          <input
                            type="text"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="Seu nome"
                            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-3 pl-10 pr-4 text-sm text-white placeholder:text-gray-600 outline-none transition-all duration-300 focus:border-red-600/40 focus:bg-white/[0.06] focus:shadow-[0_0_20px_rgba(220,38,38,0.08),inset_0_1px_0_rgba(255,255,255,0.04)]"
                            required
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="mb-2 block text-sm font-medium tracking-wide text-gray-300">Email</label>
                      <div className="group relative">
                        <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 transition-colors group-focus-within:text-red-500" />
                        <input
                          type="email"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          placeholder="seu@email.com"
                          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-3 pl-10 pr-4 text-sm text-white placeholder:text-gray-600 outline-none transition-all duration-300 focus:border-red-600/40 focus:bg-white/[0.06] focus:shadow-[0_0_20px_rgba(220,38,38,0.08),inset_0_1px_0_rgba(255,255,255,0.04)]"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium tracking-wide text-gray-300">Senha</label>
                      <div className="group relative">
                        <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 transition-colors group-focus-within:text-red-500" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          placeholder="••••••••"
                          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-3 pl-10 pr-12 text-sm text-white placeholder:text-gray-600 outline-none transition-all duration-300 focus:border-red-600/40 focus:bg-white/[0.06] focus:shadow-[0_0_20px_rgba(220,38,38,0.08),inset_0_1px_0_rgba(255,255,255,0.04)]"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((current) => !current)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-gray-300"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {mode === 'register' && (
                      <div>
                        <label className="mb-2 block text-sm font-medium tracking-wide text-gray-300">Confirmar senha</label>
                        <div className="group relative">
                          <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 transition-colors group-focus-within:text-red-500" />
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            placeholder="••••••••"
                            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-3 pl-10 pr-12 text-sm text-white placeholder:text-gray-600 outline-none transition-all duration-300 focus:border-red-600/40 focus:bg-white/[0.06] focus:shadow-[0_0_20px_rgba(220,38,38,0.08),inset_0_1px_0_rgba(255,255,255,0.04)]"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword((current) => !current)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-gray-300"
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {mode === 'login' && (
                      <div className="flex justify-end">
                        <button type="button" className="text-xs tracking-wide text-gray-500 transition hover:text-red-400">
                          Esqueceu a senha?
                        </button>
                      </div>
                    )}

                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      whileHover={{ scale: isLoading ? 1 : 1.01 }}
                      whileTap={{ scale: isLoading ? 1 : 0.98 }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3.5 text-sm font-semibold tracking-wide text-white shadow-[0_4px_20px_rgba(220,38,38,0.4),0_0_60px_rgba(220,38,38,0.1),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all duration-300 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isLoading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white"
                        />
                      ) : mode === 'login' ? (
                        <>
                          <Zap className="h-4 w-4 drop-shadow-[0_0_4px_rgba(255,255,255,0.5)]" />
                          Entrar
                        </>
                      ) : (
                        'Criar conta'
                      )}
                    </motion.button>
                  </motion.div>
                </AnimatePresence>
              </form>

              <div className="relative mb-6 mt-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/[0.06]" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-transparent px-4 text-xs uppercase tracking-wider text-gray-600">ou continue com</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] py-3 transition-all duration-300 hover:border-white/15 hover:bg-white/[0.06]"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span className="text-xs font-medium text-gray-400">Google</span>
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] py-3 transition-all duration-300 hover:border-white/15 hover:bg-white/[0.06]"
                >
                  <svg className="h-4 w-4 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                  <span className="text-xs font-medium text-gray-400">Discord</span>
                </button>
              </div>

              <p className="mt-8 text-center text-xs leading-relaxed text-gray-600">
                Ao continuar, você concorda com nossos{' '}
                <Link to="/" className="underline underline-offset-2 transition-colors hover:text-red-400">
                  Termos de Uso
                </Link>{' '}
                e{' '}
                <Link to="/" className="underline underline-offset-2 transition-colors hover:text-red-400">
                  Política de Privacidade
                </Link>
                .
              </p>
            </div>
          </div>

          <div className="-z-10 absolute -bottom-4 left-[15%] right-[15%] h-16 rounded-full bg-red-600/[0.04] blur-2xl" />
        </motion.div>
      </div>

      <div className="relative z-10 border-t border-white/[0.04] px-4 py-4 text-center">
        <p className="text-xs text-gray-600">© 2026 AREA 69 AI. Todos os direitos reservados.</p>
      </div>
    </div>
  )
}
