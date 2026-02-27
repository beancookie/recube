import { useMemo } from 'react'
import * as THREE from 'three'
import { CubeState, FACE_COLORS, FaceName } from '../../types/cube'

interface RubiksCubeProps {
  cubeState: CubeState
}

// 获取小方块的位置
function getCubiePosition(x: number, y: number, z: number): [number, number, number] {
  return [x - 2, y - 2, z - 2]
}

// 获取小方块面的颜色
function getCubieFaceColor(
  x: number,
  y: number,
  z: number,
  face: 'right' | 'left' | 'top' | 'bottom' | 'front' | 'back',
  state: CubeState
): string | null {
  if (!state) return null

  const faceMap: Record<string, Record<string, FaceName>> = {
    right: { '3': 'R' },
    left: { '1': 'L' },
    top: { '3': 'U' },
    bottom: { '1': 'D' },
    front: { '3': 'F' },
    back: { '1': 'B' },
  }

  const faceObj = faceMap[face]
  let coord: number

  switch (face) {
    case 'right':
      coord = x
      break
    case 'left':
      coord = x
      break
    case 'top':
      coord = y
      break
    case 'bottom':
      coord = 4 - y
      break
    case 'front':
      coord = z
      break
    case 'back':
      coord = z
      break
    default:
      coord = 1
  }

  if (!faceObj[coord.toString()]) return null

  const faceName = faceObj[coord.toString()]
  let index: number

  switch (face) {
    case 'right':
      index = (3 - y) * 3 + (3 - z)
      break
    case 'left':
      index = (3 - y) * 3 + (z - 1)
      break
    case 'top':
      index = (3 - z) * 3 + (x - 1)
      break
    case 'bottom':
      index = (z - 1) * 3 + (x - 1)
      break
    case 'front':
      index = (3 - y) * 3 + (x - 1)
      break
    case 'back':
      index = (3 - y) * 3 + (3 - x)
      break
    default:
      index = 0
  }

  const colorChar = state[faceName]?.[index]
  return colorChar ? FACE_COLORS[colorChar as FaceName] : '#1a1a1a'
}

export function RubiksCube({ cubeState }: RubiksCubeProps) {
  // 创建26个小方块（不含中心）
  const cubies = useMemo(() => {
    const boxes: {
      position: [number, number, number]
      colors: string[]
      key: string
    }[] = []

    for (let x = 1; x <= 3; x++) {
      for (let y = 1; y <= 3; y++) {
        for (let z = 1; z <= 3; z++) {
          if (x === 2 && y === 2 && z === 2) continue

          const colors: string[] = [
            getCubieFaceColor(x, y, z, 'right', cubeState) || '#1a1a1a',
            getCubieFaceColor(x, y, z, 'left', cubeState) || '#1a1a1a',
            getCubieFaceColor(x, y, z, 'top', cubeState) || '#1a1a1a',
            getCubieFaceColor(x, y, z, 'bottom', cubeState) || '#1a1a1a',
            getCubieFaceColor(x, y, z, 'front', cubeState) || '#1a1a1a',
            getCubieFaceColor(x, y, z, 'back', cubeState) || '#1a1a1a',
          ]

          boxes.push({
            position: getCubiePosition(x, y, z),
            colors,
            key: `${x}-${y}-${z}`,
          })
        }
      }
    }

    return boxes
  }, [cubeState])

  return (
    <group>
      {cubies.map(cubie => (
        <Cubie key={cubie.key} position={cubie.position} colors={cubie.colors} />
      ))}
    </group>
  )
}

interface CubieProps {
  position: [number, number, number]
  colors: (string | null)[]
}

function Cubie({ position, colors }: CubieProps) {
  const geometry = useMemo(() => new THREE.BoxGeometry(0.95, 0.95, 0.95), [])

  const materials = useMemo(() => {
    return colors.map(color =>
      new THREE.MeshStandardMaterial({
        color: color || '#1a1a1a',
        roughness: 0.3,
        metalness: 0.1,
      })
    )
  }, [colors])

  return (
    <mesh position={position} geometry={geometry} material={materials} />
  )
}
