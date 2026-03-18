import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Link } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  ImageIcon,
  Loader2,
  Search,
  SlidersHorizontal,
  Star,
  StarOff,
  Trash2,
  X,
} from 'lucide-react'

import type { GalleryItem } from '@/types/api.types'
import { useToast } from '@/hooks/useToast'
import { galleryService } from '@/services/gallery.service'
import { getApiErrorMessage } from '@/utils/api-error'
import { inferLegacyGallerySourceType, loadImageEditHistory, saveImageEditHistory } from '@/utils/image-edit-history'

type FilterType = 'all' | 'favorites'

function sourceMeta(sourceType: GalleryItem['sourceType']) {
  if (sourceType === 'image_generation') {
    return {
      label: 'Geracao',
      badge: 'border-red-500/20 bg-red-500/10 text-red-200',
    }
  }

  if (sourceType === 'image_edit') {
    return {
      label: 'Edicao',
      badge: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
    }
  }

  return {
    label: 'Legacy',
    badge: 'border-white/[0.08] bg-white/[0.04] text-gray-300',
  }
}

export function Gallery() {
  const { toast } = useToast()
  const [items, setItems] = useState<GalleryItem[]>([])
  const [filter, setFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState('')
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const hydrateGallery = async () => {
      setIsLoading(true)

      try {
        const legacyItems = loadImageEditHistory()
        if (legacyItems.length > 0) {
          await Promise.all(
            legacyItems.map((item) =>
              galleryService.saveGalleryItem({
                clientId: item.clientId || item.id,
                sourceType: item.sourceType || inferLegacyGallerySourceType(item),
                imageUrl: item.imageUrl,
                prompt: item.prompt,
                size: item.size,
                favorite: item.favorite ?? false,
                createdAt: item.createdAt,
              }),
            ),
          )
          saveImageEditHistory([])
        }

        const galleryItems = await galleryService.getGalleryItems()
        if (!cancelled) {
          setItems(galleryItems)
        }
      } catch (error) {
        if (!cancelled) {
          toast({
            title: 'Erro',
            description: getApiErrorMessage(error, 'Falha ao carregar galeria'),
            variant: 'destructive',
          })
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void hydrateGallery()

    return () => {
      cancelled = true
    }
  }, [toast])

  const filtered = useMemo(
    () =>
      items.filter((item) => {
        if (filter === 'favorites' && !item.favorite) return false
        if (!search.trim()) return true
        const query = search.toLowerCase()
        return (
          item.prompt.toLowerCase().includes(query) ||
          new Date(item.createdAt).toLocaleString().toLowerCase().includes(query) ||
          sourceMeta(item.sourceType).label.toLowerCase().includes(query)
        )
      }),
    [filter, items, search],
  )

  const favoriteCount = items.filter((item) => item.favorite).length
  const generationCount = items.filter((item) => item.sourceType === 'image_generation').length
  const editCount = items.filter((item) => item.sourceType === 'image_edit').length

  const toggleFavorite = async (item: GalleryItem) => {
    try {
      const updated = await galleryService.updateFavorite(item.id, !item.favorite)
      setItems((current) =>
        current
          .map((entry) => (entry.id === updated.id ? updated : entry))
          .sort((a, b) => Number(Boolean(b.favorite)) - Number(Boolean(a.favorite)) || b.createdAt.localeCompare(a.createdAt)),
      )
      setLightboxItem((current) => (current?.id === updated.id ? updated : current))
    } catch (error) {
      toast({
        title: 'Erro',
        description: getApiErrorMessage(error, 'Falha ao atualizar favorito'),
        variant: 'destructive',
      })
    }
  }

  const removeItem = async (item: GalleryItem) => {
    try {
      await galleryService.deleteGalleryItem(item.id)
      setItems((current) => current.filter((entry) => entry.id !== item.id))
      if (lightboxItem?.id === item.id) {
        setLightboxItem(null)
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: getApiErrorMessage(error, 'Falha ao remover item da galeria'),
        variant: 'destructive',
      })
    }
  }

  const navigateLightbox = (direction: -1 | 1) => {
    if (!lightboxItem) return
    const currentIndex = filtered.findIndex((item) => item.id === lightboxItem.id)
    const nextIndex = currentIndex + direction
    if (nextIndex >= 0 && nextIndex < filtered.length) {
      setLightboxItem(filtered[nextIndex])
    }
  }

  const lightboxIndex = lightboxItem ? filtered.findIndex((item) => item.id === lightboxItem.id) : -1

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Galeria</h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05 }}
        className="mb-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.16),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] shadow-[0_18px_60px_rgba(0,0,0,0.42)]"
      >
        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1.15fr_0.95fr]">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-red-200">
                Biblioteca visual
              </span>
              <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-gray-400">
                Sincronizada por conta
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-[2rem]">
              Seus melhores resultados ficam centralizados aqui
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-300">
              Use a galeria como biblioteca viva do produto: revise geracoes, compare edicoes, favorite o que vale e baixe rapido o que precisa ir para fora.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/generate"
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_28px_rgba(220,38,38,0.28)] transition hover:-translate-y-0.5 hover:bg-red-700"
              >
                Gerar imagem
              </Link>
              <Link
                to="/edit-image"
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-3 text-sm font-semibold text-gray-100 transition hover:border-white/[0.14] hover:bg-white/[0.05]"
              >
                Editar imagem
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              { label: 'Total salvo', value: items.length, helper: 'Itens sincronizados na conta' },
              { label: 'Favoritas', value: favoriteCount, helper: 'Curadoria pronta para revisao' },
              { label: 'Geracao / Edicao', value: `${generationCount}/${editCount}`, helper: 'Origem dos resultados salvos' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/[0.08] bg-black/20 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-500">{item.label}</p>
                <p className="mt-2 text-2xl font-bold text-white">{item.value}</p>
                <p className="mt-2 text-sm leading-6 text-gray-300">{item.helper}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.08 }}
        className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por prompt, data ou origem..."
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-gray-600 outline-none transition-all focus:border-red-600/40 focus:bg-white/[0.06]"
          />
        </div>

        <div className="flex gap-2">
          {[
            { key: 'all', label: 'Todas', icon: SlidersHorizontal },
            { key: 'favorites', label: 'Favoritas', icon: Star },
          ].map((option) => (
            <button
              key={option.key}
              onClick={() => setFilter(option.key as FilterType)}
              className={`flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-semibold tracking-wide transition-all duration-200 ${
                filter === option.key
                  ? 'border-red-600 bg-red-600 text-white shadow-[0_2px_12px_rgba(220,38,38,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]'
                  : 'border-white/[0.08] bg-white/[0.04] text-gray-400 hover:bg-white/[0.07] hover:text-white'
              }`}
            >
              <option.icon className="h-3.5 w-3.5" />
              {option.label}
            </button>
          ))}
        </div>

        <span className="text-xs tracking-wide text-gray-500 sm:ml-auto">
          {filtered.length} imagem{filtered.length !== 1 ? 'ns' : ''}
        </span>
      </motion.div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <Loader2 className="h-8 w-8 animate-spin text-red-500" />
          <p className="text-sm text-gray-500">Sincronizando galeria...</p>
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center gap-4 py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03]">
            <ImageIcon className="h-7 w-7 text-gray-600" />
          </div>
          <p className="text-sm text-gray-400">{filter === 'favorites' ? 'Nenhuma imagem favorita.' : 'Sua galeria ainda esta vazia.'}</p>
          <p className="max-w-md text-center text-sm leading-6 text-gray-500">
            {filter === 'favorites'
              ? 'Favorite as imagens que representam melhor o produto e monte uma curadoria interna.'
              : 'Tudo que voce salvar em geracao ou edicao aparece aqui e sincroniza com a sua conta.'}
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Link
              to="/generate"
              className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(220,38,38,0.24)] transition hover:bg-red-700"
            >
              Gerar imagem
            </Link>
            <Link
              to="/edit-image"
              className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-gray-200 transition hover:border-white/[0.14] hover:bg-white/[0.05]"
            >
              Editar imagem
            </Link>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
        >
          <AnimatePresence>
            {filtered.map((item, index) => (
              <motion.div
                layout
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="group overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-white/[0.01] shadow-[0_4px_25px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.04)] transition-shadow duration-300 hover:shadow-[0_8px_40px_rgba(0,0,0,0.5),0_0_30px_rgba(220,38,38,0.04),inset_0_1px_0_rgba(255,255,255,0.06)]"
              >
                <div className="relative aspect-[3/4] cursor-pointer overflow-hidden" onClick={() => setLightboxItem(item)}>
                  <img src={item.imageUrl} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />

                  <div className="absolute left-3 top-3">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] backdrop-blur-sm ${sourceMeta(item.sourceType).badge}`}>
                      {sourceMeta(item.sourceType).label}
                    </span>
                  </div>

                  {item.favorite && (
                    <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border border-yellow-500/30 bg-black/50 backdrop-blur-sm">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    </div>
                  )}

                  <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/80 via-black/20 to-transparent pb-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="flex gap-2">
                      {[
                        { icon: Eye, label: 'Visualizar', onClick: () => setLightboxItem(item), danger: false },
                        {
                          icon: item.favorite ? StarOff : Star,
                          label: item.favorite ? 'Desfavoritar' : 'Favoritar',
                          onClick: () => void toggleFavorite(item),
                          danger: false,
                        },
                        { icon: Download, label: 'Baixar', onClick: () => window.open(item.imageUrl, '_blank', 'noopener,noreferrer'), danger: false },
                        { icon: Trash2, label: 'Remover', onClick: () => void removeItem(item), danger: true },
                      ].map((action) => (
                        <button
                          key={action.label}
                          onClick={(event) => {
                            event.stopPropagation()
                            action.onClick()
                          }}
                          title={action.label}
                          className={`flex h-10 w-10 items-center justify-center rounded-xl border backdrop-blur-md transition-all duration-200 ${
                            action.danger
                              ? 'border-red-500/40 bg-red-600/80 text-white shadow-[0_2px_12px_rgba(220,38,38,0.4)] hover:bg-red-600'
                              : 'border-white/[0.15] bg-white/10 text-white hover:bg-white/20'
                          }`}
                        >
                          <action.icon className="h-4 w-4" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <p className="text-[11px] tracking-wide text-red-400/80">{new Date(item.createdAt).toLocaleString()}</p>
                    <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-gray-400">
                      {item.size}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-xs leading-relaxed text-gray-400">{item.prompt}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <AnimatePresence>
        {lightboxItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-xl"
            onClick={() => setLightboxItem(null)}
          >
            <button
              onClick={() => setLightboxItem(null)}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.06] text-gray-400 transition-all hover:bg-white/[0.1] hover:text-white sm:right-6 sm:top-6"
            >
              <X className="h-5 w-5" />
            </button>

            {lightboxIndex > 0 && (
              <button
                onClick={(event) => {
                  event.stopPropagation()
                  navigateLightbox(-1)
                }}
                className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.06] text-gray-400 transition-all hover:bg-white/[0.1] hover:text-white sm:left-6"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}

            {lightboxIndex < filtered.length - 1 && (
              <button
                onClick={(event) => {
                  event.stopPropagation()
                  navigateLightbox(1)
                }}
                className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.06] text-gray-400 transition-all hover:bg-white/[0.1] hover:text-white sm:right-6"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}

            <motion.div
              key={lightboxItem.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              onClick={(event) => event.stopPropagation()}
              className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-neutral-950/95 shadow-[0_8px_60px_rgba(0,0,0,0.8)]"
            >
              <div className="relative min-h-0 flex-1 overflow-hidden bg-black">
                <img src={lightboxItem.imageUrl} alt="" className="max-h-[65vh] w-full object-contain" />
              </div>

              <div className="border-t border-white/[0.06] p-4 sm:p-5">
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <p className="text-[11px] tracking-wide text-red-400/80">{new Date(lightboxItem.createdAt).toLocaleString()}</p>
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${sourceMeta(lightboxItem.sourceType).badge}`}>
                        {sourceMeta(lightboxItem.sourceType).label}
                      </span>
                      <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-gray-400">
                        {lightboxItem.size}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-gray-400">{lightboxItem.prompt}</p>
                  </div>
                  <span className="flex-shrink-0 text-[10px] tracking-wider text-gray-600">
                    {lightboxIndex + 1}/{filtered.length}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => void toggleFavorite(lightboxItem)}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-semibold tracking-wide transition-all ${
                      lightboxItem.favorite
                        ? 'border-yellow-500/25 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20'
                        : 'border-white/[0.06] bg-white/[0.03] text-gray-500 hover:bg-white/[0.06] hover:text-gray-300'
                    }`}
                  >
                    <Star className={`h-3 w-3 ${lightboxItem.favorite ? 'fill-yellow-400' : ''}`} />
                    {lightboxItem.favorite ? 'Favoritada' : 'Favoritar'}
                  </button>
                  <button
                    onClick={() => window.open(lightboxItem.imageUrl, '_blank', 'noopener,noreferrer')}
                    className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[11px] font-semibold tracking-wide text-gray-500 transition-all hover:bg-white/[0.06] hover:text-gray-300"
                  >
                    <Download className="h-3 w-3" />
                    Baixar
                  </button>
                  <button
                    onClick={() => void removeItem(lightboxItem)}
                    className="ml-auto flex items-center gap-1.5 rounded-lg border border-red-600/15 bg-red-600/[0.06] px-3 py-2 text-[11px] font-semibold tracking-wide text-red-400/70 transition-all hover:bg-red-600/15 hover:text-red-400"
                  >
                    <Trash2 className="h-3 w-3" />
                    Remover
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
