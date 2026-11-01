import { cloneDoc } from '@/core/factory'
import type { ElementDoc, PageDoc } from '@/types/project'

/**
 * 撤销 / 重做：快照栈。
 *
 * 只快照「页面设置 + 元素 + 项目名」，不快照 assets。
 * 图片资源一旦导入就保留在项目里（撤销删除元素后资源仍在），
 * 这样既避免历史记录里塞进多份 base64 图片把内存撑爆，也不会丢图。
 */
export interface Snapshot {
  name: string
  page: PageDoc
  elements: ElementDoc[]
}

export class HistoryStack {
  private past: Snapshot[] = []
  private future: Snapshot[] = []
  private lastMergeKey: string | null = null
  private lastMergeTime = 0

  constructor(private readonly limit = 80) {}

  get canUndo(): boolean {
    return this.past.length > 0
  }

  get canRedo(): boolean {
    return this.future.length > 0
  }

  get undoDepth(): number {
    return this.past.length
  }

  get redoDepth(): number {
    return this.future.length
  }

  /**
   * 记录变更前的状态。
   * mergeKey 相同且在 700ms 内的连续调用会被合并（用于文字逐字输入、滑块拖动），
   * 这样一次连续编辑只产生一步撤销。
   */
  record(snapshot: Snapshot, mergeKey?: string): boolean {
    const now = Date.now()
    if (mergeKey && mergeKey === this.lastMergeKey && now - this.lastMergeTime < 700) {
      this.lastMergeTime = now
      return false
    }
    this.past.push(cloneDoc(snapshot))
    if (this.past.length > this.limit) this.past.shift()
    this.future.length = 0
    this.lastMergeKey = mergeKey ?? null
    this.lastMergeTime = now
    return true
  }

  undo(current: Snapshot): Snapshot | null {
    const prev = this.past.pop()
    if (!prev) return null
    this.future.push(cloneDoc(current))
    this.lastMergeKey = null
    return prev
  }

  redo(current: Snapshot): Snapshot | null {
    const next = this.future.pop()
    if (!next) return null
    this.past.push(cloneDoc(current))
    this.lastMergeKey = null
    return next
  }

  clear(): void {
    this.past.length = 0
    this.future.length = 0
    this.lastMergeKey = null
  }
}

export function snapshotOf(doc: { name: string; page: PageDoc; elements: ElementDoc[] }): Snapshot {
  return { name: doc.name, page: doc.page, elements: doc.elements }
}
