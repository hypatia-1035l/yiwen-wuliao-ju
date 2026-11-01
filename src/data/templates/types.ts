import type { PaperSize, ProjectDoc } from '@/types/project'

export interface TemplateDef {
  id: string
  name: string
  category: string
  blurb: string
  /** 左侧列表的强调色 */
  accent: string
  size: PaperSize
  /** 每次调用都生成一个全新 id 的文档，可重复创建 */
  build: () => ProjectDoc
}
