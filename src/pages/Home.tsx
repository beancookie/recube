import { useCubeStore } from '../stores/cubeStore'
import { BatchImageUploader } from '../components/upload/BatchImageUploader'
import { ExampleSelector } from '../components/examples/ExampleSelector'
import { Example } from '../data/examples'

interface HomeProps {
  onStartSolve: () => void
}

export function Home({ onStartSolve }: HomeProps) {
  const { isSolving, solveError, startSolve, loadExample, faces } = useCubeStore()

  const handleStartSolve = async () => {
    console.log('[Home] handleStartSolve 被调用')
    const { faces } = useCubeStore.getState()

    // 先打印当前 store 中的面数据
    console.log('[Home] Store 中的面数据:')
    faces.forEach(f => {
      console.log(`[Home]   ${f.name}: ${f.colors.join('')} (${f.colors.length}个颜色)`)
    })

    await startSolve()
    const { solution, solveError } = useCubeStore.getState()

    // 打印求解结果
    console.log(`[Home] 求解结果: ${solution.length} 步, 错误: ${solveError}`)

    // 检查是否已经解出或无解
    if (solution.length === 0) {
      console.log('[Home] 无解或已还原')
    } else {
      console.log('[Home] 跳转到求解页面')
      onStartSolve()
    }
  }

  const handleExampleSelect = async (example: Example) => {
    await loadExample(example)
    const { solution } = useCubeStore.getState()

    if (solution.length > 0) {
      onStartSolve()
    }
  }

  const allUploaded = faces.every(f => f.imageData !== null)

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* 标题 */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Recube</h1>
          <p className="text-gray-500 text-sm mt-1">上传魔方6个面的照片</p>
        </div>

        {/* 两栏布局 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 左侧：上传区域 */}
          <div>
            {/* 批量上传组件 */}
            <BatchImageUploader onConfirm={handleStartSolve} />

            {/* 说明 */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6 mt-4">
              <h3 className="font-medium text-blue-800 mb-2">拍照说明</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 请确保光线充足，照片清晰</li>
                <li>• 每个面拍摄一张完整照片</li>
                <li>• 建议将魔方放在纯色背景上拍摄</li>
                <li>• 照片会自动识别面对应关系和9个格子的颜色</li>
              </ul>
            </div>

            {/* 错误提示 */}
            {solveError && (
              <div className="bg-red-50 rounded-lg p-4 mb-4 border border-red-200">
                <p className="text-red-700 text-sm font-medium">{solveError}</p>
                <p className="text-red-500 text-xs mt-1">请检查控制台查看详细日志</p>
              </div>
            )}

            {/* 如果已经上传了图片，显示开始按钮 */}
            {allUploaded && !solveError && (
              <button
                onClick={handleStartSolve}
                disabled={isSolving}
                className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                {isSolving ? '求解中...' : '开始还原'}
              </button>
            )}
          </div>

          {/* 右侧：示例选择 */}
          <div>
            <ExampleSelector onSelect={handleExampleSelect} />
          </div>
        </div>
      </div>
    </div>
  )
}
