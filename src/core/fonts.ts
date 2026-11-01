/**
 * 字体候选：全部为操作系统本地字体，不加载任何远程字体。
 * 这样导出 PNG/PDF 时无需等待网络字体，也不会出现「预览有字、导出缺字」的错位。
 */

export interface FontOption {
  id: string
  label: string
  family: string
  note: string
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: 'serif',
    label: '宋体',
    family: '"Songti SC", "SimSun", "STSong", "Noto Serif CJK SC", serif',
    note: '公文正文常用，印刷体',
  },
  {
    id: 'kai',
    label: '楷体',
    family: '"Kaiti SC", "KaiTi", "STKaiti", "KaiTi_GB2312", serif',
    note: '手书感，适合日记、批注',
  },
  {
    id: 'fangsong',
    label: '仿宋',
    family: '"FangSong", "STFangsong", "FangSong_GB2312", serif',
    note: '官方文书、誊抄件',
  },
  {
    id: 'sans',
    label: '黑体',
    family: '"PingFang SC", "Microsoft YaHei", "Heiti SC", "Noto Sans CJK SC", sans-serif',
    note: '标题、公告，远读清晰',
  },
  {
    id: 'mono',
    label: '打字机',
    family: '"Courier New", "Consolas", "Menlo", "DejaVu Sans Mono", monospace',
    note: '档案编号、电报、打字稿',
  },
  {
    id: 'latin',
    label: '西文衬线',
    family: '"Georgia", "Times New Roman", "Liberation Serif", serif',
    note: '拉丁文、印鉴、古籍引文',
  },
]

export const FONT_BY_ID: Record<string, FontOption> = Object.fromEntries(
  FONT_OPTIONS.map((f) => [f.id, f]),
)

export function fontFamilyOf(id: string): string {
  return FONT_BY_ID[id]?.family ?? FONT_OPTIONS[0].family
}

export function fontLabelOf(family: string): string {
  const hit = FONT_OPTIONS.find((f) => f.family === family)
  return hit ? hit.label : '自定义'
}

/** 文档里统一存字体栈字符串，便于跨环境还原 */
export const DEFAULT_FONT = FONT_OPTIONS[0].family
