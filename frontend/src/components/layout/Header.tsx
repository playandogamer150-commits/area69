import { Button } from '@/components/ui/button'
import { LogOut, User as UserIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { authService } from '@/services/auth.service'
import { getCurrentUser, hasActiveLicense } from '@/utils/session'

export function Header() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const licensed = hasActiveLicense()

  return (
    <header className="h-16 border-b bg-background px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <img
          src="/area69-icon.png"
          alt="AREA 69"
          className="h-10 w-10 object-contain"
        />
        <h2 className="text-lg font-semibold tracking-[0.18em]">AREA 69</h2>
      </div>
      <div className="flex items-center gap-4">
        <div className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.18em] border ${licensed ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground border-border'}`}>
          {licensed ? 'Licenca ativa' : 'Ative sua licenca'}
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>
          <UserIcon className="w-4 h-4 mr-2" />
          {user?.name || 'Perfil'}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => authService.logout()}>
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </div>
    </header>
  )
}
