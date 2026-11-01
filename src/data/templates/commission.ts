import { createShape, createText } from '@/core/factory'
import { fontFamilyOf } from '@/core/fonts'
import { PALETTE } from '@/core/palette'
import type { TemplateDef } from './types'
import { add, makeProject } from './util'

/**
 * 模板一：委托书 / 信件（A5 纵向）
 * 版式：双线框 + 居中标题 + 三段正文 + 条款 + 签署区 + 骑缝印
 */
export const commissionTemplate: TemplateDef = {
  id: 'commission',
  name: '委托书 / 信件',
  category: '文书',
  blurb: '双线框公文体，适合开局委托、任务简报',
  accent: '#8a6a3a',
  size: 'A5',
  build() {
    const { doc, W, H } = makeProject({
      templateId: 'commission',
      name: '委托书 · 雾港灯影',
      size: 'A5',
      page: { color: '#f3ead6', texture: 0.45, margin: 44 },
    })

    const outer = 25
    const inner = 32
    const cx = 66
    const cw = W - cx * 2

    add(
      doc,
      createShape('frame', {
        name: '外框',
        x: outer,
        y: outer,
        width: W - outer * 2,
        height: H - outer * 2,
        stroke: '#7a5a30',
        strokeWidth: 2.2,
      }),
      createShape('frame', {
        name: '内框',
        x: inner,
        y: inner,
        width: W - inner * 2,
        height: H - inner * 2,
        stroke: '#7a5a30',
        strokeWidth: 0.7,
        opacity: 0.85,
      }),

      createText({
        name: '机构名',
        x: cx,
        y: 54,
        width: cw,
        text: '異 聞 物 料 局 · 委 任 司',
        fontSize: 10,
        fontFamily: fontFamilyOf('serif'),
        letterSpacing: 3.2,
        align: 'center',
        fill: '#6b543a',
      }),
      createShape('line', {
        name: '页眉横线',
        x: cx,
        y: 74,
        width: cw,
        height: 0,
        stroke: '#7a5a30',
        strokeWidth: 1,
      }),
      createShape('line', {
        name: '页眉细线',
        x: cx,
        y: 77.5,
        width: cw,
        height: 0,
        stroke: '#7a5a30',
        strokeWidth: 0.6,
        opacity: 0.7,
      }),

      createText({
        name: '主标题',
        x: cx,
        y: 96,
        width: cw,
        text: '委  托  书',
        fontSize: 34,
        fontFamily: fontFamilyOf('kai'),
        fontStyle: 'bold',
        letterSpacing: 6,
        align: 'center',
        fill: '#2b2318',
      }),
      createText({
        name: '副标题',
        x: cx,
        y: 150,
        width: cw,
        text: 'COMMISSION OF INQUIRY',
        fontSize: 8,
        fontFamily: fontFamilyOf('latin'),
        letterSpacing: 2.6,
        align: 'center',
        fill: '#8a7050',
      }),
      createText({
        name: '档案编号',
        x: cx,
        y: 176,
        width: cw,
        text: '檔案編號：YW-Ⅲ-0427-乙        密級：丙',
        fontSize: 9.5,
        fontFamily: fontFamilyOf('mono'),
        align: 'left',
        fill: '#5a4630',
      }),
      createShape('line', {
        name: '标题分隔线',
        x: cx,
        y: 198,
        width: cw,
        height: 0,
        stroke: '#7a5a30',
        strokeWidth: 0.8,
        dash: [5, 4],
      }),

      createText({
        name: '正文 一',
        x: cx,
        y: 216,
        width: cw,
        text: '兹有本局第三调查组所辖「雾港区」，近三月内连报七起「夜间灯影自移」之事。居民称子时前后，见街灯之下有影无形，行迹不循常理，且伴有铜铃之声。',
        fontSize: 12.2,
        fontFamily: fontFamilyOf('serif'),
        lineHeight: 1.95,
        align: 'justify',
        fill: PALETTE.ink,
      }),
      createText({
        name: '正文 二',
        x: cx,
        y: 300,
        width: cw,
        text: '本局已遣员往查，然查访者三人：一人失语，一人失踪，一人归来后坚称「未曾出门」。事涉非常，非寻常衙役所能了。',
        fontSize: 12.2,
        fontFamily: fontFamilyOf('serif'),
        lineHeight: 1.95,
        align: 'justify',
        fill: PALETTE.ink,
      }),
      createText({
        name: '正文 三',
        x: cx,
        y: 382,
        width: cw,
        text: '故特具此书，委请阁下前往雾港区，查明灯影之属，录其形貌，寻其根源。若有需索，可持此书至本局各分局支取盘缠与器物。',
        fontSize: 12.2,
        fontFamily: fontFamilyOf('serif'),
        lineHeight: 1.95,
        align: 'justify',
        fill: PALETTE.ink,
      }),

      createText({
        name: '条款标题',
        x: cx,
        y: 468,
        width: cw,
        text: '附 记 诸 条',
        fontSize: 10.5,
        fontFamily: fontFamilyOf('serif'),
        fontStyle: 'bold',
        letterSpacing: 3,
        align: 'left',
        fill: '#4a3a26',
      }),
      createText({
        name: '条款正文',
        x: cx,
        y: 492,
        width: cw,
        text:
          '一、受托者须于十五日内呈交《见闻录》一册，附图不少于三帧。\n' +
          '二、凡涉「灯影」之物，勿以常理度之；见之勿直视过三息。\n' +
          '三、受托者可自行择伴，然同伴之名须具于文末，以备考功。\n' +
          '四、此书一经签署，即视为知悉上述诸条，不得以「未曾细看」为辞。',
        fontSize: 9.4,
        fontFamily: fontFamilyOf('serif'),
        lineHeight: 2.05,
        align: 'left',
        fill: '#4a3a26',
      }),

      createShape('line', {
        name: '签署分隔线',
        x: cx,
        y: 592,
        width: cw,
        height: 0,
        stroke: '#7a5a30',
        strokeWidth: 0.6,
        dash: [3, 3],
      }),

      createText({
        name: '签署区',
        x: cx,
        y: 612,
        width: 290,
        text: '委托人：____________________（签押）\n见证人：____________________\n日　期：昭和 □□ 年 □□ 月 □□ 日',
        fontSize: 11,
        fontFamily: fontFamilyOf('kai'),
        lineHeight: 2.3,
        align: 'left',
        fill: '#3d342a',
      }),
      createText({
        name: '签发单位',
        x: cx,
        y: 712,
        width: cw,
        text: '签发：异闻物料局 委任司 · 第三档案室',
        fontSize: 9,
        fontFamily: fontFamilyOf('serif'),
        letterSpacing: 1.2,
        align: 'left',
        fill: '#6b543a',
      }),

      createShape('seal', {
        name: '委任司印',
        x: W - 196,
        y: 596,
        width: 96,
        height: 96,
        stroke: PALETTE.rust,
        fill: 'transparent',
        strokeWidth: 3,
        rotation: -8,
        opacity: 0.86,
        text: '委任司印',
        textColor: PALETTE.rust,
        fontSize: 17,
      }),
    )

    return doc
  },
}
