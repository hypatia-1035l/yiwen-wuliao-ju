import { SCHEMA_VERSION, type ProjectDoc } from '@/types/project'
import { validateProject } from '@/core/schema'
import { downloadText, safeFileName, stamp } from './download'

/**
 * 项目 JSON 序列化。
 * 文件是自包含的：图片以 dataURL 内嵌，换一台机器打开也能完整还原，
 * 不会出现「丢图」或「引用远程地址」的情况。
 */
export function serializeProject(doc: ProjectDoc): string {
  const payload: ProjectDoc = {
    schemaVersion: SCHEMA_VERSION,
    app: doc.app,
    id: doc.id,
    name: doc.name,
    createdAt: doc.createdAt,
    updatedAt: Date.now(),
    templateId: doc.templateId,
    page: doc.page,
    assets: doc.assets,
    elements: doc.elements,
  }
  return JSON.stringify(payload, null, 2)
}

export function exportProjectFile(doc: ProjectDoc): string {
  const filename = `${safeFileName(doc.name)}_${stamp()}.ywmj.json`
  downloadText(serializeProject(doc), filename)
  return filename
}

const MAX_FILE_BYTES = 80 * 1024 * 1024

export async function readProjectFile(file: File): Promise<unknown> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('文件超过 80MB，已拒绝读取')
  }
  const text = await file.text()
  try {
    return JSON.parse(text) as unknown
  } catch {
    throw new Error('不是合法的 JSON 文件')
  }
}

/** 只校验不落地，用于导入前的预览提示 */
export function inspectFile(raw: unknown): ReturnType<typeof validateProject> {
  return validateProject(raw)
}

/** 估算项目体积，提示用户图片占用 */
export function projectBytes(doc: ProjectDoc): number {
  return new Blob([JSON.stringify(doc)]).size
}
