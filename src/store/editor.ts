import { reactive } from 'vue'
import { HistoryStack, snapshotOf, type Snapshot } from '@/core/history'
import { createImage, createShape, createText, duplicateElement } from '@/core/factory'
import { pageSizePx } from '@/core/paper'
import { newId } from '@/core/id'
import { validateProject } from '@/core/schema'
import { TEMPLATES, getTemplate } from '@/data/templates'
import { deleteProject as dbDelete, saveProject, loadProject, getMeta, setMeta, listProjects, type ProjectSummary } from '@/persistence/db'
import { importImageFile } from '@/core/image'
import type {
  AssetDoc,
  ElementDoc,
  PageDoc,
  ProjectDoc,
  ShapeKind,
  TextElement,
  ViewState,
} from '@/types/project'

export interface ToastMsg {
  id: number
  text: string
  type: 'info' | 'ok' | 'warn' | 'error'
}

interface HistState {
  canUndo: boolean
  canRedo: boolean
  undoDepth: number
  redoDepth: number
}

const history = new HistoryStack(90)

export const state = reactive({
  doc: TEMPLATES[0].build() as ProjectDoc,
  view: {
    zoom: 1,
    panX: 0,
    panY: 0,
    selectedIds: [] as string[],
    showGuides: false,
    showSafeArea: true,
  } as ViewState,
  hist: { canUndo: false, canRedo: false, undoDepth: 0, redoDepth: 0 } as HistState,
  savedAt: 0,
  saving: false,
  saveError: '' as string,
  toasts: [] as ToastMsg[],
  projects: [] as ProjectSummary[],
  ready: false,
  storageOk: true,
})

let toastId = 0
let saveTimer: number | null = null

export function toast(text: string, type: ToastMsg['type'] = 'info'): void {
  const msg: ToastMsg = { id: ++toastId, text, type }
  state.toasts.push(msg)
  window.setTimeout(() => {
    const i = state.toasts.findIndex((t) => t.id === msg.id)
    if (i >= 0) state.toasts.splice(i, 1)
  }, type === 'error' ? 6000 : 3200)
}

function syncHist(): void {
  state.hist.canUndo = history.canUndo
  state.hist.canRedo = history.canRedo
  state.hist.undoDepth = history.undoDepth
  state.hist.redoDepth = history.redoDepth
}

function record(mergeKey?: string): void {
  history.record(snapshotOf(state.doc), mergeKey)
  syncHist()
}

function touch(): void {
  state.doc.updatedAt = Date.now()
  scheduleSave()
}

function scheduleSave(): void {
  if (saveTimer !== null) window.clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    saveTimer = null
    void persistNow()
  }, 700)
}

export async function persistNow(): Promise<void> {
  if (!state.ready || !state.storageOk) return
  state.saving = true
  try {
    await saveProject(state.doc)
    state.savedAt = Date.now()
    state.saveError = ''
  } catch (err) {
    state.saveError = err instanceof Error ? err.message : '保存失败'
    toast(`本地保存失败：${state.saveError}`, 'error')
  } finally {
    state.saving = false
  }
}

/* ------------------------------- 查询 ------------------------------- */

export function selectedElement(): ElementDoc | null {
  const id = state.view.selectedIds[0]
  return id ? state.doc.elements.find((e) => e.id === id) ?? null : null
}

export function selectedText(): TextElement | null {
  const el = selectedElement()
  return el && el.type === 'text' ? el : null
}

export function pageSize() {
  return pageSizePx(state.doc.page)
}

function indexOf(id: string): number {
  return state.doc.elements.findIndex((e) => e.id === id)
}

/* ------------------------------- 选择 ------------------------------- */

export function select(id: string | null, additive = false): void {
  if (!id) {
    state.view.selectedIds = []
    return
  }
  if (additive) {
    const set = new Set(state.view.selectedIds)
    if (set.has(id)) set.delete(id)
    else set.add(id)
    state.view.selectedIds = [...set]
  } else {
    state.view.selectedIds = [id]
  }
}

export function clearSelection(): void {
  state.view.selectedIds = []
}

/* ------------------------------- 元素 ------------------------------- */

export function addElement(el: ElementDoc, opts: { select?: boolean } = {}): void {
  record()
  state.doc.elements.push(el)
  if (opts.select !== false) state.view.selectedIds = [el.id]
  touch()
}

export function updateElement(id: string, patch: Partial<ElementDoc>, mergeKey?: string): void {
  const i = indexOf(id)
  if (i < 0) return
  record(mergeKey)
  Object.assign(state.doc.elements[i] as Record<string, unknown>, patch)
  touch()
}

export function updatePage(patch: Partial<PageDoc>, mergeKey?: string): void {
  record(mergeKey)
  Object.assign(state.doc.page, patch)
  touch()
}

export function renameProject(name: string): void {
  record('rename')
  state.doc.name = name.slice(0, 120) || '未命名物料'
  touch()
}

export function deleteElements(ids: string[]): void {
  if (ids.length === 0) return
  record()
  state.doc.elements = state.doc.elements.filter((e) => !ids.includes(e.id))
  state.view.selectedIds = state.view.selectedIds.filter((id) => !ids.includes(id))
  touch()
}

export function deleteSelected(): void {
  deleteElements([...state.view.selectedIds])
}

export function duplicateSelected(): void {
  const el = selectedElement()
  if (!el) return
  const copy = duplicateElement(el)
  record()
  const i = indexOf(el.id)
  state.doc.elements.splice(i + 1, 0, copy)
  state.view.selectedIds = [copy.id]
  touch()
}

export function nudgeSelected(dx: number, dy: number): void {
  const ids = state.view.selectedIds
  if (!ids.length) return
  record(`nudge:${ids.join(',')}`)
  for (const el of state.doc.elements) {
    if (ids.includes(el.id) && !el.locked) {
      el.x = Math.round((el.x + dx) * 10) / 10
      el.y = Math.round((el.y + dy) * 10) / 10
    }
  }
  touch()
}

export function toggleLock(id: string): void {
  const el = state.doc.elements.find((e) => e.id === id)
  if (!el) return
  record()
  el.locked = !el.locked
  touch()
}

export function toggleVisible(id: string): void {
  const el = state.doc.elements.find((e) => e.id === id)
  if (!el) return
  record()
  el.visible = !el.visible
  touch()
}

/* ------------------------------- 图层 ------------------------------- */

export function moveLayer(id: string, target: 'up' | 'down' | 'top' | 'bottom'): void {
  const i = indexOf(id)
  if (i < 0) return
  const last = state.doc.elements.length - 1
  const j = target === 'up' ? Math.min(last, i + 1) : target === 'down' ? Math.max(0, i - 1) : target === 'top' ? last : 0
  if (i === j) return
  record()
  const [el] = state.doc.elements.splice(i, 1)
  state.doc.elements.splice(j, 0, el)
  touch()
}

/* ------------------------------- 添加控件 ------------------------------- */

export function addText(init: Partial<TextElement> = {}): void {
  const { width: W, height: H } = pageSize()
  addElement(
    createText({
      x: Math.round(W * 0.16),
      y: Math.round(H * 0.3),
      width: Math.round(W * 0.68),
      text: '在此输入文字',
      fontSize: 16,
      ...init,
    }),
  )
}

export function addShapeElement(kind: ShapeKind): void {
  const { width: W, height: H } = pageSize()
  const cx = Math.round(W / 2)
  const cy = Math.round(H / 2)
  const presets: Record<ShapeKind, Parameters<typeof createShape>[1]> = {
    rect: { x: cx - 90, y: cy - 55, width: 180, height: 110, fill: 'transparent', strokeWidth: 1.4 },
    ellipse: { x: cx - 70, y: cy - 70, width: 140, height: 140, fill: 'transparent', strokeWidth: 1.4 },
    line: { x: cx - 110, y: cy, width: 220, height: 0, strokeWidth: 1.4 },
    frame: {
      x: cx - 150,
      y: cy - 110,
      width: 300,
      height: 220,
      strokeWidth: 2,
      fill: 'transparent',
    },
    seal: {
      x: cx - 52,
      y: cy - 52,
      width: 104,
      height: 104,
      strokeWidth: 3,
      stroke: '#8c3a2f',
      textColor: '#8c3a2f',
      text: '印信',
      fontSize: 20,
      rotation: -6,
    },
  }
  addElement(createShape(kind, presets[kind]))
}

export async function addImageFile(file: File): Promise<void> {
  try {
    const img = await importImageFile(file)
    const asset: AssetDoc = {
      id: newId('asset'),
      name: img.name,
      mime: img.mime,
      dataUrl: img.dataUrl,
      width: img.width,
      height: img.height,
      createdAt: Date.now(),
    }
    const { width: W, height: H } = pageSize()
    const targetW = Math.round(W * 0.45)
    const ratio = img.height / Math.max(1, img.width)
    const targetH = Math.round(targetW * ratio)
    record()
    state.doc.assets.push(asset)
    const el = createImage(asset.id, {
      x: Math.round((W - targetW) / 2),
      y: Math.round(Math.max(20, (H - targetH) / 2)),
      width: targetW,
      height: targetH,
      name: img.name,
    })
    state.doc.elements.push(el)
    state.view.selectedIds = [el.id]
    touch()
    toast('图片已加入画布（仅保存在本机）', 'ok')
  } catch (err) {
    toast(err instanceof Error ? err.message : '图片导入失败', 'error')
  }
}

/** 清理没有被任何元素引用的图片资源，减小项目体积 */
export function purgeUnusedAssets(): number {
  const used = new Set(state.doc.elements.filter((e) => e.type === 'image').map((e) => (e as { assetId: string }).assetId))
  const before = state.doc.assets.length
  state.doc.assets = state.doc.assets.filter((a) => used.has(a.id))
  const removed = before - state.doc.assets.length
  if (removed > 0) touch()
  return removed
}

/* ------------------------------- 撤销 / 重做 ------------------------------- */

function applySnapshot(s: Snapshot): void {
  state.doc.name = s.name
  state.doc.page = s.page
  state.doc.elements = s.elements
  const ids = new Set(s.elements.map((e) => e.id))
  state.view.selectedIds = state.view.selectedIds.filter((id) => ids.has(id))
  state.doc.updatedAt = Date.now()
  scheduleSave()
}

export function undo(): void {
  const prev = history.undo(snapshotOf(state.doc))
  if (!prev) return
  applySnapshot(prev)
  syncHist()
}

export function redo(): void {
  const next = history.redo(snapshotOf(state.doc))
  if (!next) return
  applySnapshot(next)
  syncHist()
}

/* ------------------------------- 文档生命周期 ------------------------------- */

export function loadDoc(doc: ProjectDoc, resetHistory = true): void {
  state.doc = doc
  state.view.selectedIds = []
  state.view.panX = 0
  state.view.panY = 0
  if (resetHistory) history.clear()
  syncHist()
  touch()
}

export function createFromTemplate(templateId: string): void {
  const t = getTemplate(templateId)
  if (!t) {
    toast('模板不存在', 'error')
    return
  }
  loadDoc(t.build())
  state.view.zoom = 0
  toast(`已新建：${t.name}`, 'ok')
  void persistNow()
}

export function importDoc(raw: unknown): boolean {
  const result = validateProject(raw)
  if (!result.ok || !result.doc) {
    toast(result.errors[0] ?? '文件格式不正确，未导入', 'error')
    return false
  }
  // 换一个新 id，避免覆盖本地同名项目
  const doc = result.doc
  doc.id = newId('proj')
  doc.updatedAt = Date.now()
  loadDoc(doc)
  void persistNow()
  if (result.warnings.length) {
    toast(`已导入，但修正了 ${result.warnings.length} 处异常数据`, 'warn')
  } else {
    toast('项目已导入', 'ok')
  }
  return true
}

export async function openProject(id: string): Promise<void> {
  try {
    const doc = await loadProject(id)
    if (!doc) {
      toast('项目不存在或已被删除', 'error')
      return
    }
    const result = validateProject(doc)
    if (!result.ok || !result.doc) {
      toast('本地项目数据损坏，无法打开', 'error')
      return
    }
    loadDoc(result.doc)
    state.view.zoom = 0
    await setMeta('lastOpenedId', result.doc.id)
  } catch (err) {
    toast(err instanceof Error ? err.message : '打开失败', 'error')
  }
}

export async function removeProject(id: string): Promise<void> {
  try {
    await dbDelete(id)
    state.projects = state.projects.filter((p) => p.id !== id)
    toast('项目已删除', 'ok')
  } catch {
    toast('删除失败', 'error')
  }
}

export async function refreshProjects(): Promise<void> {
  try {
    state.projects = await listProjects()
  } catch {
    state.projects = []
  }
}

/** 启动：恢复上次编辑的项目，没有则用第一个模板开新档 */
export async function bootstrap(): Promise<void> {
  try {
    await refreshProjects()
    const lastId = await getMeta<string>('lastOpenedId')
    if (lastId) {
      const doc = await loadProject(lastId)
      if (doc) {
        const result = validateProject(doc)
        if (result.ok && result.doc) {
          state.doc = result.doc
          state.view.zoom = 0
          state.ready = true
          state.savedAt = state.doc.updatedAt
          syncHist()
          return
        }
      }
    }
  } catch (err) {
    state.storageOk = false
    state.saveError = err instanceof Error ? err.message : '本地数据库不可用'
    toast('本地数据库不可用，本次编辑无法自动保存（仍可导出文件）', 'warn')
  }
  state.ready = true
  state.view.zoom = 0
  syncHist()
}

export const editor = {
  state,
  select,
  clearSelection,
  selectedElement,
  selectedText,
  pageSize,
  addElement,
  updateElement,
  updatePage,
  renameProject,
  deleteSelected,
  deleteElements,
  duplicateSelected,
  nudgeSelected,
  toggleLock,
  toggleVisible,
  moveLayer,
  addText,
  addShapeElement,
  addImageFile,
  purgeUnusedAssets,
  undo,
  redo,
  loadDoc,
  createFromTemplate,
  importDoc,
  openProject,
  removeProject,
  refreshProjects,
  bootstrap,
  persistNow,
  toast,
}
