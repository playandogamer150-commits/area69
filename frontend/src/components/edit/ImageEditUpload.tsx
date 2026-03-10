import { useMemo, useRef } from 'react'
import { ImagePlus, Trash2, Upload } from 'lucide-react'

interface ImageEditUploadProps {
  files: Array<File | null>
  onFilesSelected: (files: Array<File | null>) => void
  maxFiles?: number
}

export function ImageEditUpload({ files, onFilesSelected, maxFiles = 6 }: ImageEditUploadProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

  const filledCount = useMemo(() => files.filter(Boolean).length, [files])

  const setFileAtIndex = (index: number, file: File | null) => {
    const nextFiles = [...files]
    nextFiles[index] = file
    onFilesSelected(nextFiles)
  }

  const addItem = () => {
    if (files.length >= maxFiles) return
    onFilesSelected([...files, null])
  }

  const removeItem = (index: number) => {
    const nextFiles = files.filter((_, currentIndex) => currentIndex !== index)
    onFilesSelected(nextFiles.length ? nextFiles : [null])
  }

  return (
    <div className="space-y-3">
      {files.map((file, index) => {
        const previewUrl = file ? URL.createObjectURL(file) : null

        return (
          <div key={index} className="rounded-xl border border-border bg-background/70 p-3 space-y-3">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => inputRefs.current[index]?.click()}
                className="flex-1 rounded-lg border border-dashed border-muted-foreground/30 p-4 text-left hover:border-primary/50 hover:bg-primary/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                    <Upload className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">
                      {file ? file.name : 'Arraste imagem ou clique para selecionar'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Hint: PNG/JPG/WEBP, ate 10MB
                    </div>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => removeItem(index)}
                className="flex h-10 w-10 items-center justify-center rounded-md border border-border hover:bg-destructive/10 hover:text-destructive transition-colors"
                aria-label={`Remover item ${index + 1}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <input
              ref={(element) => {
                inputRefs.current[index] = element
              }}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
              onChange={(event) => {
                const selectedFile = event.target.files?.[0] ?? null
                setFileAtIndex(index, selectedFile)
              }}
            />

            {previewUrl && (
              <img src={previewUrl} alt={file?.name || 'Preview'} className="w-32 h-32 object-cover rounded-lg border" />
            )}
          </div>
        )
      })}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{filledCount} de {maxFiles} imagens selecionadas</span>
        {files.length < maxFiles && (
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <ImagePlus className="w-4 h-4" />
            Add Item
          </button>
        )}
      </div>
    </div>
  )
}
