import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload } from 'lucide-react'

interface TargetMediaUploadProps {
  type: 'image' | 'video'
  label: string
  onUrlChange: (url: string) => void
}

export function TargetMediaUpload({ type, label, onUrlChange }: TargetMediaUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setPreview(url)
      onUrlChange(url)
    }
  }, [onUrlChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: type === 'image' 
      ? { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }
      : { 'video/*': ['.mp4', '.webm', '.mov'] },
    maxFiles: 1,
  })

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="OuCole uma URL..."
          onChange={(e) => {
            onUrlChange(e.target.value)
            setPreview(e.target.value)
          }}
          className="flex-1"
        />
      </div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'}`}
      >
        <input {...getInputProps()} />
        <div className="space-y-2">
          <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {isDragActive ? 'Solte aqui' : `Arraste ${type} ou clique para selecionar`}
          </p>
        </div>
      </div>
      {preview && (
        <div className="mt-2">
          {type === 'image' ? (
            <img src={preview} alt="Preview" className="w-full h-40 object-cover rounded" />
          ) : (
            <video src={preview} className="w-full h-40 object-cover rounded" />
          )}
        </div>
      )}
    </div>
  )
}
