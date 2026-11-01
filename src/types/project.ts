/**
 * 异闻物料局 · 项目文档数据模型
 *
 * 设计原则
 * 1. 本文件定义的是「纯数据」，不含任何画布引擎（Konva）类型，也不依赖 Vue 响应式。
 *    渲染层只能单向消费它，因此文档可以被序列化、版本化、跨引擎迁移。
 * 2. 单位统一为 CSS px @96dpi。纸张的真实物理尺寸由 page.size（A4/A5/A6，mm）决定，
 *    导出时按目标 DPI 重新计算像素比例，因此文档单位与导出分辨率互不影响。
 * 3. 所有元素必须有稳定 id（生成后终身不变），用于选择、历史记录、图层排序、资源引用。
 */

export const SCHEMA_VERSION = 1
export const APP_ID = 'yiwen-wuliao-ju'

/** 纸张规格（毫米，纵向） */
export const PAPER_MM = {
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 },
  A6: { width: 105, height: 148 },
} as const

export type PaperSize = keyof typeof PAPER_MM
export type Orientation = 'portrait' | 'landscape'

export const PAPER_LABEL: Record<PaperSize, string> = {
  A4: 'A4 · 210×297mm',
  A5: 'A5 · 148×210mm',
  A6: 'A6 · 105×148mm',
}

export type ElementType = 'text' | 'image' | 'shape'

export interface BaseElement {
  id: string
  type: ElementType
  /** 图层名，显示在图层面板 */
  name: string
  /** 左上角坐标（未旋转时），px@96 */
  x: number
  y: number
  width: number
  height: number
  /** 顺时针旋转角度 */
  rotation: number
  opacity: number
  visible: boolean
  locked: boolean
}

export type TextAlign = 'left' | 'center' | 'right' | 'justify'
export type VerticalAlign = 'top' | 'middle' | 'bottom'

export interface TextElement extends BaseElement {
  type: 'text'
  text: string
  /** px@96，UI 中同时显示对应 pt（px * 0.75） */
  fontSize: number
  fontFamily: string
  fontStyle: 'normal' | 'bold' | 'italic' | 'bold italic'
  align: TextAlign
  verticalAlign: VerticalAlign
  lineHeight: number
  letterSpacing: number
  fill: string
  /** 高度随内容增长（此时 height 仅为测量缓存，不允许垂直缩放） */
  autoHeight: boolean
  padding: number
}

export type ImageFit = 'cover' | 'contain' | 'fill'
/** 图片色调预处理，用于做旧照片 / 蓝图 / 底片效果 */
export type ImageTone = 'none' | 'gray' | 'sepia' | 'blueprint'

export interface ImageElement extends BaseElement {
  type: 'image'
  assetId: string
  fit: ImageFit
  tone: ImageTone
  cornerRadius: number
  stroke: string
  strokeWidth: number
}

export type ShapeKind = 'rect' | 'ellipse' | 'line' | 'frame' | 'seal'

export interface ShapeElement extends BaseElement {
  type: 'shape'
  shape: ShapeKind
  fill: string
  stroke: string
  strokeWidth: number
  cornerRadius: number
  dash: number[]
  /** seal 专用：印章文字 */
  text?: string
  textColor?: string
  fontSize?: number
}

export type ElementDoc = TextElement | ImageElement | ShapeElement

/** 资源只存本地 dataURL，永不上传 */
export interface AssetDoc {
  id: string
  name: string
  mime: string
  /** data:image/...;base64,... */
  dataUrl: string
  width: number
  height: number
  createdAt: number
}

export type BackgroundKind = 'color' | 'paper'

export interface PageDoc {
  size: PaperSize
  orientation: Orientation
  /** 纸张底色 */
  color: string
  /** 纸张纹理（程序生成，不引入外部图片） */
  background: BackgroundKind
  /** 纹理强度 0–1 */
  texture: number
  /** 安全边距参考线（px@96），仅作版心提示，不裁切 */
  margin: number
}

export interface ProjectDoc {
  schemaVersion: number
  app: string
  id: string
  name: string
  createdAt: number
  updatedAt: number
  /** 模板来源标识，仅作记录 */
  templateId: string
  page: PageDoc
  assets: AssetDoc[]
  /** 数组顺序即图层顺序：索引 0 最底层 */
  elements: ElementDoc[]
}

/* ------------------------------ 界面态（不入文档） ------------------------------ */

export interface ViewState {
  zoom: number
  /** 画布平移（屏幕 px） */
  panX: number
  panY: number
  selectedIds: string[]
  showGuides: boolean
  showSafeArea: boolean
}
