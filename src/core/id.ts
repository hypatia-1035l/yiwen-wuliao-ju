/**
 * 稳定 id 生成。使用 crypto.randomUUID，降级到时间戳 + 随机串。
 * 元素 id 一经生成终身不变，历史记录、资源引用、图层排序都依赖这一点。
 */
export function newId(prefix = 'el'): string {
  const c = globalThis.crypto as Crypto | undefined
  if (c && typeof c.randomUUID === 'function') {
    return `${prefix}_${c.randomUUID()}`
  }
  const rand = Math.random().toString(36).slice(2, 10)
  return `${prefix}_${Date.now().toString(36)}${rand}`
}
