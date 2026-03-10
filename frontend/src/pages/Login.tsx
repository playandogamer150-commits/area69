import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await authService.login(email, password)
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
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3">
          <div className="flex justify-center pb-2">
            <img src="/area69-wordmark.png" alt="AREA 69" className="h-20 w-auto object-contain" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">AREA 69</CardTitle>
          <CardDescription className="text-center">Private AI Visual Studio</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={mode} onValueChange={(value) => setMode(value as 'login' | 'register')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="register">Cadastrar</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Entrando...' : 'Entrar'}</Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">Nome</Label>
                  <Input id="register-name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input id="register-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Senha</Label>
                  <Input id="register-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-confirm-password">Confirmar senha</Label>
                  <Input id="register-confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Criando...' : 'Criar conta'}</Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
