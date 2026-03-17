export function getTrialBlockedMessage(reason?: string | null) {
  switch (reason) {
    case 'social_login_required':
      return 'O trial gratuito e liberado apenas para login com Google ou Discord.'
    case 'device_limit':
      return 'O trial gratuito ja foi usado neste dispositivo.'
    case 'ip_limit':
      return 'O limite de trials gratuitos desta rede ja foi atingido.'
    case 'missing_fingerprint':
      return 'Nao foi possivel validar este dispositivo para liberar o trial gratuito.'
    default:
      return 'O trial gratuito nao esta disponivel para esta conta.'
  }
}
