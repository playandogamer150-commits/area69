import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/useToast'
import { authService } from '@/services/auth.service'
import { paymentsService } from '@/services/payments.service'
import { getCurrentUser, updateCurrentUser, type SessionUser } from '@/utils/session'
import type { PixCharge } from '@/types/api.types'

export function Profile() {
  const { toast } = useToast()
  const [user, setUser] = useState<SessionUser | null>(getCurrentUser())
  const [name, setName] = useState(user?.name || '')
  const [licenseKey, setLicenseKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [activating, setActivating] = useState(false)
  const [pixCharge, setPixCharge] = useState<PixCharge | null>(null)
  const [loadingPix, setLoadingPix] = useState(false)
  const [copyingPix, setCopyingPix] = useState(false)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const [current, charge] = await Promise.all([
          authService.getCurrentUser(),
          paymentsService.getLatestPixCharge(),
        ])
        setUser(current)
        setName(current.name || '')
        setPixCharge(charge)
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
    } catch (error: any) {
      toast({ title: 'Erro', description: error.response?.data?.detail || 'Falha ao atualizar perfil', variant: 'destructive' })
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
    } catch (error: any) {
      toast({ title: 'Erro', description: error.response?.data?.detail || 'Falha ao ativar licenca', variant: 'destructive' })
    } finally {
      setActivating(false)
    }
  }

  const handleCreatePix = async () => {
    setLoadingPix(true)
    try {
      const charge = await paymentsService.createPixCharge()
      setPixCharge(charge)
      toast({ title: 'PIX gerado', description: 'Use o codigo copia e cola para concluir o pagamento.' })
    } catch (error: any) {
      toast({ title: 'Erro', description: error.response?.data?.detail || 'Falha ao gerar cobranca Pix', variant: 'destructive' })
    } finally {
      setLoadingPix(false)
    }
  }

  const handleCopyPix = async () => {
    if (!pixCharge?.pixCopyPaste) return
    setCopyingPix(true)
    try {
      await navigator.clipboard.writeText(pixCharge.pixCopyPaste)
      toast({ title: 'PIX copiado', description: 'Codigo copia e cola enviado para a area de transferencia.' })
    } catch {
      toast({ title: 'Erro', description: 'Nao foi possivel copiar o codigo PIX', variant: 'destructive' })
    } finally {
      setCopyingPix(false)
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

      <Card>
        <CardHeader>
          <CardTitle>Pagamento automatico</CardTitle>
          <CardDescription>No inicio, deixei somente PIX via Efi Bank para simplificar a ativacao.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border p-4 space-y-2">
            <div className="text-sm text-muted-foreground">Metodo habilitado</div>
            <div className="font-semibold">PIX</div>
            <div className="text-sm text-muted-foreground">Valor padrao: {pixCharge ? `R$ ${(pixCharge.amountCents / 100).toFixed(2)}` : 'sera definido pelo backend'}</div>
          </div>
          <Button onClick={handleCreatePix} disabled={loadingPix}>{loadingPix ? 'Gerando PIX...' : 'Gerar cobranca PIX'}</Button>
          {pixCharge && (
            <div className="space-y-3 rounded-xl border p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Status</div>
                  <div className="font-semibold capitalize">{pixCharge.status}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">TXID</div>
                  <div className="font-mono break-all">{pixCharge.txid || 'Aguardando'}</div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Codigo PIX copia e cola</Label>
                <Input value={pixCharge.pixCopyPaste || ''} readOnly />
              </div>
              <Button variant="outline" onClick={handleCopyPix} disabled={copyingPix || !pixCharge.pixCopyPaste}>{copyingPix ? 'Copiando...' : 'Copiar codigo PIX'}</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
