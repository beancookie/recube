import { useRef } from 'react'
import { FaceName } from '../../types/cube'
import { extractColorsFromImage } from '../../lib/analyzer/colorExtractor'

interface ImageUploaderProps {
  faceName: FaceName
  imageData: string | null
  colors: string[]
  onImageChange: (imageData: string | null) => void
  onColorsChange: (colors: string[]) => void
}

const FACE_LABELS: Record<FaceName, string> = {
  U: '上 (U)',
  D: '下 (D)',
  L: '左 (L)',
  R: '右 (R)',
  F: '前 (F)',
  B: '后 (B)',
}

export function ImageUploader({
  faceName,
  imageData,
  colors,
  onImageChange,
  onColorsChange,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      onImageChange(dataUrl)

      try {
        console.log('[ImageUploader] Extracting colors for face:', faceName)
        const extractedColors = await extractColorsFromImage(dataUrl)
        console.log('[ImageUploader] Extracted colors for', faceName, ':', extractedColors)
        onColorsChange(extractedColors)
      } catch (error) {
        console.error('[ImageUploader] Failed to extract colors:', error)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleRemove = () => {
    onImageChange(null)
    onColorsChange([])
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col items-center gap-2 p-3 bg-white rounded-lg shadow-sm">
      <span className="text-sm font-medium text-gray-700">
        {FACE_LABELS[faceName]}
      </span>

      <div
        onClick={handleClick}
        className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 flex items-center justify-center overflow-hidden transition-colors"
      >
        {imageData ? (
          <img
            src={imageData}
            alt={FACE_LABELS[faceName]}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-3xl text-gray-400">+</span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {imageData && (
        <button
          onClick={handleRemove}
          className="text-xs text-red-500 hover:text-red-700"
        >
          移除
        </button>
      )}

      {colors.length > 0 && (
        <div className="grid grid-cols-3 gap-0.5 w-16 h-16">
          {colors.map((color, i) => (
            <div
              key={i}
              className="w-full h-full rounded-sm"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
