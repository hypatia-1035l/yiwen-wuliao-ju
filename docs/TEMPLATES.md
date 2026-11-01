# 模板扩展说明

模板是「一段会返回项目文档的代码」。编辑器其余部分对模板零感知，因此加模板不需要动任何现有代码。

## 1. 定义模板

新建 `src/data/templates/my-template.ts`：

```ts
import { createShape, createText } from '@/core/factory'
import { fontFamilyOf } from '@/core/fonts'
import type { TemplateDef } from './types'
import { add, makeProject } from './util'

export const myTemplate: TemplateDef = {
  id: 'my-template',          // 全局唯一，建议与文件名一致
  name: '入场券',              // 左侧列表标题
  category: '文书',
  blurb: '一句话说明',
  accent: '#8a6a3a',          // 列表强调色
  size: 'A6',                 // A4 | A5 | A6
  build() {
    // makeProject 生成空文档并返回纸面像素尺寸（W/H 随纸型自动变化）
    const { doc, W, H } = makeProject({
      templateId: 'my-template',
      name: '入场券',
      size: 'A6',
      page: { color: '#f3ead6', texture: 0.5, margin: 30 },
    })

    add(
      doc,
      createShape('frame', {
        name: '边框',
        x: 16, y: 16,
        width: W - 32, height: H - 32,
        stroke: '#7a5a30', strokeWidth: 2,
      }),
      createText({
        name: '主标题',
        x: W * 0.1, y: H * 0.08,
        width: W * 0.8,
        text: '入 场 券',
        fontSize: 26,
        fontFamily: fontFamilyOf('kai'),
        align: 'center',
      }),
      // …更多元素
    )
    return doc
  },
}
```

## 2. 注册

在 `src/data/templates/index.ts` 的 `TEMPLATES` 数组中加入即可，左栏「模板」页会自动出现卡片。

## 3. 约定与自检

- **坐标尽量从 W / H 推导**，不要全部写死像素——这样同一模板在 A4 与 A6 上都成立；
- 正文段落之间预留足够行距：文字块高度随内容自适应（`autoHeight: true`），后续加字会向下生长，**不会自动推开下方元素**；
- `build()` 每次调用都要产生全新 id（用 `makeProject` + `create*` 工厂即可，它们内部调 `newId`），不要缓存文档对象；
- 产出的文档必须能通过 `validateProject`——`tests/templates.test.ts` 已为每个注册模板自动断言结构、有限数值、id 唯一、可校验往返，新增模板无需另写测试即被覆盖；
- 若模板需要图片，把资源加入 `doc.assets`（dataURL），元素用 `createImage(assetId, …)` 引用；未引用的资源会在保存时被清理。

## 4. 可用工厂速查

| 工厂 | 用途 |
| --- | --- |
| `createText(init)` | 文字块；`init` 可覆盖任意字段 |
| `createShape(kind, init)` | `rect` / `ellipse` / `line` / `frame` / `seal` |
| `createImage(assetId, init)` | 图片元素（引用资源池） |
| `makeProject(opts)` | 建项目骨架，返回 `{ doc, W, H }` |
| `add(doc, ...els)` | 按图层顺序压入元素 |

字体用 `fontFamilyOf('serif' | 'kai' | 'fangsong' | 'sans' | 'mono' | 'latin')` 取字体栈；这些都是系统字体，导出 PNG/PDF 时无需等待网络字体，也不会缺字。
