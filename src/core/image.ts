/**
 * 本地图片导入。
 *
 * 约束：图片只在浏览器内存中处理，转成 dataURL 存进项目文件，
 * 全程不发任何网络请求，也不把本地图片替换成远程地址。
 */

export interface ImportedImage {
  dataUrl: string
  mime: string
  width: number
  height: number
  name: string
  bytes: number
}

const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/bmp', 'image/avif']

export function isSupportedImage(file: File): boolean {
  return ACCEPTED.includes(file.type)
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片解码失败，可能已损坏或格式不受支持'))
    img.src = src
  })
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('读取文件失败'))
    reader.readAsDataURL(file)
  })
}

/**
 * 读取并规范化图片：限制最长边，避免把 40MP 手机原图塞进 JSON。
 * 输出格式保持可预测：JPEG 原图仍为 JPEG，其余一律 PNG。
 */
export async function importImageFile(file: File, maxEdge = 1800): Promise<ImportedImage> {
  if (!isSupportedImage(file)) {
    throw new Error('不支持的图片格式（可用 PNG / JPEG / WebP / GIF / BMP / AVIF）')
  }
  const raw = await readAsDataUrl(file)
  const img = await loadImage(raw)

  const w = img.naturalWidth || img.width
  const h = img.naturalHeight || img.height
  const scale = Math.min(1, maxEdge / Math.max(w, h))
  const tw = Math.max(1, Math.round(w * scale))
  const th = Math.max(1, Math.round(h * scale))

  const canvas = document.createElement('canvas')
  canvas.width = tw
  canvas.height = th
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建绘图上下文')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, tw, th)

  const keepJpeg = file.type === 'image/jpeg'
  const dataUrl = keepJpeg ? canvas.toDataURL('image/jpeg', 0.9) : canvas.toDataURL('image/png')
  const mime = keepJpeg ? 'image/jpeg' : 'image/png'

  return {
    dataUrl,
    mime,
    width: tw,
    height: th,
    name: file.name || '未命名图片',
    bytes: dataUrl.length,
  }
}

/** 从 dataURL 读取真实像素尺寸，用于校验导入的项目文件 */
export async function measureDataUrl(dataUrl: string): Promise<{ width: number; height: number } | null> {
  try {
    const img = await loadImage(dataUrl)
    return { width: img.naturalWidth, height: img.naturalHeight }
  } catch {
    return null
  }
}
