import { jsPDF } from 'jspdf'
import { clampExportScale } from '@/core/audit'
import { pageSizeMm, pageSizePx } from '@/core/paper'
import type { Orientation, PaperSize } from '@/types/project'
import { downloadBlob, safeFileName } from './download'
import { waitForFonts, type CanvasSource, type ExportResult } from './png'

export interface PdfPageInfo {
  widthMm: number
  heightMm: number
  orientation: Orientation
  dpi: number
}

/**
 * PDF 导出。
 *
 * 关于「不得把低分辨率预览图直接放大冒充印刷文件」：
 * 这里的位图不是屏幕预览的截图，而是按目标 DPI 重新走一遍 Konva 渲染管线得到的
 * （世界坐标缩放 = dpi/96），文字由 canvas 以矢量方式重新排版绘制。
 * 单页物料，页面尺寸直接取 A4/A5/A6 的毫米值，因此 PDF 里的实际物理尺寸是准确的。
 */
export async function exportPdf(
  source: CanvasSource,
  name: string,
  page: { size: PaperSize; orientation: Orientation },
  dpi: number,
): Promise<ExportResult & { pageInfo: PdfPageInfo }> {
  await waitForFonts()

  const mm = pageSizeMm(page.size, page.orientation)
  const { width: W, height: H } = pageSizePx(page)
  const { scale, capped } = clampExportScale(dpi / 96, W, H)

  const canvas = await source.exportCanvas(scale)
  const orientation: Orientation = mm.width > mm.height ? 'landscape' : 'portrait'

  const pdf = new jsPDF({
    unit: 'mm',
    format: [mm.width, mm.height],
    orientation,
    compress: true,
  })
  pdf.setProperties({
    title: name,
    creator: '异闻物料局 0.1',
    subject: `${page.size} ${orientation === 'landscape' ? '横向' : '纵向'} · ${Math.round(dpi)}dpi`,
  })

  const dataUrl = canvas.toDataURL('image/png')
  pdf.addImage(dataUrl, 'PNG', 0, 0, mm.width, mm.height, undefined, 'SLOW')

  const blob = pdf.output('blob')
  const filename = `${safeFileName(name)}_${page.size}${orientation === 'landscape' ? '-横向' : ''}.pdf`
  downloadBlob(blob, filename)

  return {
    filename,
    width: canvas.width,
    height: canvas.height,
    bytes: blob.size,
    capped,
    pageInfo: { widthMm: mm.width, heightMm: mm.height, orientation, dpi: Math.round(dpi) },
  }
}
