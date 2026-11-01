import { createShape, createText } from '@/core/factory'
import { fontFamilyOf } from '@/core/fonts'
import type { TemplateDef } from './types'
import { add, makeProject } from './util'

/**
 * 模板四：日记 / 线索（A5 纵向）
 * 版式：横线本 + 装订红边 + 手写体正文 + 贴附便签 + 墨渍
 */
export const diaryTemplate: TemplateDef = {
  id: 'diary',
  name: '日记 / 线索',
  category: '手记',
  blurb: '横线本与便签，适合日记残页、现场笔记、线索卡',
  accent: '#6b543a',
  size: 'A5',
  build() {
    const { doc, W, H } = makeProject({
      templateId: 'diary',
      name: '日记残页 · 三月十一日',
      size: 'A5',
      page: { color: '#e9dcc0', texture: 0.55, margin: 38 },
    })

    const rule = '#b6a17c'
    const textX = 68
    const textW = W - textX - 46

    const rules = []
    for (let i = 0; i < 18; i++) {
      rules.push(
        createShape('line', {
          name: `横格线 ${i + 1}`,
          x: 52,
          y: 176 + i * 25.2,
          width: W - 104,
          height: 0,
          stroke: rule,
          strokeWidth: 0.7,
          opacity: 0.55,
        }),
      )
    }

    add(
      doc,
      createShape('line', {
        name: '装订红边',
        x: 50,
        y: 62,
        width: 0,
        height: H - 132,
        stroke: '#a5644d',
        strokeWidth: 1.1,
        opacity: 0.75,
      }),

      createText({
        name: '日期行',
        x: textX,
        y: 66,
        width: textW,
        text: '昭和十七年　三月十一日　　雨　　子時後',
        fontSize: 13,
        fontFamily: fontFamilyOf('kai'),
        letterSpacing: 1.2,
        align: 'left',
        fill: '#3d342a',
      }),
      createText({
        name: '页内小注',
        x: textX,
        y: 92,
        width: textW,
        text: '（此頁自燈市街回來後所記 · 勿示人）',
        fontSize: 9,
        fontFamily: fontFamilyOf('kai'),
        align: 'left',
        fill: '#7a6a52',
      }),

      ...rules,

      createText({
        name: '日记正文',
        x: textX,
        y: 148,
        width: textW - 96,
        text:
          '今夜又去了。灯市街的灯，还是那样亮，亮得不像灯。\n' +
          '十七号的门我到底没敢进。只在对面檐下站了半个时辰，看那盏灯——它自己亮了，又自己灭了，中间隔了正好三口气。\n' +
          '我数过。三次，都是三口气。\n' +
          '回来时袖子里多了一样东西。不知什么时候进去的，也不知是谁放的：铜铃一枚，没有铃舌。\n' +
          '我把它放在桌上。它响了一声。',
        fontSize: 12.6,
        fontFamily: fontFamilyOf('kai'),
        lineHeight: 2,
        align: 'left',
        fill: '#2f2820',
      }),

      createShape('rect', {
        name: '便签纸',
        x: W - 214,
        y: 452,
        width: 158,
        height: 150,
        fill: '#f2e7c9',
        stroke: '#c2ab84',
        strokeWidth: 0.8,
        cornerRadius: 2,
        rotation: -3.4,
        opacity: 0.96,
      }),
      createText({
        name: '便签文字',
        x: W - 204,
        y: 466,
        width: 138,
        text: '燈 = 三口气\n鈴 = 一聲\n影 = 只左足\n\n若不是人，\n何必留左足？',
        fontSize: 10.6,
        fontFamily: fontFamilyOf('kai'),
        lineHeight: 1.85,
        align: 'left',
        fill: '#5a3a24',
        rotation: -3.4,
      }),

      createShape('ellipse', {
        name: '墨渍',
        x: 372,
        y: 626,
        width: 54,
        height: 34,
        fill: '#4a3a2a',
        stroke: 'transparent',
        strokeWidth: 0,
        rotation: 18,
        opacity: 0.16,
      }),
      createShape('ellipse', {
        name: '墨渍小点',
        x: 424,
        y: 654,
        width: 13,
        height: 9,
        fill: '#4a3a2a',
        stroke: 'transparent',
        strokeWidth: 0,
        rotation: 12,
        opacity: 0.14,
      }),

      createText({
        name: '页脚',
        x: textX,
        y: H - 62,
        width: textW,
        text: '— 頁三 —',
        fontSize: 9,
        fontFamily: fontFamilyOf('kai'),
        letterSpacing: 3,
        align: 'center',
        fill: '#7a6a52',
      }),
    )

    return doc
  },
}
