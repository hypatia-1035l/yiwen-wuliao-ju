import { createShape, createText } from '@/core/factory'
import { fontFamilyOf } from '@/core/fonts'
import type { TemplateDef } from './types'
import { add, makeProject } from './util'

/**
 * 模板三：通缉令 / 公告（A4 纵向）
 * 版式：粗黑双框 + 巨幅标题 + 画像框 + 体貌特征 + 赏格
 */
export const wantedTemplate: TemplateDef = {
  id: 'wanted',
  name: '通缉令 / 公告',
  category: '告示',
  blurb: '粗框大标题、画像位与悬赏额，适合通缉、寻人、告示',
  accent: '#8c3a2f',
  size: 'A4',
  build() {
    const { doc, W, H } = makeProject({
      templateId: 'wanted',
      name: '通缉令 · 灯下客',
      size: 'A4',
      page: { color: '#e6cfa6', texture: 0.62, margin: 46 },
    })

    const ink = '#241c12'
    const rust = '#8c3a2f'
    const cx = 76
    const cw = W - cx * 2
    const photoW = 264
    const photoH = 300
    const photoX = (W - photoW) / 2

    add(
      doc,
      createShape('frame', {
        name: '外粗框',
        x: 30,
        y: 30,
        width: W - 60,
        height: H - 60,
        stroke: ink,
        strokeWidth: 6,
      }),
      createShape('frame', {
        name: '内细框',
        x: 47,
        y: 47,
        width: W - 94,
        height: H - 94,
        stroke: ink,
        strokeWidth: 1.4,
      }),

      createText({
        name: '发布机构',
        x: cx,
        y: 68,
        width: cw,
        text: '異 聞 物 料 局 · 緝 捕 司',
        fontSize: 10,
        fontFamily: fontFamilyOf('serif'),
        letterSpacing: 4.2,
        align: 'center',
        fill: '#4a3a24',
      }),
      createText({
        name: '主标题',
        x: cx,
        y: 92,
        width: cw,
        text: '通　緝　令',
        fontSize: 52,
        fontFamily: fontFamilyOf('serif'),
        fontStyle: 'bold',
        letterSpacing: 10,
        align: 'center',
        fill: ink,
      }),
      createText({
        name: '西文标题',
        x: cx,
        y: 172,
        width: cw,
        text: 'W  A  N  T  E  D',
        fontSize: 15,
        fontFamily: fontFamilyOf('latin'),
        letterSpacing: 6,
        align: 'center',
        fill: rust,
      }),
      createShape('line', {
        name: '标题分隔线',
        x: cx,
        y: 212,
        width: cw,
        height: 0,
        stroke: ink,
        strokeWidth: 2.4,
      }),
      createShape('line', {
        name: '标题副线',
        x: cx,
        y: 218,
        width: cw,
        height: 0,
        stroke: ink,
        strokeWidth: 0.8,
      }),

      createShape('rect', {
        name: '画像框',
        x: photoX,
        y: 236,
        width: photoW,
        height: photoH,
        fill: '#d8bf97',
        stroke: ink,
        strokeWidth: 2.4,
      }),
      createText({
        name: '画像占位说明',
        x: photoX,
        y: 366,
        width: photoW,
        text: '畫 影 圖 形\n\n（此處放置嫌疑人畫像或照片）',
        fontSize: 11,
        fontFamily: fontFamilyOf('sans'),
        lineHeight: 1.8,
        align: 'center',
        fill: '#6b5637',
      }),
      createText({
        name: '画像说明',
        x: cx,
        y: 546,
        width: cw,
        text: '右 圖 依 三 名 目 擊 者 口 述 摹 繪',
        fontSize: 9.2,
        fontFamily: fontFamilyOf('serif'),
        letterSpacing: 2,
        align: 'center',
        fill: '#5a4630',
      }),

      createText({
        name: '姓名',
        x: cx,
        y: 578,
        width: cw,
        text: '姓　名：柳 無 咎（自稱）',
        fontSize: 20,
        fontFamily: fontFamilyOf('serif'),
        fontStyle: 'bold',
        letterSpacing: 2,
        align: 'center',
        fill: ink,
      }),
      createText({
        name: '别号',
        x: cx,
        y: 612,
        width: cw,
        text: '別　號：灯下客 · 三步影',
        fontSize: 13,
        fontFamily: fontFamilyOf('kai'),
        letterSpacing: 1.4,
        align: 'center',
        fill: '#42341f',
      }),

      createText({
        name: '特征标题',
        x: cx,
        y: 656,
        width: cw,
        text: '體 貌 特 徵',
        fontSize: 12,
        fontFamily: fontFamilyOf('sans'),
        fontStyle: 'bold',
        letterSpacing: 4,
        align: 'left',
        fill: ink,
      }),
      createText({
        name: '体貌特征',
        x: cx,
        y: 682,
        width: cw,
        text:
          '· 年約三十，身形瘦長，左足微跛，行走時右肩略低。\n' +
          '· 常著灰藍長衫，袖口有燈油漬，腰懸一空鈴。\n' +
          '· 頸後有痣一枚，狀如小鈴；耳後有舊疤，不知其所由。\n' +
          '· 與人言時不視其目，只視其足。',
        fontSize: 12.4,
        fontFamily: fontFamilyOf('serif'),
        lineHeight: 1.95,
        align: 'left',
        fill: '#2b2318',
      }),

      createText({
        name: '事由标题',
        x: cx,
        y: 790,
        width: cw,
        text: '所 犯 事 由',
        fontSize: 12,
        fontFamily: fontFamilyOf('sans'),
        fontStyle: 'bold',
        letterSpacing: 4,
        align: 'left',
        fill: ink,
      }),
      createText({
        name: '事由正文',
        x: cx,
        y: 816,
        width: cw,
        text:
          '查得此人於霧港區燈市街一帶，以「留影」之術誘人入彀，取人形影而去，致十一人失影、三人失語。其所持銅鈴一枚，鈴舌已失，搖之無聲，置於燈下則自鳴。\n' +
          '凡見此人、或聞無聲之鈴者，切勿應答，勿與之對視，速報本司任一分局。',
        fontSize: 12.2,
        fontFamily: fontFamilyOf('serif'),
        lineHeight: 1.95,
        align: 'justify',
        fill: '#2b2318',
      }),

      createShape('line', {
        name: '赏格分隔线',
        x: cx,
        y: 916,
        width: cw,
        height: 0,
        stroke: ink,
        strokeWidth: 1.2,
      }),
      createText({
        name: '赏格',
        x: cx,
        y: 934,
        width: cw,
        text: '賞　銀　伍　拾　兩',
        fontSize: 34,
        fontFamily: fontFamilyOf('serif'),
        fontStyle: 'bold',
        letterSpacing: 8,
        align: 'center',
        fill: rust,
      }),
      createText({
        name: '赏格附注',
        x: cx,
        y: 986,
        width: cw,
        text: '知 情 密 報 者 同 賞 　·　 生 擒 者 加 倍',
        fontSize: 9.6,
        fontFamily: fontFamilyOf('serif'),
        letterSpacing: 2.4,
        align: 'center',
        fill: '#5a4630',
      }),

      createText({
        name: '落款',
        x: cx,
        y: 1016,
        width: 300,
        text: '緝捕司 第三組\n昭和十七年 三月 廿七日\n（此令懸掛期滿即焚）',
        fontSize: 10,
        fontFamily: fontFamilyOf('serif'),
        lineHeight: 1.9,
        align: 'left',
        fill: '#4a3a24',
      }),
      createShape('seal', {
        name: '緝捕司印',
        x: W - 194,
        y: 962,
        width: 112,
        height: 112,
        stroke: rust,
        fill: 'transparent',
        strokeWidth: 4,
        rotation: -6,
        opacity: 0.82,
        text: '緝捕司印',
        textColor: rust,
        fontSize: 19,
      }),
    )

    return doc
  },
}
