import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/useToast'
import { authService } from '@/services/auth.service'
import { getCurrentUser, updateCurrentUser, type SessionUser } from '@/utils/session'
import { getApiErrorMessage } from '@/utils/api-error'

export function Profile() {
  const { toast } = useToast()
  const [user, setUser] = useState<SessionUser | null>(getCurrentUser())
  const [name, setName] = useState(user?.name || '')
  const [licenseKey, setLicenseKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [activating, setActivating] = useState(false)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const current = await authService.getCurrentUser()
        setUser(current)
        setName(current.name || '')
      } catch {
        // ignore, interceptor handles invalid auth
      }
    }
    loadUser()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await authService.updateProfile(name)
      updateCurrentUser(updated)
      setUser(updated)
      toast({ title: 'Sucesso', description: 'Perfil atualizado!' })
    } catch (error) {
      toast({ title: 'Erro', description: getApiErrorMessage(error, 'Falha ao atualizar perfil'), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleActivate = async () => {
    if (!licenseKey.trim()) {
      toast({ title: 'Erro', description: 'Digite uma chave de licenca', variant: 'destructive' })
      return
    }
    setActivating(true)
    try {
      const response = await authService.activateLicense(licenseKey)
      setUser(response.user)
      setLicenseKey('')
      toast({ title: 'Licenca ativada', description: response.message })
    } catch (error) {
      toast({ title: 'Erro', description: getApiErrorMessage(error, 'Falha ao ativar licenca'), variant: 'destructive' })
    } finally {
      setActivating(false)
    }
  }

  return (
    <div className="p-8 max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">Perfil</h1>

      <Card>
        <CardHeader>
          <CardTitle>Conta</CardTitle>
          <CardDescription>Atualize seus dados de acesso</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ''} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar perfil'}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Licenca</CardTitle>
          <CardDescription>Ative a chave comprada para liberar a plataforma</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="rounded-xl border p-4">
              <div className="text-muted-foreground">Status</div>
              <div className="font-semibold capitalize">{user?.licenseStatus || 'inactive'}</div>
            </div>
            <div className="rounded-xl border p-4">
              <div className="text-muted-foreground">Plano</div>
              <div className="font-semibold">{user?.licensePlan || 'Nao ativado'}</div>
            </div>
            <div className="rounded-xl border p-4 md:col-span-2">
              <div className="text-muted-foreground">Chave atual</div>
              <div className="font-mono text-sm break-all">{user?.licenseKey || 'Nenhuma chave ativada'}</div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Chave de licenca</Label>
            <Input value={licenseKey} onChange={(e) => setLicenseKey(e.target.value.toUpperCase())} placeholder="AREA69-XXXXX-XXXXX-XXXXX-XXXXX" />
          </div>
          <Button onClick={handleActivate} disabled={activating}>{activating ? 'Ativando...' : 'Ativar licenca'}</Button>
        </CardContent>
      </Card>
    </div>
  )
}
