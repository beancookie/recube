import { CubeState, Move } from '../../types/cube'

// cubejs的导入 - 使用动态导入
let Cube: any = null
let solverInitialized = false

async function getCube() {
  if (!Cube) {
    const cubejs = await import('cubejs')
    // cubejs 是 CommonJS 模块，在 ESM 环境下需要使用 .default
    Cube = cubejs.default || cubejs
  }
  return Cube
}

// 初始化求解器
async function initSolver() {
  if (!solverInitialized) {
    console.log('[Solver] Initializing cubejs solver...')
    const Cube = await getCube()
    Cube.initSolver()
    solverInitialized = true
    console.log('[Solver] Solver initialized successfully')
  }
}

// 解析求解结果
function parseSolution(solution: string): Move[] {
  if (!solution || solution === 'ERROR: NO SOLUTION FOUND') {
    console.log('[Solver] No solution found')
    return []
  }

  const moves = solution.trim().split(/\s+/)
  return moves.map((name, index) => ({ name, index }))
}

// 求解魔方
export async function solve(state: CubeState): Promise<Move[]> {
  try {
    console.log('[Solver] Starting solve...')
    console.log('[Solver] Input state:', JSON.stringify(state))

    const Cube = await getCube()
    console.log('[Solver] Cube module loaded')

    // 初始化求解器（首次调用）
    await initSolver()

    // cubejs需要特定的格式: UUUURRRRFFFFDDDDLLLLBBBB
    const facelets = state.U + state.R + state.F + state.D + state.L + state.B
    console.log('[Solver] Facelets string:', facelets)

    // 使用 fromString 创建 Cube 实例
    const cube = Cube.fromString(facelets)
    console.log('[Solver] Cube instance created')

    const solved = cube.isSolved()
    console.log('[Solver] Is solved:', solved)

    if (solved) {
      console.log('[Solver] Cube already solved, returning empty')
      return []
    }

    console.log('[Solver] Computing solution...')
    const solutionStr = cube.solve()
    console.log('[Solver] Raw solution:', solutionStr)

    const moves = parseSolution(solutionStr)
    console.log('[Solver] Parsed moves:', moves.length, moves)

    return moves
  } catch (error) {
    console.error('[Solver] Solve error:', error)
    return []
  }
}

// 验证状态是否已还原
export function isSolved(state: CubeState): boolean {
  for (const face of Object.values(state)) {
    const unique = new Set(face.split(''))
    if (unique.size !== 1) {
      return false
    }
  }
  return true
}

// 获取还原状态的默认状态
export function getSolvedState(): CubeState {
  return {
    U: 'UUUUUUUUU',
    D: 'DDDDDDDDD',
    L: 'LLLLLLLLL',
    R: 'RRRRRRRRR',
    F: 'FFFFFFFFF',
    B: 'BBBBBBBBB',
  }
}

// 从 facelets 字符串转换为 CubeState
function faceletsToState(facelets: string): CubeState {
  return {
    U: facelets.slice(0, 9),
    R: facelets.slice(9, 18),
    F: facelets.slice(18, 27),
    D: facelets.slice(27, 36),
    L: facelets.slice(36, 45),
    B: facelets.slice(45, 54),
  }
}

// 生成打乱状态
export async function generateScramble(moveCount: number): Promise<CubeState> {
  const Cube = await getCube()

  // 从还原状态开始
  const solved = Cube.fromString('UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB')

  // 简单的旋转序列
  const moves = ['U', 'D', 'L', 'R', 'F', 'B', "U'", "D'", "L'", "R'", "F'", "B'"]

  // 应用随机旋转
  const scramble: string[] = []
  for (let i = 0; i < moveCount; i++) {
    const move = moves[Math.floor(Math.random() * moves.length)]
    solved.move(move)
    scramble.push(move)
  }

  console.log('[Solver] Generated scramble:', scramble.join(' '))

  // 获取打乱后的 facelets
  const facelets = solved.asString()
  console.log('[Solver] Scrambled facelets:', facelets)

  return faceletsToState(facelets)
}

// 根据移动序列计算最终状态
export async function applyMoves(moves: Move[], startState: CubeState): Promise<CubeState> {
  const Cube = await getCube()

  // 从起始状态创建 Cube 实例
  const facelets = startState.U + startState.R + startState.F + startState.D + startState.L + startState.B
  const cube = Cube.fromString(facelets)

  // 应用每个移动
  for (const move of moves) {
    cube.move(move.name)
  }

  // 转换回 CubeState
  const resultFacelets = cube.asString()
  return faceletsToState(resultFacelets)
}
