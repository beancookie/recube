import { useCubeStore } from '../stores/cubeStore'
import { ImageUploader } from '../components/upload/ImageUploader'
import { ExampleSelector } from '../components/examples/ExampleSelector'
import { FaceName } from '../types/cube'
import { Example } from '../data/examples'

interface HomeProps {
  onStartSolve: () => void
}

export function Home({ onStartSolve }: HomeProps) {
  const { faces, setFaceImage, setFaceColors, isSolving, solveError, startSolve, loadExample } = useCubeStore()

  const handleStartSolve = async () => {
    await startSolve()
    const { solution } = useCubeStore.getState()

    // 检查是否已经解出或无解
    if (solution.length === 0) {
      // 保持当前状态，让用户看到错误信息
    } else {
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
            {/* 上传区域 */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {faces.map(face => (
                <ImageUploader
                  key={face.name}
                  faceName={face.name as FaceName}
                  imageData={face.imageData}
                  colors={face.colors}
                  onImageChange={(img) => setFaceImage(face.name as FaceName, img)}
                  onColorsChange={(colors) => setFaceColors(face.name as FaceName, colors)}
                />
              ))}
            </div>

            {/* 说明 */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-800 mb-2">拍照说明</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 请确保光线充足，照片清晰</li>
                <li>• 每个面拍摄一张完整照片</li>
                <li>• 建议将魔方放在纯色背景上拍摄</li>
                <li>• 照片会自动识别9个格子的颜色</li>
              </ul>
            </div>

            {/* 错误提示 */}
            {solveError && (
              <div className="bg-red-50 rounded-lg p-4 mb-4">
                <p className="text-red-700 text-sm">{solveError}</p>
              </div>
            )}

            {/* 开始按钮 */}
            <button
              onClick={handleStartSolve}
              disabled={!allUploaded || isSolving}
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {isSolving ? '求解中...' : '开始还原'}
            </button>
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
