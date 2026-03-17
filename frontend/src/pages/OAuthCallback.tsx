import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '@/services/auth.service'
import { useToast } from '@/hooks/useToast'

export function OAuthCallback() {
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    try {
      const payload = window.location.hash || window.location.search
      const response = authService.completeOAuthCallback(payload)
      const credits = response.user.trialEditCreditsRemaining || 0
      toast({
        title: 'Login realizado',
        description:
          credits > 0
            ? `Conta conectada com sucesso. Voce recebeu ${credits} edicoes gratis para testar a plataforma.`
            : 'Conta conectada com sucesso.',
      })
      navigate('/profile', { replace: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao concluir o login social'
      toast({ title: 'Erro', description: message, variant: 'destructive' })
      navigate('/login', { replace: true })
    }
  }, [navigate, toast])

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="w-full max-w-sm rounded-3xl border border-white/[0.08] bg-white/[0.03] p-8 text-center shadow-[0_8px_40px_rgba(0,0,0,0.55)]">
        <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-red-500" />
        <h1 className="text-lg font-semibold">Concluindo login social</h1>
        <p className="mt-2 text-sm text-gray-400">Aguarde enquanto validamos sua conta e liberamos a sessao.</p>
      </div>
    </div>
  )
}
