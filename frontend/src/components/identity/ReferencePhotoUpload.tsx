import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { X, Upload } from 'lucide-react'

interface ReferencePhotoUploadProps {
  onFilesSelected: (files: File[]) => void
  maxFiles?: number
  maxSize?: number
}

export function ReferencePhotoUpload({ 
  onFilesSelected, 
  maxFiles = 20, 
  maxSize = 10 * 1024 * 1024 
}: ReferencePhotoUploadProps) {
  const [previewUrls, setPreviewUrls] = useState<string[]>([])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length + previewUrls.length > maxFiles) {
      alert(`Máximo de ${maxFiles} fotos permitidas`)
      return
    }

    onFilesSelected(acceptedFiles)
    
    const newPreviews = acceptedFiles.map(file => URL.createObjectURL(file))
    setPreviewUrls(prev => [...prev, ...newPreviews])
  }, [maxFiles, onFilesSelected, previewUrls.length])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles,
    maxSize,
  })

  const removePreview = (index: number) => {
    URL.revokeObjectURL(previewUrls[index])
    setPreviewUrls(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'}`}
      >
        <input {...getInputProps()} />
        <div className="space-y-2">
          <Upload className="w-10 h-10 mx-auto text-muted-foreground" />
          <p className="text-lg font-medium">
            {isDragActive ? 'Solte as fotos aqui' : 'Arraste fotos ou clique para selecionar'}
          </p>
          <p className="text-sm text-muted-foreground">
            Mínimo 5, máximo {maxFiles} fotos. Tamanho máximo: {maxSize / 1024 / 1024}MB cada.
          </p>
          <p className="text-xs text-muted-foreground">
            Use fotos claras do rosto, diferentes ângulos, boa iluminação.
          </p>
        </div>
      </div>

      {previewUrls.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {previewUrls.map((url, index) => (
            <div key={index} className="relative group">
              <img src={url} alt={`Preview ${index}`} className="w-full h-24 object-cover rounded" />
              <button
                onClick={() => removePreview(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 
                  flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
