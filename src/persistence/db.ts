import type { ProjectDoc } from '@/types/project'

/**
 * 本地持久化：IndexedDB（浏览器原生，无第三方依赖）。
 * 分三个 store：
 *  - projects：完整项目文档（含图片 dataURL）
 *  - index：轻量索引，用于项目列表快速渲染
 *  - meta：键值对，记录上次打开的项目
 * 所有数据只留在本机，不发起任何网络请求。
 */

const DB_NAME = 'yiwen-wuliao-ju'
const DB_VERSION = 1
const STORE_PROJECTS = 'projects'
const STORE_INDEX = 'index'
const STORE_META = 'meta'

export interface ProjectSummary {
  id: string
  name: string
  updatedAt: number
  createdAt: number
  templateId: string
  elementCount: number
  pageSize: string
}

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('当前环境不支持 IndexedDB'))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORE_INDEX)) {
        const s = db.createObjectStore(STORE_INDEX, { keyPath: 'id' })
        s.createIndex('updatedAt', 'updatedAt')
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' })
      }
    }
    req.onsuccess = () => {
      const db = req.result
      db.onversionchange = () => db.close()
      resolve(db)
    }
    req.onerror = () => reject(req.error ?? new Error('无法打开本地数据库'))
    req.onblocked = () => reject(new Error('本地数据库被其它标签页占用，请关闭其它窗口后重试'))
  })
  return dbPromise
}

function tx<T>(store: string, mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode)
        const req = run(t.objectStore(store))
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error ?? new Error('数据库操作失败'))
        t.onabort = () => reject(t.error ?? new Error('数据库事务被中止'))
      }),
  )
}

export function summarize(doc: ProjectDoc): ProjectSummary {
  return {
    id: doc.id,
    name: doc.name,
    updatedAt: doc.updatedAt,
    createdAt: doc.createdAt,
    templateId: doc.templateId,
    elementCount: doc.elements.length,
    pageSize: `${doc.page.size}${doc.page.orientation === 'landscape' ? ' 横' : ''}`,
  }
}

export async function saveProject(doc: ProjectDoc): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction([STORE_PROJECTS, STORE_INDEX, STORE_META], 'readwrite')
    t.objectStore(STORE_PROJECTS).put(JSON.parse(JSON.stringify(doc)))
    t.objectStore(STORE_INDEX).put(summarize(doc))
    t.objectStore(STORE_META).put({ key: 'lastOpenedId', value: doc.id })
    t.oncomplete = () => resolve()
    t.onerror = () => reject(t.error ?? new Error('保存失败'))
    t.onabort = () => reject(t.error ?? new Error('保存被中止'))
  })
}

export async function loadProject(id: string): Promise<ProjectDoc | null> {
  const doc = await tx<ProjectDoc | undefined>(STORE_PROJECTS, 'readonly', (s) => s.get(id))
  return doc ?? null
}

export async function deleteProject(id: string): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction([STORE_PROJECTS, STORE_INDEX], 'readwrite')
    t.objectStore(STORE_PROJECTS).delete(id)
    t.objectStore(STORE_INDEX).delete(id)
    t.oncomplete = () => resolve()
    t.onerror = () => reject(t.error ?? new Error('删除失败'))
  })
}

export async function listProjects(): Promise<ProjectSummary[]> {
  const list = await tx<ProjectSummary[]>(STORE_INDEX, 'readonly', (s) => s.getAll())
  return list.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function getMeta<T>(key: string): Promise<T | null> {
  const row = await tx<{ key: string; value: T } | undefined>(STORE_META, 'readonly', (s) => s.get(key))
  return row ? row.value : null
}

export async function setMeta<T>(key: string, value: T): Promise<void> {
  await tx(STORE_META, 'readwrite', (s) => s.put({ key, value }))
}

export async function storageEstimate(): Promise<{ usage: number; quota: number } | null> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return null
  const { usage = 0, quota = 0 } = await navigator.storage.estimate()
  return { usage, quota }
}
