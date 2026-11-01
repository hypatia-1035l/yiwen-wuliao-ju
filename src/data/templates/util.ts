import { newId } from '@/core/id'
import { pageSizePx } from '@/core/paper'
import {
  APP_ID,
  SCHEMA_VERSION,
  type ElementDoc,
  type Orientation,
  type PageDoc,
  type PaperSize,
  type ProjectDoc,
} from '@/types/project'

export interface BuildOptions {
  templateId: string
  name: string
  size: PaperSize
  orientation?: Orientation
  page?: Partial<PageDoc>
}

/** 统一的项目构造函数，保证每个模板产出的文档结构完全一致 */
export function makeProject(opts: BuildOptions): { doc: ProjectDoc; W: number; H: number } {
  const page: PageDoc = {
    size: opts.size,
    orientation: opts.orientation ?? 'portrait',
    color: '#f3ead6',
    background: 'paper',
    texture: 0.45,
    margin: 42,
    ...opts.page,
  }
  const { width: W, height: H } = pageSizePx(page)
  const now = Date.now()
  const doc: ProjectDoc = {
    schemaVersion: SCHEMA_VERSION,
    app: APP_ID,
    id: newId('proj'),
    name: opts.name,
    createdAt: now,
    updatedAt: now,
    templateId: opts.templateId,
    page,
    assets: [],
    elements: [],
  }
  return { doc, W, H }
}

/** 按图层顺序压入元素 */
export function add(doc: ProjectDoc, ...els: ElementDoc[]): void {
  doc.elements.push(...els)
}
