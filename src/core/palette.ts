/** 界面与模板共用的色板：档案室 / 调查局 / 旧纸文书 */
export const PALETTE = {
  ink: '#1b1712',
  inkSoft: '#3d342a',
  paper: '#efe4cb',
  paperDark: '#e2d3b3',
  parchment: '#e8dcc0',
  copper: '#a8732a',
  copperSoft: '#c99a51',
  rust: '#7a2b23',
  indigo: '#24364d',
  sepia: '#6b543a',
  white: '#ffffff',
  black: '#000000',
} as const

/** 纸张底色预设（含纹理档位建议） */
export const PAPER_COLORS: { label: string; color: string }[] = [
  { label: '旧宣纸', color: '#efe3c8' },
  { label: '米黄档案纸', color: '#f3ead6' },
  { label: '冷白印刷', color: '#fbfaf7' },
  { label: '牛皮纸', color: '#dfc49b' },
  { label: '焦边褐', color: '#d8bd94' },
  { label: '深色告示', color: '#2b2620' },
]
