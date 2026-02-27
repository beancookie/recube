import { FaceName, FACE_COLORS } from '../../types/cube'

interface FaceGridProps {
  colors: string[]
  faceName: FaceName
}

export function FaceGrid({ colors }: FaceGridProps) {
  return (
    <div className="grid grid-cols-3 gap-1 w-20 h-20">
      {Array.from({ length: 9 }).map((_, i) => {
        const color = colors[i]
          ? FACE_COLORS[colors[i] as FaceName]
          : '#e5e7eb'
        return (
          <div
            key={i}
            className="w-full h-full rounded-sm"
            style={{ backgroundColor: color }}
          />
        )
      })}
    </div>
  )
}

interface FaceGridLargeProps {
  colors: string[]
  faceName?: FaceName
  label: string
}

export function FaceGridLarge({ colors, label }: FaceGridLargeProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="grid grid-cols-3 gap-1 w-24 h-24 bg-gray-200 p-1 rounded">
        {Array.from({ length: 9 }).map((_, i) => {
          const color = colors[i]
            ? FACE_COLORS[colors[i] as FaceName]
            : '#e5e7eb'
          return (
            <div
              key={i}
              className="w-full h-full rounded-sm"
              style={{ backgroundColor: color }}
            />
          )
        })}
      </div>
    </div>
  )
}
