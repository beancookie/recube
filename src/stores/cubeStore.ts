import { create } from 'zustand'
import { CubeState, FaceImage, Move, PlaybackState, FaceName } from '../types/cube'
import { solve, getSolvedState, isSolved, generateScramble, applyMoves } from '../lib/cubejs/solver'
import { Example } from '../data/examples'

interface CubeStore {
  // 上传的图片
  faces: FaceImage[]
  setFaceImage: (name: FaceName, imageData: string | null) => void
  setFaceColors: (name: FaceName, colors: string[]) => void
  // 批量设置面（用于自动检测后）
  setFace: (name: FaceName, imageData: string | null, colors: string[]) => void

  // 求解结果
  cubeState: CubeState
  solution: Move[]
  isSolving: boolean
  solveError: string | null

  // 3D展示状态
  displayState: CubeState
  playback: PlaybackState

  // 动作
  startSolve: () => Promise<void>
  loadExample: (example: Example) => Promise<void>
  setPlaybackState: (state: Partial<PlaybackState>) => void
  nextStep: () => void
  prevStep: () => void
  resetPlayback: () => void
}

const initialPlayback: PlaybackState = {
  isPlaying: false,
  currentStep: 0,
  totalSteps: 0,
  speed: 500,
}

const initialFaces: FaceImage[] = [
  { name: 'U', imageData: null, colors: [] },
  { name: 'D', imageData: null, colors: [] },
  { name: 'L', imageData: null, colors: [] },
  { name: 'R', imageData: null, colors: [] },
  { name: 'F', imageData: null, colors: [] },
  { name: 'B', imageData: null, colors: [] },
]

export const useCubeStore = create<CubeStore>((set, get) => ({
  faces: initialFaces,
  cubeState: getSolvedState(),
  solution: [],
  isSolving: false,
  solveError: null,
  displayState: getSolvedState(),
  playback: initialPlayback,

  setFaceImage: (name, imageData) => {
    set(state => ({
      faces: state.faces.map(f =>
        f.name === name ? { ...f, imageData } : f
      ),
    }))
  },

  setFaceColors: (name, colors) => {
    set(state => ({
      faces: state.faces.map(f =>
        f.name === name ? { ...f, colors } : f
      ),
    }))
  },

  // 批量设置面（用于自动检测后）
  setFace: (name, imageData, colors) => {
    set(state => ({
      faces: state.faces.map(f =>
        f.name === name ? { ...f, imageData, colors } : f
      ),
    }))
  },

  startSolve: async () => {
    const { faces } = get()

    console.log('[Store] ========== 开始求解 ==========')
    console.log('[Store] 上传的面数据:')
    faces.forEach(f => {
      console.log(`[Store]   ${f.name}: ${f.colors.join('')} (${f.colors.length}个颜色)`)
    })

    // 检查所有面是否都已上传
    const allUploaded = faces.every(f => f.imageData !== null && f.colors.length === 9)
    if (!allUploaded) {
      console.log('[Store] 错误: 不是所有面都已上传')
      const missing = faces.filter(f => !f.imageData || f.colors.length !== 9).map(f => f.name)
      console.log('[Store] 缺失的面:', missing)
      const missingStr = missing.join(', ')
      set({ solveError: `请上传所有6个面的图片，缺失: ${missingStr}` })
      return
    }

    console.log('[Store] 所有面已上传，开始构建魔方状态...')
    set({ isSolving: true, solveError: null })

    try {
      const cubeState: CubeState = {
        U: faces.find(f => f.name === 'U')?.colors.join('') || '',
        D: faces.find(f => f.name === 'D')?.colors.join('') || '',
        L: faces.find(f => f.name === 'L')?.colors.join('') || '',
        R: faces.find(f => f.name === 'R')?.colors.join('') || '',
        F: faces.find(f => f.name === 'F')?.colors.join('') || '',
        B: faces.find(f => f.name === 'B')?.colors.join('') || '',
      }

      console.log('[Store] 魔方状态构建完成:')
      console.log(`[Store]   U: ${cubeState.U}`)
      console.log(`[Store]   D: ${cubeState.D}`)
      console.log(`[Store]   L: ${cubeState.L}`)
      console.log(`[Store]   R: ${cubeState.R}`)
      console.log(`[Store]   F: ${cubeState.F}`)
      console.log(`[Store]   B: ${cubeState.B}`)

      console.log('[Store] 调用求解器...')
      const solution = await solve(cubeState)
      console.log('[Store] 求解完成!')

      const solved = isSolved(cubeState)
      console.log(`[Store] 求解结果: ${solved ? '已还原' : `${solution.length}步`}`)

      if (solution.length > 0) {
        console.log('[Store] 求解步骤:', solution.map(m => m.name).join(' '))
      }

      set({
        cubeState,
        solution,
        isSolving: false,
        displayState: cubeState,
        playback: {
          ...initialPlayback,
          totalSteps: solution.length,
        },
        solveError: solved ? '魔方已经是还原状态' :
          solution.length === 0 ? '无法求解，请检查图片是否正确' : null,
      })
      console.log('[Store] ========== 求解结束 ==========')
    } catch (error) {
      console.error('[Store] 求解出错:', error)
      set({
        isSolving: false,
        solveError: error instanceof Error ? error.message : '求解失败',
      })
    }
  },

  loadExample: async (example: Example) => {
    set({ isSolving: true, solveError: null })

    try {
      // 动态生成有效的打乱状态
      const cubeState = await generateScramble(example.steps)
      console.log('[Store] Generated scramble for example:', example.id, cubeState)

      // 设置面的颜色（用于显示）
      const faces: FaceImage[] = [
        { name: 'U', imageData: null, colors: cubeState.U.split('') },
        { name: 'D', imageData: null, colors: cubeState.D.split('') },
        { name: 'L', imageData: null, colors: cubeState.L.split('') },
        { name: 'R', imageData: null, colors: cubeState.R.split('') },
        { name: 'F', imageData: null, colors: cubeState.F.split('') },
        { name: 'B', imageData: null, colors: cubeState.B.split('') },
      ]

      const solution = await solve(cubeState)
      const solved = isSolved(cubeState)

      set({
        faces,
        cubeState,
        solution,
        isSolving: false,
        displayState: cubeState,
        playback: {
          ...initialPlayback,
          totalSteps: solution.length,
        },
        solveError: solved ? '魔方已经是还原状态' :
          solution.length === 0 ? '无法求解此状态' : null,
      })
    } catch (error) {
      console.error('[Store] Load example error:', error)
      set({
        isSolving: false,
        solveError: error instanceof Error ? error.message : '加载示例失败',
      })
    }
  },

  setPlaybackState: (state) => {
    set(s => ({
      playback: { ...s.playback, ...state },
    }))
  },

  nextStep: async () => {
    const { solution, playback, cubeState } = get()
    if (playback.currentStep >= solution.length) return

    const nextIndex = playback.currentStep + 1
    // 获取前 nextIndex 个步骤的应用状态
    const nextState = await applyMoves(solution.slice(0, nextIndex), cubeState)

    set({
      playback: { ...playback, currentStep: nextIndex },
      displayState: nextState,
    })
  },

  prevStep: async () => {
    const { solution, playback, cubeState } = get()
    if (playback.currentStep <= 0) return

    const prevIndex = playback.currentStep - 1
    // 获取前 prevIndex 个步骤的应用状态（即回退到上一步）
    const prevState = await applyMoves(solution.slice(0, prevIndex), cubeState)

    set({
      playback: { ...playback, currentStep: prevIndex },
      displayState: prevState,
    })
  },

  resetPlayback: () => {
    set({ playback: initialPlayback })
  },
}))
