import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Star, Trash2, Download, Eye } from 'lucide-react'
import { ImageEditHistoryItem, loadImageEditHistory, saveImageEditHistory } from '@/utils/image-edit-history'

export function Gallery() {
  const [items, setItems] = useState<ImageEditHistoryItem[]>([])

  useEffect(() => {
    setItems(loadImageEditHistory())
  }, [])

  const removeItem = (id: string) => {
    const nextItems = items.filter((item) => item.id !== id)
    setItems(nextItems)
    saveImageEditHistory(nextItems)
  }

  const toggleFavorite = (id: string) => {
    const nextItems = items.map((item) => item.id === id ? { ...item, favorite: !item.favorite } : item)
    nextItems.sort((a, b) => Number(Boolean(b.favorite)) - Number(Boolean(a.favorite)) || b.createdAt.localeCompare(a.createdAt))
    setItems(nextItems)
    saveImageEditHistory(nextItems)
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Galeria</h1>
        <p className="text-muted-foreground">{items.length} itens</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((image) => (
          <Card key={image.id} className="overflow-hidden group">
            <div className="relative">
              <img 
                src={image.imageUrl} 
                alt={`Generated ${image.id}`} 
                className="w-full aspect-square object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button variant="secondary" size="icon" asChild>
                  <a href={image.imageUrl} target="_blank" rel="noreferrer">
                    <Eye className="w-4 h-4" />
                  </a>
                </Button>
                <Button variant={image.favorite ? 'default' : 'secondary'} size="icon" onClick={() => toggleFavorite(image.id)}>
                  <Star className={`w-4 h-4 ${image.favorite ? 'fill-current' : ''}`} />
                </Button>
                <Button variant="secondary" size="icon" asChild>
                  <a href={image.imageUrl} target="_blank" rel="noreferrer">
                    <Download className="w-4 h-4" />
                  </a>
                </Button>
                <Button variant="destructive" size="icon" onClick={() => removeItem(image.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              {image.favorite && (
                <div className="absolute top-2 left-2 rounded-full bg-black/70 p-1 text-yellow-300">
                  <Star className="w-4 h-4 fill-current" />
                </div>
              )}
            </div>
            <CardContent className="p-2">
              <p className="text-xs text-muted-foreground">{new Date(image.createdAt).toLocaleString()}</p>
              <p className="text-xs mt-1 line-clamp-2">{image.prompt}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {items.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Nenhuma edicao salva ainda. Gere imagens na aba `Editar Imagem` para preencher a galeria.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
