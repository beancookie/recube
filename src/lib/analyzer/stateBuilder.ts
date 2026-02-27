import { CubeState, FaceName, FaceImage } from '../../types/cube'
import { colorsToFaceState } from './colorExtractor'

// 将6个面的颜色构建为cubejs需要的格式
export function buildCubeState(faces: FaceImage[]): CubeState {
  const state: CubeState = {
    U: '',
    D: '',
    L: '',
    R: '',
    F: '',
    B: '',
  }

  for (const face of faces) {
    if (face.colors.length === 9) {
      state[face.name] = colorsToFaceState(face.colors)
    }
  }

  return state
}

// 验证魔方状态是否完整
export function isValidState(state: CubeState): boolean {
  const faces: FaceName[] = ['U', 'D', 'L', 'R', 'F', 'B']
  for (const face of faces) {
    if (!state[face] || state[face].length !== 9) {
      return false
    }
  }
  return true
}

// 标准化魔方状态（转换为大写）
export function normalizeState(state: CubeState): CubeState {
  return {
    U: state.U.toUpperCase(),
    D: state.D.toUpperCase(),
    L: state.L.toUpperCase(),
    R: state.R.toUpperCase(),
    F: state.F.toUpperCase(),
    B: state.B.toUpperCase(),
  }
}
