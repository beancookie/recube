// 魔方颜色类型
export type CubeColor = 'U' | 'D' | 'L' | 'R' | 'F' | 'B'

// 6个面的名称
export type FaceName = 'U' | 'D' | 'L' | 'R' | 'F' | 'B'

// 面颜色映射
export const FACE_COLORS: Record<FaceName, string> = {
  U: '#FFFFFF', // 白色 - 上
  D: '#FFFF00', // 黄色 - 下
  L: '#FF5900', // 橙色 - 左
  R: '#FF0000', // 红色 - 右
  F: '#009E60', // 绿色 - 前
  B: '#0045AD', // 蓝色 - 后
}

// 颜色名称映射
export const COLOR_NAMES: Record<string, FaceName> = {
  white: 'U',
  yellow: 'D',
  orange: 'L',
  red: 'R',
  green: 'F',
  blue: 'B',
}

// 面顺序: U, D, L, R, F, B
export interface CubeState {
  U: string // 9个字符，每3个一行
  D: string
  L: string
  R: string
  F: string
  B: string
}

// 上传的面图像
export interface FaceImage {
  name: FaceName
  imageData: string | null
  colors: string[] // 9个格子的颜色
}

// 还原步骤
export interface Move {
  name: string // 如 "R", "R'", "R2"
  index: number
}

// 播放状态
export interface PlaybackState {
  isPlaying: boolean
  currentStep: number
  totalSteps: number
  speed: number // 毫秒
}
