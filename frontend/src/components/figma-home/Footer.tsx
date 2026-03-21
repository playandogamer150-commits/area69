import { Link } from 'react-router-dom'
import { Shield, Zap, Heart } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-zinc-800 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg border border-red-500/30 bg-red-500/10 flex items-center justify-center">
                <span className="text-red-400 font-bold text-lg">A</span>
              </div>
              <span className="font-bold text-white text-lg tracking-tight">AREA 69</span>
            </Link>
            <p className="text-sm text-zinc-500 max-w-sm mb-4">
              A primeira plataforma NSFW brasileira com IA de última geração.
              Crie imagens ultra-realistas em segundos.
            </p>
            <div className="flex items-center gap-4 text-xs text-zinc-600">
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                <span>Privacidade garantida</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                <span>Pagamento seguro</span>
              </div>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Produto</h3>
            <ul className="space-y-3">
              <li>
                <a href="#features" className="text-sm text-zinc-400 hover:text-white transition-colors">
                  Recursos
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-sm text-zinc-400 hover:text-white transition-colors">
                  Preços
                </a>
              </li>
              <li>
                <a href="#faq" className="text-sm text-zinc-400 hover:text-white transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-sm text-zinc-400 hover:text-white transition-colors">
                  Termos de uso
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-zinc-400 hover:text-white transition-colors">
                  Política de privacidade
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-zinc-400 hover:text-white transition-colors">
                  Política de conteúdo
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-600">
            © {currentYear} AREA 69. Todos os direitos reservados.
          </p>
          <p className="text-xs text-zinc-600 flex items-center gap-1">
            Feito com <Heart className="w-3 h-3 text-red-500" /> no Brasil
          </p>
        </div>
      </div>
    </footer>
  )
}