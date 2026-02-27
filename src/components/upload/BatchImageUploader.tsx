import { useState, useRef } from 'react'
import { useCubeStore } from '../../stores/cubeStore'
import { detectFace, FACE_LABELS } from '../../lib/analyzer/faceDetector'
import { extractColorsFromImage } from '../../lib/analyzer/colorExtractor'
import { FaceName } from '../../types/cube'

interface DetectedFace {
  id: number
  imageData: string
  detectedFace: FaceName | null
  confidence: number
  colors: string[]
  isProcessing: boolean
}

interface BatchImageUploaderProps {
  onConfirm: () => void
}

const FACE_NAMES: FaceName[] = ['U', 'D', 'L', 'R', 'F', 'B']

export function BatchImageUploader({ onConfirm }: BatchImageUploaderProps) {
  const { setFace } = useCubeStore()
  const [detectedFaces, setDetectedFaces] = useState<DetectedFace[]>([])
  const [isAllProcessed, setIsAllProcessed] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    console.log('[BatchUploader] ========== 开始处理图片 ==========')
    console.log(`[BatchUploader] 选择文件数量: ${files.length}`)

    // 清空之前的数据
    setDetectedFaces([])
    setIsAllProcessed(false)

    // 创建新的检测结果数组
    const newDetectedFaces: DetectedFace[] = []
    let processedCount = 0
    const totalFiles = files.length

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      console.log(`[BatchUploader] 处理文件 ${i + 1}/${files.length}: ${file.name}`)
      const reader = new FileReader()

      reader.onload = async () => {
        const dataUrl = reader.result as string
        console.log(`[BatchUploader] 图片加载完成, 开始检测...`)

        // 添加到检测列表（先不显示检测结果，等待处理完成）
        const tempId = newDetectedFaces.length
        newDetectedFaces.push({
          id: tempId,
          imageData: dataUrl,
          detectedFace: null,
          confidence: 0,
          colors: [],
          isProcessing: true,
        })

        // 更新UI显示处理中状态
        setDetectedFaces([...newDetectedFaces])

        try {
          // 检测面
          console.log(`[BatchUploader] 步骤1: 检测面 (图片${tempId})...`)
          const { face, confidence } = await detectFace(dataUrl)
          console.log(`[BatchUploader]   检测结果 (图片${tempId}): ${face}, 置信度: ${(confidence * 100).toFixed(1)}%`)

          // 提取颜色
          console.log(`[BatchUploader] 步骤2: 提取9个格子的颜色...`)
          const colors = await extractColorsFromImage(dataUrl)
          console.log(`[BatchUploader]   提取的颜色数量: ${colors.length}, 颜色: ${colors.join('')}`)

          if (colors.length !== 9) {
            console.warn(`[BatchUploader] 警告: 颜色数量不是9个!`)
          }

          // 更新检测结果
          newDetectedFaces[tempId] = {
            ...newDetectedFaces[tempId],
            detectedFace: face,
            confidence,
            colors,
            isProcessing: false,
          }

          setDetectedFaces([...newDetectedFaces])

          processedCount++
          console.log(`[BatchUploader] 已处理: ${processedCount}/${totalFiles}`)
          if (processedCount === totalFiles) {
            console.log('[BatchUploader] 所有图片处理完成! 设置 isAllProcessed = true')
            setIsAllProcessed(true)
          }
        } catch (error) {
          console.error('[BatchUploader] 处理图片出错:', error)
          newDetectedFaces[tempId] = {
            ...newDetectedFaces[tempId],
            isProcessing: false,
          }
          setDetectedFaces([...newDetectedFaces])

          processedCount++
          console.log(`[BatchUploader] 错误后已处理: ${processedCount}/${totalFiles}`)
          if (processedCount === totalFiles) {
            console.log('[BatchUploader] 错误后所有图片处理完成! 设置 isAllProcessed = true')
            setIsAllProcessed(true)
          }
        }
      }

      reader.readAsDataURL(file)
    }

    // 清空input以便可以再次选择相同文件
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const handleConfirm = () => {
    console.log('[BatchUploader] ========== 点击确认按钮 ==========')
    console.log(`[BatchUploader] 检测到的面数量: ${detectedFaces.length}`)

    // 统计检测到的面
    const faceStats: Record<string, { hasFace: boolean; colors: number }> = {}
    detectedFaces.forEach(face => {
      faceStats[face.id] = {
        hasFace: !!face.detectedFace,
        colors: face.colors.length
      }
      console.log(`[BatchUploader] 图片${face.id}: 检测为${face.detectedFace}, 颜色数量=${face.colors.length}, 颜色=${face.colors.join('')}`)
    })

    // 先清空所有面（避免重复设置导致覆盖）
    const allFaces: FaceName[] = ['U', 'D', 'L', 'R', 'F', 'B']
    allFaces.forEach(f => {
      setFace(f, null, [])
    })

    // 统计当前已分配的面
    const assignedFaces: string[] = []

    // 将检测到的面设置到store中（按顺序检测结果设置）
    let setCount = 0
    detectedFaces.forEach(face => {
      if (face.detectedFace && face.colors.length === 9) {
        // 检查这个面是否已经被设置过
        if (!assignedFaces.includes(face.detectedFace)) {
          console.log(`[BatchUploader] 设置面: ${face.detectedFace} <- 图片${face.id}`)
          setFace(face.detectedFace, face.imageData, face.colors)
          assignedFaces.push(face.detectedFace)
          setCount++
        } else {
          console.warn(`[BatchUploader] 跳过图片${face.id}: 面 ${face.detectedFace} 已存在`)
        }
      } else {
        console.warn(`[BatchUploader] 跳过图片${face.id}: face=${face.detectedFace}, colors=${face.colors.length}`)
      }
    })
    console.log(`[BatchUploader] 成功设置 ${setCount} 个面: ${assignedFaces.join(', ')}`)

    // 检查是否所有6个面都被设置
    const missingFaces = allFaces.filter(f => !assignedFaces.includes(f))
    if (missingFaces.length > 0) {
      console.warn(`[BatchUploader] 警告: 缺少面 ${missingFaces.join(', ')}`)
    }

    // 触发确认回调，开始求解
    console.log('[BatchUploader] 调用 onConfirm()')
    onConfirm()
  }

  const handleReassign = (id: number, newFace: FaceName) => {
    setDetectedFaces(faces =>
      faces.map(f => (f.id === id ? { ...f, detectedFace: newFace } : f))
    )
  }

  const handleRemove = (id: number) => {
    setDetectedFaces(faces => faces.filter(f => f.id !== id))
  }

  const handleReset = () => {
    setDetectedFaces([])
    setIsAllProcessed(false)
  }

  const allFacesAssigned = detectedFaces.every(
    f => f.detectedFace !== null && f.colors.length === 9
  )

  return (
    <div className="space-y-4">
      {/* 上传区域 */}
      {detectedFaces.length === 0 && (
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
        >
          <div className="text-4xl text-gray-400 mb-2">+</div>
          <p className="text-gray-600">点击选择或拍摄6张魔方面照片</p>
          <p className="text-gray-400 text-sm mt-1">支持一次选择多张图片</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* 检测结果展示 */}
      {detectedFaces.length > 0 && (
        <div className="space-y-4">
          {/* 状态提示 */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {isAllProcessed
                ? `已检测到 ${detectedFaces.length} 张图片`
                : `正在处理... ${detectedFaces.filter(f => !f.isProcessing).length}/${detectedFaces.length}`}
            </p>
            {isAllProcessed && (
              <button onClick={handleReset} className="text-sm text-blue-500 hover:text-blue-700">
                重新上传
              </button>
            )}
          </div>

          {/* 图片网格 */}
          <div className="grid grid-cols-3 gap-3">
            {detectedFaces.map(face => (
              <div
                key={face.id}
                className="flex flex-col items-center gap-2 p-2 bg-white rounded-lg shadow-sm"
              >
                {/* 图片预览 */}
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 relative">
                  <img
                    src={face.imageData}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  {face.isProcessing && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {/* 检测结果 */}
                {isAllProcessed && !face.isProcessing && (
                  <>
                    {/* 颜色预览 */}
                    {face.colors.length > 0 && (
                      <div className="grid grid-cols-3 gap-px w-12 h-12">
                        {face.colors.map((color, i) => (
                          <div
                            key={i}
                            className="w-full h-full rounded-sm"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          {/* 确认按钮 */}
          {isAllProcessed && (
            <div className="space-y-2">
              {/* 缺失面提示 */}
              {!allFacesAssigned && (
                <div className="text-sm text-orange-600 bg-orange-50 rounded-lg p-3">
                  ⚠️ 缺少以下面: {['U', 'D', 'L', 'R', 'F', 'B'].filter(f => !detectedFaces.some(d => d.detectedFace === f)).join(', ')}
                  <br />请重新上传正确的照片
                </div>
              )}

              <button
                onClick={handleConfirm}
                disabled={detectedFaces.length < 6 || !allFacesAssigned}
                className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                {detectedFaces.length >= 6 && allFacesAssigned ? '确认并开始还原' : '请上传完整的6个面'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
