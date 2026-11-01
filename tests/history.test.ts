import { describe, expect, it } from 'vitest'
import { HistoryStack, snapshotOf, type Snapshot } from '@/core/history'
import { createText } from '@/core/factory'
import type { PageDoc } from '@/types/project'

const page: PageDoc = {
  size: 'A5',
  orientation: 'portrait',
  color: '#fff',
  background: 'color',
  texture: 0,
  margin: 40,
}

function snap(text: string) {
  return snapshotOf({ name: 'n', page, elements: [createText({ text })] })
}

function textOf(s: Snapshot): string {
  const el = s.elements[0]
  return el.type === 'text' ? el.text : ''
}

describe('撤销 / 重做', () => {
  it('record → undo 恢复上一个状态', () => {
    const h = new HistoryStack()
    h.record(snap('A'))
    h.record(snap('B'))
    const cur = snap('C')
    const prev = h.undo(cur)
    expect(textOf(prev!)).toBe('B')
    expect(h.canUndo).toBe(true)
    expect(h.canRedo).toBe(true)
  })

  it('redo 把撤销掉的状态拿回来', () => {
    const h = new HistoryStack()
    h.record(snap('A'))
    h.record(snap('B'))
    const afterB = h.undo(snap('C'))
    const again = h.redo(afterB!)
    expect(textOf(again!)).toBe('C')
    expect(h.canRedo).toBe(false)
  })

  it('空栈时 undo/redo 返回 null', () => {
    const h = new HistoryStack()
    expect(h.undo(snap('x'))).toBeNull()
    expect(h.redo(snap('x'))).toBeNull()
  })

  it('相同 mergeKey 的连续记录被合并为一步', () => {
    const h = new HistoryStack()
    h.record(snap('A'), 'typing')
    h.record(snap('AB'), 'typing')
    h.record(snap('ABC'), 'typing')
    expect(h.undoDepth).toBe(1)
    const prev = h.undo(snap('ABCD'))
    expect(textOf(prev!)).toBe('A')
  })

  it('不同 mergeKey 不合并', () => {
    const h = new HistoryStack()
    h.record(snap('A'), 'el1')
    h.record(snap('B'), 'el2')
    expect(h.undoDepth).toBe(2)
  })

  it('快照是深拷贝，修改原对象不影响历史', () => {
    const h = new HistoryStack()
    const s = snap('A')
    h.record(s)
    s.elements[0].name = 'hacked'
    const cur = snap('B')
    const prev = h.undo(cur)!
    expect(textOf(prev)).toBe('A')
    expect(prev.elements[0].name).toBe('文字')
  })

  it('超过容量上限时丢弃最旧的记录', () => {
    const h = new HistoryStack(5)
    for (let i = 0; i < 10; i++) h.record(snap(`v${i}`))
    expect(h.undoDepth).toBe(5)
    // 栈里保留 v5..v9，undo 弹出最后压入的 v9
    const prev = h.undo(snap('now'))
    expect(textOf(prev!)).toBe('v9')
    // 再连续 undo 四次，最早能回到 v5
    let cur = prev!
    for (let i = 0; i < 4; i++) cur = h.undo(cur)!
    expect(textOf(cur)).toBe('v5')
    expect(h.canUndo).toBe(false)
  })
})
