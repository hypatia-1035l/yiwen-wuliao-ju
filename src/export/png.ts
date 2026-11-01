import { clampExportScale } from '@/core/audit'
import { exportPixelSize, pageSizePx } from '@/core/paper'
import { downloadBlob, safeFileName } from './download'

export interface CanvasSource {
  exportCanvas(scale: number): Promise<HTMLCanvasElement>
}

/** 导出前等待字体文件就绪，避免出现「首帧用后备字体、导出才发现字变了」 */
export async function waitForFonts(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return
  try {
    await document.fonts.ready
  } catch {
    /* 忽略：字体加载失败不应阻断导出 */
  }
}

export interface ExportResult {
  filename: string
  width: number
  height: number
  bytes: number
  capped: boolean
}

export async function exportPng(
  source: CanvasSource,
  name: string,
  page: { size: 'A4' | 'A5' | 'A6'; orientation: 'portrait' | 'landscape' },
  dpi: number,
): Promise<ExportResult> {
  await waitForFonts()
  const { width: W, height: H } = pageSizePx(page)
  const { scale, capped } = clampExportScale(dpi / 96, W, H)
  const canvas = await source.exportCanvas(scale)

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('PNG 编码失败（画布可能过大）')

  const filename = `${safeFileName(name)}_${Math.round(dpi)}dpi.png`
  downloadBlob(blob, filename)
  const expected = exportPixelSize(page, dpi)
  return {
    filename,
    width: canvas.width || expected.width,
    height: canvas.height || expected.height,
    bytes: blob.size,
    capped,
  }
}
