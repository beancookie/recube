import { useCubeStore } from '../stores/cubeStore'
import { CubeViewer } from '../components/cube/CubeViewer'
import { PlaybackControls } from '../components/cube/PlaybackControls'
import { FaceGridLarge } from '../components/upload/FaceGrid'

interface SolveProps {
  onBack: () => void
}

export function Solve({ onBack }: SolveProps) {
  const { cubeState, displayState, solution, solveError } = useCubeStore()

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 bg-white shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-gray-600 hover:text-gray-800"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回
        </button>
        <h1 className="text-lg font-semibold text-gray-800">还原步骤</h1>
        <div className="w-12" />
      </div>

      {/* 错误提示 */}
      {solveError && (
        <div className="mx-4 mt-2 bg-red-50 rounded-lg p-3">
          <p className="text-red-700 text-sm">{solveError}</p>
        </div>
      )}

      {/* 3D视图 */}
      <div className="flex-1 min-h-0">
        <CubeViewer cubeState={displayState} />
      </div>

      {/* 颜色预览 */}
      <div className="px-4 py-2 bg-white border-t">
        <div className="flex justify-center gap-4 overflow-x-auto py-2">
          <FaceGridLarge colors={displayState.U.split('')} label="上" />
          <FaceGridLarge colors={displayState.D.split('')} label="下" />
          <FaceGridLarge colors={displayState.F.split('')} label="前" />
          <FaceGridLarge colors={displayState.B.split('')} label="后" />
          <FaceGridLarge colors={displayState.L.split('')} label="左" />
          <FaceGridLarge colors={displayState.R.split('')} label="右" />
        </div>
      </div>

      {/* 播放控制 */}
      <div className="p-4 bg-white border-t">
        {solution.length > 0 ? (
          <PlaybackControls />
        ) : (
          <div className="text-center text-gray-500">
            无法计算还原步骤
          </div>
        )}
      </div>
    </div>
  )
}
