import { FaceName, FACE_COLORS } from '../../types/cube'

// OpenCV.js 类型声明
declare const cv: {
  Mat: new (...args: any[]) => any
  matFromImageData: (imageData: ImageData) => any
  Rect: new (x: number, y: number, width: number, height: number) => { x: number; y: number; width: number; height: number }
  mean: (src: any, mask?: any) => [number, number, number, number]
  onload?: () => void
}

// 检查 OpenCV 是否已加载并初始化完成
function isOpenCVReady(): boolean {
  if (typeof cv === 'undefined' || !cv) {
    return false
  }
  return typeof cv.Mat === 'function' && cv.Mat != null
}

// 等待 OpenCV 加载
function waitForOpenCV(timeout: number = 30000): Promise<boolean> {
  return new Promise((resolve) => {
    console.log('OpenCV: Starting wait, cv exists:', typeof cv !== 'undefined')

    // 先检查是否已经加载完成
    if (isOpenCVReady()) {
      console.log('OpenCV ready: true (immediate)')
      resolve(true)
      return
    }

    console.log('OpenCV waiting to load...')

    // 否则轮询检查
    const startTime = Date.now()
    const checkInterval = setInterval(() => {
      const ready = isOpenCVReady()
      if (ready) {
        clearInterval(checkInterval)
        console.log('OpenCV ready: true (after polling)')
        resolve(true)
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval)
        console.log('OpenCV timeout - cv status:', typeof cv, cv ? 'exists' : 'null', cv && cv.Mat)
        resolve(false)
      }
    }, 200)
  })
}

// 使用 OpenCV 从图像中提取 3x3 网格的颜色
export async function extractColorsFromImage(
  imageData: string,
  gridSize: number = 3
): Promise<FaceName[]> {
  // 等待 OpenCV 加载
  const openCVReady = await waitForOpenCV()
    console.log('OpenCV ready:', openCVReady)

  if (!openCVReady) {
    // OpenCV 未加载，回退到简单方法
    console.warn('OpenCV not loaded, using fallback method')
    return extractColorsFallback(imageData, gridSize)
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      try {
        // 创建 Canvas 获取图像数据
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        const size = Math.min(img.width, img.height)
        const offsetX = (img.width - size) / 2
        const offsetY = (img.height - size) / 2

        canvas.width = size
        canvas.height = size
        ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size)

        // 从 Canvas 创建 OpenCV 图像
        const imageDataObj = ctx.getImageData(0, 0, size, size)
        const mat = cv.matFromImageData(imageDataObj)

        // 计算每个格子的大小
        const cellSize = size / gridSize
        const colors: FaceName[] = []

        // 对每个格子计算平均颜色
        for (let row = 0; row < gridSize; row++) {
          for (let col = 0; col < gridSize; col++) {
            // 计算格子的 ROI (感兴趣区域)
            const x = Math.floor(col * cellSize + cellSize * 0.1)
            const y = Math.floor(row * cellSize + cellSize * 0.1)
            const w = Math.floor(cellSize * 0.8)
            const h = Math.floor(cellSize * 0.8)

            const rect = new cv.Rect(x, y, w, h)
            const cellRoi = mat.roi(rect)

            // 计算平均颜色
            const meanVal = cv.mean(cellRoi)

            // meanVal 是 [B, G, R] (OpenCV 使用 BGR 格式)
            const b = Math.round(meanVal[0])
            const g = Math.round(meanVal[1])
            const r = Math.round(meanVal[2])

            // 转换为 hex 格式 (RGB)
            const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')

            console.log('[ColorExtractor] Cell', row, col, '- BGR:', [b, g, r], 'Hex:', hex)

            // 找到最接近的标准颜色
            let minDistance = Infinity
            let closestFace: FaceName = 'U'

            for (const [face, faceHex] of Object.entries(FACE_COLORS)) {
              const distance = colorDistance(hex, faceHex)
              console.log('[ColorExtractor]   vs', face, faceHex, '- distance:', distance.toFixed(2))
              if (distance < minDistance) {
                minDistance = distance
                closestFace = face as FaceName
              }
            }

            console.log('[ColorExtractor]   Selected:', closestFace, 'minDistance:', minDistance.toFixed(2))

            colors.push(closestFace)

            // 清理
            cellRoi.delete()
          }
        }

        // 清理 OpenCV 内存
        mat.delete()

        resolve(colors)
      } catch (error) {
        console.error('OpenCV processing error:', error)
        extractColorsFallback(imageData, gridSize).then(resolve).catch(reject)
      }
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = imageData
  })
}

// 备用方法：使用简单的中心像素采样 + RGB 距离
async function extractColorsFallback(
  imageData: string,
  gridSize: number = 3
): Promise<FaceName[]> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      const size = Math.min(img.width, img.height)
      const offsetX = (img.width - size) / 2
      const offsetY = (img.height - size) / 2

      canvas.width = size
      canvas.height = size
      ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size)

      const imageDataObj = ctx.getImageData(0, 0, size, size)
      const colors: FaceName[] = []
      const cellSize = size / gridSize

      // 从中心点提取颜色
      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          const centerX = Math.floor(col * cellSize + cellSize / 2)
          const centerY = Math.floor(row * cellSize + cellSize / 2)
          const idx = (centerY * size + centerX) * 4

          const r = imageDataObj.data[idx]
          const g = imageDataObj.data[idx + 1]
          const b = imageDataObj.data[idx + 2]

          const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
          const faceColor = mapToFaceColor(hex)
          colors.push(faceColor)
        }
      }

      resolve(colors)
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = imageData
  })
}

// 计算两个颜色之间的欧氏距离
function colorDistance(hex1: string, hex2: string): number {
  const r1 = parseInt(hex1.slice(1, 3), 16)
  const g1 = parseInt(hex1.slice(3, 5), 16)
  const b1 = parseInt(hex1.slice(5, 7), 16)
  const r2 = parseInt(hex2.slice(1, 3), 16)
  const g2 = parseInt(hex2.slice(3, 5), 16)
  const b2 = parseInt(hex2.slice(5, 7), 16)
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2)
}

// 将 hex 颜色映射到魔方面
function mapToFaceColor(hex: string): FaceName {
  let minDistance = Infinity
  let closestFace: FaceName = 'U'

  for (const [face, faceHex] of Object.entries(FACE_COLORS)) {
    const distance = colorDistance(hex, faceHex)
    if (distance < minDistance) {
      minDistance = distance
      closestFace = face as FaceName
    }
  }

  return closestFace
}

// 将颜色数组转换为魔方状态字符串
export function colorsToFaceState(colors: string[]): string {
  return colors.join('')
}
