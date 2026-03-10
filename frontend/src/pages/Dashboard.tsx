import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, Image, RefreshCcw, Video, Activity, Clock3, Sparkles, Wand2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCurrentUserId } from '@/hooks/useCurrentUserId'
import { userService } from '@/services/user.service'
import type { DashboardActivityItem, DashboardStatsResponse } from '@/types/api.types'
import { hasActiveLicense } from '@/utils/session'

const emptyStats: DashboardStatsResponse = {
  identities: 0,
  imagesToday: 0,
  generatedImagesToday: 0,
  editedImagesToday: 0,
  faceSwapsToday: 0,
  videosToday: 0,
  recentActivity: [],
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStatsResponse>(emptyStats)
  const userId = useCurrentUserId()
  const licensed = hasActiveLicense()

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await userService.getDashboardStats(userId)
        setStats(response)
      } catch {
        setStats(emptyStats)
      }
    }

    loadStats()

    const interval = window.setInterval(loadStats, 15000)
    return () => window.clearInterval(interval)
  }, [userId])

  const activityIcon = (type: string) => {
    switch (type) {
      case 'identity':
        return <User className="w-4 h-4" />
      case 'image_edit':
        return <Wand2 className="w-4 h-4" />
      case 'image':
        return <Image className="w-4 h-4" />
      case 'video':
        return <Video className="w-4 h-4" />
      default:
        return <Sparkles className="w-4 h-4" />
    }
  }

  const activityLabel = (item: DashboardActivityItem) => {
    if (item.type === 'identity') return 'Nova identidade'
    if (item.type === 'image_edit') return 'Imagem editada'
    if (item.type === 'image') return 'Imagem gerada'
    return 'Atividade'
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Bem-vindo ao AREA 69</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Identidades</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.identities}</div>
            <p className="text-xs text-muted-foreground">LoRAs treinadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Imagens</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.imagesToday}</div>
            <p className="text-xs text-muted-foreground">Total de hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Geradas</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.generatedImagesToday}</div>
            <p className="text-xs text-muted-foreground">Geracao normal hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Editadas</CardTitle>
            <Wand2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.editedImagesToday}</div>
            <p className="text-xs text-muted-foreground">Edicoes de hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Face Swaps</CardTitle>
            <RefreshCcw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.faceSwapsToday}</div>
            <p className="text-xs text-muted-foreground">Realizados hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vídeos</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.videosToday}</div>
            <p className="text-xs text-muted-foreground">Gerados hoje</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/identity">
          <Button className="w-full h-20 text-lg" disabled={!licensed}>
            <User className="w-5 h-5 mr-2" />
            Criar Nova Identidade
          </Button>
        </Link>
        <Link to="/generate">
          <Button variant="outline" className="w-full h-20 text-lg" disabled={!licensed}>
            <Image className="w-5 h-5 mr-2" />
            Gerar Imagem
          </Button>
        </Link>
        <div>
          <Button variant="outline" className="w-full h-20 text-lg" disabled>
            <RefreshCcw className="w-5 h-5 mr-2" />
            Face Swap
          </Button>
        </div>
      </div>

      {!licensed && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-5 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-primary">Ative sua licenca para liberar as ferramentas</p>
              <p className="text-sm text-muted-foreground">Seu cadastro ja esta pronto. O proximo passo e ativar a chave na pagina de perfil.</p>
            </div>
            <Link to="/profile"><Button>Ativar licenca</Button></Link>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Atividade Recente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivity.map((item) => (
                <div key={item.id} className="flex items-center gap-4 rounded-xl border p-3">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} className="h-14 w-14 rounded-lg object-cover border" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {activityIcon(item.type)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{activityLabel(item)}</p>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        {item.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">{item.title}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
                    <Clock3 className="w-3.5 h-3.5" />
                    {item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Nenhuma atividade recente.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
