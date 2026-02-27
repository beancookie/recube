import { FaceName, FACE_COLORS } from '../types/cube'

// 直接使用 FACE_COLORS 中的标准颜色
const CENTER_COLORS: Record<FaceName, number[]> = {
  U: [255, 255, 255],   // 白
  D: [255, 255, 0],     // 黄
  L: [255, 89, 0],      // 橙
  R: [255, 0, 0],       // 红
  F: [0, 158, 96],      // 绿
  B: [0, 69, 173],      // 蓝
}

// 计算RGB距离
function colorDistance(rgb1: number[], rgb2: number[]): number {
  return Math.sqrt(
    (rgb1[0] - rgb2[0]) ** 2 +
    (rgb1[1] - rgb2[1]) ** 2 +
    (rgb1[2] - rgb2[2]) ** 2
  )
}

// 从图像数据提取中心区域平均颜色（更鲁棒）
function getCenterColor(imageData: ImageData): number[] {
  const data = imageData.data
  const size = Math.sqrt(data.length / 4)

  console.log('[FaceDetector] 图像尺寸:', size, 'x', size)

  // 取中心 5x5 区域的平均值（更大的区域以获得更稳定的颜色）
  const centerSize = Math.max(5, Math.floor(size * 0.2)) // 中心区域的宽度（20%）
  const centerStart = Math.floor((size - centerSize) / 2)

  console.log(`[FaceDetector] 中心区域: ${centerSize}x${centerSize}, 起始位置: (${centerStart}, ${centerStart})`)

  let totalR = 0, totalG = 0, totalB = 0, count = 0

  for (let y = centerStart; y < centerStart + centerSize; y++) {
    for (let x = centerStart; x < centerStart + centerSize; x++) {
      const idx = (Math.floor(y) * Math.floor(size) + Math.floor(x)) * 4
      totalR += data[idx]
      totalG += data[idx + 1]
      totalB += data[idx + 2]
      count++
    }
  }

  const avgColor = [
    Math.round(totalR / count),
    Math.round(totalG / count),
    Math.round(totalB / count)
  ]

  console.log('[FaceDetector] 中心区域平均颜色 (RGB):', avgColor)
  return avgColor
}

// 从 dataUrl 获取 ImageData
async function imageDataFromDataUrl(dataUrl: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      resolve(ctx.getImageData(0, 0, img.width, img.height))
    }
    img.onerror = reject
    img.src = dataUrl
  })
}

// 识别图像对应的面
export async function detectFace(dataUrl: string): Promise<{ face: FaceName; confidence: number }> {
  console.log('[FaceDetector] ========== 开始检测面 ==========')
  const imgData = await imageDataFromDataUrl(dataUrl)
  const center = getCenterColor(imgData)

  console.log('[FaceDetector] 中心颜色 RGB:', center)

  // 直接使用距离检测（更可靠）
  let minDist = Infinity
  let detected: FaceName = 'U'

  for (const [face, expected] of Object.entries(CENTER_COLORS)) {
    const dist = colorDistance(center, expected)
    console.log(`[FaceDetector] 距离检测 ${face}: ${dist.toFixed(1)} (中心=${center.join(',')}, 期望=${expected.join(',')})`)
    if (dist < minDist) {
      minDist = dist
      detected = face as FaceName
    }
  }

  // 距离越小置信度越高
  const confidence = Math.max(0, 1 - minDist / 300)
  console.log(`[FaceDetector] 检测结果: ${detected}, 距离=${minDist.toFixed(1)}, 置信度=${(confidence * 100).toFixed(1)}%`)
  console.log('[FaceDetector] ========== 检测完成 ==========')

  return { face: detected, confidence }
}

// 面的中文标签
export const FACE_LABELS: Record<FaceName, string> = {
  U: '上 (U)',
  D: '下 (D)',
  L: '左 (L)',
  R: '右 (R)',
  F: '前 (F)',
  B: '后 (B)',
}
