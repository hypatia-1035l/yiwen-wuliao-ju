import { createShape, createText } from '@/core/factory'
import { fontFamilyOf } from '@/core/fonts'
import { PALETTE } from '@/core/palette'
import type { TemplateDef } from './types'
import { add, makeProject } from './util'

/**
 * 模板二：调查档案（A4 纵向）
 * 版式：深色机密页眉 + 字段表 + 证物照片位 + 双栏正文（右栏为照片与签章）
 */
export const dossierTemplate: TemplateDef = {
  id: 'dossier',
  name: '调查档案',
  category: '档案',
  blurb: '机密页眉与字段表，适合案件卷宗、NPC 档案',
  accent: '#24364d',
  size: 'A4',
  build() {
    const { doc, W, H } = makeProject({
      templateId: 'dossier',
      name: '调查档案 · 雾港灯影案',
      size: 'A4',
      page: { color: '#fbfaf7', texture: 0.22, margin: 48 },
    })

    const NS = PALETTE.indigo
    const left = 48
    const right = W - 48
    const colX = 196
    const rowTop = 176
    const rowH = 46
    const rows = 5

    const tableEls = [
      createShape('rect', {
        name: '字段表外框',
        x: left,
        y: rowTop,
        width: right - left,
        height: rowH * rows,
        fill: 'transparent',
        stroke: NS,
        strokeWidth: 1.2,
      }),
      createShape('line', {
        name: '表头竖线',
        x: colX,
        y: rowTop,
        width: 0,
        height: rowH * rows,
        stroke: NS,
        strokeWidth: 0.9,
        opacity: 0.8,
      }),
    ]
    for (let i = 1; i < rows; i++) {
      tableEls.push(
        createShape('line', {
          name: `字段表横线 ${i}`,
          x: left,
          y: rowTop + rowH * i,
          width: right - left,
          height: 0,
          stroke: NS,
          strokeWidth: 0.7,
          opacity: 0.55,
        }),
      )
    }

    const labels = ['案件名称', '报案人', '事发地点', '首次备案', '承办员']
    const values = [
      '雾港区「灯影自移」案',
      '陈守拙（更夫，六十三岁）',
      '雾港区 灯市街 十七号 至 廿三号',
      '昭和十七年 三月初九 亥时',
      '第三调查组 见习调查员 □□□',
    ]
    const fields = labels.flatMap((label, i) => [
      createText({
        name: `字段 ${label}`,
        x: left + 12,
        y: rowTop + rowH * i + 14,
        width: colX - left - 20,
        text: label,
        fontSize: 10.5,
        fontFamily: fontFamilyOf('sans'),
        letterSpacing: 1.4,
        align: 'left',
        fill: '#5a6473',
      }),
      createText({
        name: `值 ${label}`,
        x: colX + 14,
        y: rowTop + rowH * i + 12,
        width: right - colX - 26,
        text: values[i] ?? '',
        fontSize: 12,
        fontFamily: fontFamilyOf('serif'),
        align: 'left',
        fill: PALETTE.ink,
      }),
    ])

    const bodyW = 473
    const photoX = 545.7

    add(
      doc,
      createShape('rect', {
        name: '机密页眉',
        x: 0,
        y: 0,
        width: W,
        height: 132,
        fill: NS,
        stroke: 'transparent',
        strokeWidth: 0,
      }),
      createText({
        name: '档案标题',
        x: left,
        y: 40,
        width: 460,
        text: '調 查 檔 案',
        fontSize: 27,
        fontFamily: fontFamilyOf('serif'),
        fontStyle: 'bold',
        letterSpacing: 7,
        align: 'left',
        fill: '#f6f1e4',
      }),
      createText({
        name: '档案英文标题',
        x: left + 2,
        y: 84,
        width: 460,
        text: 'INVESTIGATION DOSSIER · 第三調查組',
        fontSize: 8.6,
        fontFamily: fontFamilyOf('latin'),
        letterSpacing: 2.2,
        align: 'left',
        fill: '#b9c6d6',
      }),
      createText({
        name: '档案编号',
        x: W - 330,
        y: 46,
        width: 282,
        text: 'NO. YW-Ⅲ-0427',
        fontSize: 11,
        fontFamily: fontFamilyOf('mono'),
        letterSpacing: 1.6,
        align: 'right',
        fill: '#e4d7b8',
      }),
      createText({
        name: '密级标记',
        x: W - 330,
        y: 70,
        width: 282,
        text: '機密 · 限閱 · 不得外傳',
        fontSize: 9.6,
        fontFamily: fontFamilyOf('sans'),
        letterSpacing: 2,
        align: 'right',
        fill: '#9fb0c4',
      }),
      createShape('line', {
        name: '页眉下沿',
        x: 0,
        y: 132,
        width: W,
        height: 0,
        stroke: '#c2a25f',
        strokeWidth: 2.5,
      }),

      ...tableEls,
      ...fields,

      createText({
        name: '章节一 标题',
        x: left,
        y: 424,
        width: bodyW,
        text: '一、案 情 摘 要',
        fontSize: 13,
        fontFamily: fontFamilyOf('sans'),
        fontStyle: 'bold',
        letterSpacing: 3,
        align: 'left',
        fill: NS,
      }),
      createText({
        name: '案情摘要',
        x: left,
        y: 452,
        width: bodyW,
        text:
          '自三月初九起，雾港区灯市街夜间屡现「灯下有影、影不随人」之状。目击者十一人，所述大同小异：子时前后，街灯自明，灯柱之下凝一淡影，形似人而无人形，缓行三步即没。\n\n' +
          '每现必闻铜铃一声，声自西南来。巡夜更夫陈守拙曾以灯照之，灯灭，其人僵立至天明，醒后不复言。\n\n' +
          '本组初判：非妖非魅，疑为「旧影」一类，与灯市街十七号旧照相馆之拆迁未尽有关。',
        fontSize: 12,
        fontFamily: fontFamilyOf('serif'),
        lineHeight: 1.9,
        align: 'justify',
        fill: PALETTE.ink,
      }),

      createText({
        name: '章节二 标题',
        x: left,
        y: 700,
        width: bodyW,
        text: '二、現 場 勘 查 記 錄',
        fontSize: 13,
        fontFamily: fontFamilyOf('sans'),
        fontStyle: 'bold',
        letterSpacing: 3,
        align: 'left',
        fill: NS,
      }),
      createText({
        name: '勘查记录',
        x: left,
        y: 728,
        width: bodyW,
        text:
          '灯市街十七号：门面已封，铁皮卷帘锈死。撬开后见堂中留一木架，架上玻璃底片三十六枚，皆为人像，无一张有面孔。\n\n' +
          '地面浮土上有极浅之足印，皆为左足，不成对；以石膏取模三枚，送技术科。\n\n' +
          '廿三号墙根拾得铜铃一枚，铃舌已失。摇之无声，置于灯下则自鸣一响。',
        fontSize: 12,
        fontFamily: fontFamilyOf('serif'),
        lineHeight: 1.9,
        align: 'justify',
        fill: PALETTE.ink,
      }),

      createShape('rect', {
        name: '照片框',
        x: photoX,
        y: 428,
        width: 200,
        height: 250,
        fill: '#eceae4',
        stroke: '#8b93a0',
        strokeWidth: 1,
        dash: [6, 4],
      }),
      createText({
        name: '照片占位说明',
        x: photoX,
        y: 540,
        width: 200,
        text: '证物照片\n（在左侧「图片」中添加本地照片）',
        fontSize: 10,
        fontFamily: fontFamilyOf('sans'),
        lineHeight: 1.7,
        align: 'center',
        fill: '#8b93a0',
      }),
      createText({
        name: '照片编号',
        x: photoX,
        y: 686,
        width: 200,
        text: 'PLATE Ⅰ — 灯市街十七号门面',
        fontSize: 8.4,
        fontFamily: fontFamilyOf('mono'),
        align: 'center',
        fill: '#7c8794',
      }),

      createShape('seal', {
        name: '档案科骑缝印',
        x: photoX + 30,
        y: 730,
        width: 118,
        height: 118,
        stroke: '#8c3a2f',
        fill: 'transparent',
        strokeWidth: 3.2,
        rotation: 6,
        opacity: 0.8,
        text: '檔案科',
        textColor: '#8c3a2f',
        fontSize: 22,
      }),
      createText({
        name: '签章说明',
        x: photoX,
        y: 862,
        width: 200,
        text: '承辦員簽章',
        fontSize: 9.4,
        fontFamily: fontFamilyOf('sans'),
        letterSpacing: 2,
        align: 'center',
        fill: '#7c8794',
      }),

      createShape('line', {
        name: '页脚线',
        x: left,
        y: H - 74,
        width: right - left,
        height: 0,
        stroke: NS,
        strokeWidth: 0.8,
        opacity: 0.6,
      }),
      createText({
        name: '页脚',
        x: left,
        y: H - 62,
        width: right - left,
        text: '異聞物料局 · 第三調查組 · 建檔 昭和十七年三月 · 本件共壹頁',
        fontSize: 8.6,
        fontFamily: fontFamilyOf('mono'),
        letterSpacing: 1.4,
        align: 'left',
        fill: '#7c8794',
      }),
    )

    return doc
  },
}
