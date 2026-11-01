import type { TemplateDef } from './types'
import { commissionTemplate } from './commission'
import { dossierTemplate } from './dossier'
import { wantedTemplate } from './wanted'
import { diaryTemplate } from './diary'

/**
 * 模板注册表。
 * 新增模板只需实现 TemplateDef 并加入此数组，无需改动编辑器其它代码。
 * 详见 docs/TEMPLATES.md。
 */
export const TEMPLATES: TemplateDef[] = [
  commissionTemplate,
  dossierTemplate,
  wantedTemplate,
  diaryTemplate,
]

export function getTemplate(id: string): TemplateDef | undefined {
  return TEMPLATES.find((t) => t.id === id)
}

export type { TemplateDef }
