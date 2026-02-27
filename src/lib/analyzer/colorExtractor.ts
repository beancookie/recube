import { FaceName, FACE_COLORS } from '../../types/cube'
import { loadOpenCV } from '@opencvjs/web'

// OpenCV 实例 (使用 any 类型简化处理)
let cv: any = null

// 检查 OpenCV 是否已加载并初始化完成
function isOpenCVReady(): boolean {
  return cv && typeof cv.Mat === 'function'
}

// 等待 OpenCV 加载
async function waitForOpenCV(timeout: number = 30000): Promise<boolean> {
  // 如果已经加载，直接返回
  if (isOpenCVReady()) {
    console.log('OpenCV ready: true (immediate)')
    return true
  }

  console.log('OpenCV: Loading via loadOpenCV()...')

  try {
    cv = await Promise.race([
      loadOpenCV(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('OpenCV load timeout')), timeout)
      )
    ])
    console.log('OpenCV ready: true (via loadOpenCV)')
    return true
  } catch (error) {
    console.error('OpenCV load failed:', error)
    return false
  }
}

// 使用 OpenCV 从图像中提取 3x3 网格的颜色
export async function extractColorsFromImage(
  imageData: string,
  gridSize: number = 3
): Promise<FaceName[]> {
  console.log('[ColorExtractor] 开始提取颜色...')

  // 等待 OpenCV 加载
  const openCVReady = await waitForOpenCV(10000) // 缩短超时时间
  console.log('[ColorExtractor] OpenCV ready:', openCVReady)

  if (!openCVReady) {
    // OpenCV 未加载，回退到简单方法
    console.warn('[ColorExtractor] OpenCV not loaded, using fallback method')
    return extractColorsFallback(imageData, gridSize)
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      try {
        console.log('[ColorExtractor] 图片加载成功, 尺寸:', img.width, 'x', img.height)

        // 创建 Canvas 获取图像数据
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          console.error('[ColorExtractor] 无法获取 canvas context')
          reject(new Error('Failed to get canvas context'))
          return
        }

        const size = Math.min(img.width, img.height)
        const offsetX = (img.width - size) / 2
        const offsetY = (img.height - size) / 2

        canvas.width = size
        canvas.height = size
        ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size)
        console.log('[ColorExtractor] 裁剪区域:', size, 'x', size)

        // 从 Canvas 创建 OpenCV 图像
        const imageDataObj = ctx.getImageData(0, 0, size, size)
        const mat = cv!.matFromImageData(imageDataObj)
        console.log('[ColorExtractor] OpenCV Mat 创建成功')

        // 计算每个格子的大小
        const cellSize = size / gridSize
        const colors: FaceName[] = []
        console.log('[ColorExtractor] 格子大小:', cellSize)

        // 对每个格子计算平均颜色
        for (let row = 0; row < gridSize; row++) {
          for (let col = 0; col < gridSize; col++) {
            // 计算格子的 ROI (感兴趣区域)
            const x = Math.floor(col * cellSize + cellSize * 0.1)
            const y = Math.floor(row * cellSize + cellSize * 0.1)
            const w = Math.floor(cellSize * 0.8)
            const h = Math.floor(cellSize * 0.8)

            const rect = new cv!.Rect(x, y, w, h)
            const cellRoi = mat.roi(rect)

            // 计算平均颜色
            const meanVal = cv!.mean(cellRoi)

            // OpenCV 返回 [B, G, R]
            const b = Math.round(meanVal[0])
            const g = Math.round(meanVal[1])
            const r = Math.round(meanVal[2])

            // 使用颜色规则直接判断，而不是 hex 距离
            const faceColor = detectColorByRGB(r, g, b)

            console.log('[ColorExtractor] Cell', row, col, '- RGB:', [r, g, b], '->', faceColor)

            colors.push(faceColor)

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

// 根据RGB直接判断颜色
function detectColorByRGB(r: number, g: number, b: number): FaceName {
  // 白色: R,G,B都很高且接近
  if (r > 200 && g > 200 && b > 200) {
    return 'U'
  }
  // 黄色: R和G都很高，B较低
  if (r > 180 && g > 180 && b < 100) {
    return 'D'
  }
  // 橙色: R高，G中等，B低
  if (r > 180 && g > 50 && g < 200 && b < 100) {
    return 'L'
  }
  // 红色: R很高，G和B较低
  if (r > 180 && g < 100 && b < 100) {
    return 'R'
  }
  // 蓝色: B很高，R和G较低
  if (b > 180 && r < 100 && g < 100) {
    return 'B'
  }
  // 绿色: G很高，R和B较低
  if (g > 150 && r < 100 && b < 100) {
    return 'F'
  }
  // 默认: 使用距离判断
  const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
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

  console.log(`[ColorExtractor] 颜色映射: ${hex} -> ${closestFace} (距离: ${minDistance.toFixed(1)})`)
  return closestFace
}

// 将颜色数组转换为魔方状态字符串
export function colorsToFaceState(colors: string[]): string {
  return colors.join('')
}
