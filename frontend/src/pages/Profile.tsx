import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Check, CheckCircle, Copy, Key, Loader2, Mail, RefreshCw, Shield, User, Wallet } from 'lucide-react'

import type { PixCharge } from '@/types/api.types'
import { useToast } from '@/hooks/useToast'
import { authService } from '@/services/auth.service'
import { paymentsService } from '@/services/payments.service'
import { getApiErrorMessage } from '@/utils/api-error'
import { getCurrentUser, updateCurrentUser, type SessionUser } from '@/utils/session'

function isPixPending(charge: PixCharge | null) {
  return charge?.status === 'pending' || charge?.status === 'ativa'
}

function formatPixAmount(amountCents?: number) {
  if (!amountCents) return 'R$ 0,00'

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amountCents / 100)
}

function formatPixDate(value?: string | null) {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

export function Profile() {
  const { toast } = useToast()
  const [user, setUser] = useState<SessionUser | null>(getCurrentUser())
  const [name, setName] = useState(user?.name || '')
  const [licenseKey, setLicenseKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [activating, setActivating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [pixCharge, setPixCharge] = useState<PixCharge | null>(null)
  const [creatingPix, setCreatingPix] = useState(false)
  const [refreshingPix, setRefreshingPix] = useState(false)
  const [copiedPix, setCopiedPix] = useState(false)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const current = await authService.getCurrentUser()
        setUser(current)
        setName(current.name || '')
      } catch {
        // interceptor handles invalid auth
      }
    }

    void loadUser()
  }, [])

  useEffect(() => {
    if ((user?.licenseStatus || 'inactive') === 'active') {
      setPixCharge(null)
      return
    }

    let cancelled = false

    const loadLatestPixCharge = async () => {
      try {
        const charge = await paymentsService.getLatestPixCharge()
        if (cancelled) return

        setPixCharge(charge)

        if (charge?.status === 'paid' || charge?.status === 'concluida') {
          const current = await authService.getCurrentUser()
          if (cancelled) return

          updateCurrentUser(current)
          setUser(current)
        }
      } catch {
        if (!cancelled) {
          setPixCharge(null)
        }
      }
    }

    void loadLatestPixCharge()

    return () => {
      cancelled = true
    }
  }, [user?.licenseStatus])

  useEffect(() => {
    if (!isPixPending(pixCharge) || (user?.licenseStatus || 'inactive') === 'active') {
      return
    }

    const intervalId = window.setInterval(() => {
      void (async () => {
        try {
          const charge = await paymentsService.refreshPixChargeStatus()
          setPixCharge(charge)

          if (charge?.status === 'paid' || charge?.status === 'concluida') {
            const current = await authService.getCurrentUser()
            updateCurrentUser(current)
            setUser(current)
          }
        } catch {
          // Silent polling: user can still refresh manually.
        }
      })()
    }, 10000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [pixCharge, user?.licenseStatus])

  const handleSave = async () => {
    setSaving(true)
    setProfileSaved(false)

    try {
      const updated = await authService.updateProfile(name)
      updateCurrentUser(updated)
      setUser(updated)
      setProfileSaved(true)
      toast({ title: 'Sucesso', description: 'Perfil atualizado.' })
      window.setTimeout(() => setProfileSaved(false), 2500)
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
      const response = await authService.activateLicense(licenseKey.trim().toUpperCase())
      updateCurrentUser(response.user)
      setUser(response.user)
      setLicenseKey('')
      toast({ title: 'Licenca ativada', description: response.message })
    } catch (error) {
      toast({ title: 'Erro', description: getApiErrorMessage(error, 'Falha ao ativar licenca'), variant: 'destructive' })
    } finally {
      setActivating(false)
    }
  }

  const handleCreatePixCharge = async () => {
    setCreatingPix(true)

    try {
      const charge = await paymentsService.createPixCharge()
      setPixCharge(charge)
      toast({
        title: 'PIX gerado',
        description: 'Use o QR Code ou o codigo copia e cola para concluir o pagamento.',
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: getApiErrorMessage(error, 'Falha ao gerar cobranca PIX'),
        variant: 'destructive',
      })
    } finally {
      setCreatingPix(false)
    }
  }

  const handleRefreshPixStatus = async (silent = false) => {
    if (!silent) {
      setRefreshingPix(true)
    }

    try {
      const charge = await paymentsService.refreshPixChargeStatus()
      setPixCharge(charge)

      if (charge?.status === 'paid' || charge?.status === 'concluida') {
        const current = await authService.getCurrentUser()
        updateCurrentUser(current)
        setUser(current)
        toast({
          title: 'Pagamento confirmado',
          description: 'Sua licenca foi ativada automaticamente.',
        })
      } else if (!silent) {
        toast({
          title: 'Status atualizado',
          description: charge ? `Pagamento segue como ${charge.status}.` : 'Nenhuma cobranca PIX encontrada.',
        })
      }
    } catch (error) {
      if (!silent) {
        toast({
          title: 'Erro',
          description: getApiErrorMessage(error, 'Falha ao consultar pagamento PIX'),
          variant: 'destructive',
        })
      }
    } finally {
      if (!silent) {
        setRefreshingPix(false)
      }
    }
  }

  const handleCopyKey = async () => {
    if (!user?.licenseKey) return

    await navigator.clipboard.writeText(user.licenseKey)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyPixCode = async () => {
    if (!pixCharge?.pixCopyPaste) return

    await navigator.clipboard.writeText(pixCharge.pixCopyPaste)
    setCopiedPix(true)
    window.setTimeout(() => setCopiedPix(false), 2000)
  }

  return (
    <div className="mx-auto max-w-[800px] p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Perfil</h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-6 rounded-xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-5 shadow-[0_4px_25px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm sm:p-7"
      >
        <div className="mb-1 flex items-center gap-2.5">
          <User className="h-5 w-5 text-red-500" />
          <h2 className="text-lg font-bold text-white">Conta</h2>
        </div>
        <p className="mb-6 ml-[30px] text-xs text-gray-500">Atualize seus dados de acesso</p>

        <div className="mb-5">
          <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold tracking-wide text-white">
            <Mail className="h-3.5 w-3.5 text-gray-500" />
            Email
          </label>
          <input
            type="email"
            value={user?.email || ''}
            readOnly
            className="w-full cursor-not-allowed rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-gray-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),0_1px_0_rgba(255,255,255,0.02)]"
          />
        </div>

        <div className="mb-6">
          <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold tracking-wide text-white">
            <User className="h-3.5 w-3.5 text-gray-500" />
            Nome
          </label>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-all focus:border-red-600/40 focus:bg-white/[0.06] focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),0_0_20px_rgba(220,38,38,0.06)]"
          />
        </div>

        <motion.button
          type="button"
          onClick={handleSave}
          disabled={saving}
          whileHover={!saving ? { scale: 1.01, y: -1 } : {}}
          whileTap={!saving ? { scale: 0.98 } : {}}
          className={`flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold tracking-wide transition-all duration-300 ${
            profileSaved
              ? 'bg-emerald-600 text-white shadow-[0_4px_20px_rgba(16,185,129,0.35),inset_0_1px_0_rgba(255,255,255,0.1)]'
              : 'bg-red-600 text-white shadow-[0_4px_20px_rgba(220,38,38,0.35),0_0_60px_rgba(220,38,38,0.08),inset_0_1px_0_rgba(255,255,255,0.1)] hover:bg-red-700 hover:shadow-[0_6px_30px_rgba(220,38,38,0.45),inset_0_1px_0_rgba(255,255,255,0.15)]'
          }`}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : profileSaved ? (
            <>
              <CheckCircle className="h-4 w-4" />
              Salvo com sucesso
            </>
          ) : (
            'Salvar perfil'
          )}
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="rounded-xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-5 shadow-[0_4px_25px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm sm:p-7"
      >
        <div className="mb-1 flex items-center gap-2.5">
          <Shield className="h-5 w-5 text-red-500" />
          <h2 className="text-lg font-bold text-white">Licenca</h2>
        </div>
        <p className="mb-6 ml-[30px] text-xs text-gray-500">Compre por PIX ou ative uma chave manual para liberar a plataforma</p>

        <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]">
            <p className="mb-1 text-[11px] uppercase tracking-wider text-gray-500">Status</p>
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  user?.licenseStatus === 'active' ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]' : 'bg-gray-500'
                }`}
              />
              <span className="text-sm font-semibold capitalize text-white">{user?.licenseStatus || 'inactive'}</span>
            </div>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]">
            <p className="mb-1 text-[11px] uppercase tracking-wider text-gray-500">Plano</p>
            <span className="text-sm font-semibold text-white">{user?.licensePlan || 'Nao ativado'}</span>
          </div>
        </div>

        <div className="mb-6">
          <p className="mb-2 text-[11px] uppercase tracking-wider text-gray-500">Chave atual</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 overflow-x-auto rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 font-mono text-sm tracking-wider text-gray-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]">
              {user?.licenseKey || 'Nenhuma chave ativada'}
            </div>
            <button
              type="button"
              onClick={handleCopyKey}
              className="flex-shrink-0 rounded-xl border border-white/[0.08] bg-white/[0.04] p-3 text-gray-400 transition-all hover:bg-white/[0.07] hover:text-white"
              title="Copiar chave"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="mb-6 h-px bg-white/[0.06]" />

        {(user?.licenseStatus || 'inactive') !== 'active' && (
          <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold tracking-wide text-white">Comprar acesso via PIX</h3>
                </div>
                <p className="text-xs text-gray-400">
                  Gere a cobranca, pague no seu banco e a licenca sera ativada automaticamente.
                </p>
              </div>

              <motion.button
                type="button"
                onClick={handleCreatePixCharge}
                disabled={creatingPix}
                whileHover={!creatingPix ? { scale: 1.01, y: -1 } : {}}
                whileTap={!creatingPix ? { scale: 0.98 } : {}}
                className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold tracking-wide transition-all duration-300 ${
                  creatingPix
                    ? 'cursor-wait bg-emerald-500/20 text-emerald-100'
                    : 'bg-emerald-500 text-black shadow-[0_6px_24px_rgba(16,185,129,0.28)] hover:bg-emerald-400'
                }`}
              >
                {creatingPix ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gerando PIX...
                  </>
                ) : (
                  'Gerar cobranca PIX'
                )}
              </motion.button>
            </div>

            {pixCharge && (
              <div className="rounded-2xl border border-white/[0.06] bg-black/30 p-4">
                <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                    <p className="mb-1 text-[11px] uppercase tracking-wider text-gray-500">Valor</p>
                    <p className="text-sm font-semibold text-white">{formatPixAmount(pixCharge.amountCents)}</p>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                    <p className="mb-1 text-[11px] uppercase tracking-wider text-gray-500">Status PIX</p>
                    <p className="text-sm font-semibold capitalize text-white">{pixCharge.status}</p>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                    <p className="mb-1 text-[11px] uppercase tracking-wider text-gray-500">Expira em</p>
                    <p className="text-sm font-semibold text-white">{formatPixDate(pixCharge.expiresAt) || 'Nao informado'}</p>
                  </div>
                </div>

                {pixCharge.qrCodeImage && (
                  <div className="mb-4 overflow-hidden rounded-2xl border border-white/[0.06] bg-white p-4">
                    <img
                      src={pixCharge.qrCodeImage}
                      alt="QR Code PIX"
                      className="mx-auto h-auto max-h-72 w-full max-w-72 object-contain"
                    />
                  </div>
                )}

                <div className="mb-4">
                  <label className="mb-2 block text-[11px] uppercase tracking-wider text-gray-500">Codigo copia e cola</label>
                  <div className="flex flex-col gap-3 md:flex-row">
                    <textarea
                      value={pixCharge.pixCopyPaste || ''}
                      readOnly
                      rows={4}
                      className="min-h-[110px] flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-gray-200 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCopyPixCode}
                      disabled={!pixCharge.pixCopyPaste}
                      className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                        pixCharge.pixCopyPaste
                          ? 'border border-white/[0.08] bg-white/[0.05] text-white hover:bg-white/[0.08]'
                          : 'cursor-not-allowed border border-white/[0.04] bg-white/[0.03] text-gray-500'
                      }`}
                    >
                      {copiedPix ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                      {copiedPix ? 'Copiado' : 'Copiar PIX'}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <p className="text-xs text-gray-400">
                    {isPixPending(pixCharge)
                      ? 'Assim que o pagamento for confirmado, a licenca sera liberada automaticamente.'
                      : pixCharge.status === 'paid' || pixCharge.status === 'concluida'
                        ? 'Pagamento confirmado. Atualizando sua conta.'
                        : 'Se o pagamento ja foi feito, atualize o status manualmente.'}
                  </p>

                  <motion.button
                    type="button"
                    onClick={() => handleRefreshPixStatus(false)}
                    disabled={refreshingPix}
                    whileHover={!refreshingPix ? { scale: 1.01, y: -1 } : {}}
                    whileTap={!refreshingPix ? { scale: 0.98 } : {}}
                    className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                      refreshingPix
                        ? 'cursor-wait bg-white/[0.04] text-gray-400'
                        : 'bg-white/[0.06] text-white hover:bg-white/[0.1]'
                    }`}
                  >
                    {refreshingPix ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Atualizando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        Verificar pagamento
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold tracking-wide text-white">
            <Key className="h-3.5 w-3.5 text-gray-500" />
            Chave de licenca manual
          </label>
          <input
            type="text"
            value={licenseKey}
            onChange={(event) => setLicenseKey(event.target.value.toUpperCase())}
            placeholder="AREA69-XXXXX-XXXXX-XXXXX-XXXXX"
            className="mb-5 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 font-mono text-sm tracking-wider text-white placeholder:text-gray-600 outline-none transition-all focus:border-red-600/40 focus:bg-white/[0.06] focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),0_0_20px_rgba(220,38,38,0.06)]"
          />

          <motion.button
            type="button"
            onClick={handleActivate}
            disabled={!licenseKey.trim() || activating}
            whileHover={licenseKey.trim() && !activating ? { scale: 1.01, y: -1 } : {}}
            whileTap={licenseKey.trim() && !activating ? { scale: 0.98 } : {}}
            className={`flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold tracking-wide transition-all duration-300 ${
              licenseKey.trim() && !activating
                ? 'bg-red-600 text-white shadow-[0_4px_20px_rgba(220,38,38,0.35),0_0_60px_rgba(220,38,38,0.08),inset_0_1px_0_rgba(255,255,255,0.1)] hover:bg-red-700 hover:shadow-[0_6px_30px_rgba(220,38,38,0.45),inset_0_1px_0_rgba(255,255,255,0.15)]'
                : 'cursor-not-allowed bg-red-600/30 text-white/40 shadow-none'
            }`}
          >
            {activating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Ativando...
              </>
            ) : (
              'Ativar licenca'
            )}
          </motion.button>
        </div>
      </motion.div>

      <div className="h-8" />
    </div>
  )
}
