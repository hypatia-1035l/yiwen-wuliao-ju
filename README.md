# 异闻物料局

本地优先的 TRPG / 原创角色（OC）物料编辑器。选模板 → 改内容 → 排版 → 存档 → 导出 PNG / PDF。

> 0.1 MVP 范围：跑团道具生成器。不做账号、不做云同步、不上传任何数据——所有内容只存在你自己的浏览器和导出文件里。

## 运行

**日常使用（不想装 Node）**：双击项目根目录的 **`异闻物料局.html`** 即可——单文件版，所有代码已内联，`file://` 直开可用（IndexedDB、自动保存、刷新恢复均实测正常）。重新生成：`npm run build:standalone`。

**开发 / 频繁使用**：双击 **`启动编辑器.bat`**（起本地服务并自动开浏览器），或：

```bash
npm install        # 安装依赖（默认走 npmmirror 镜像，见 .npmrc）
npm run dev        # 开发：http://127.0.0.1:5180
npm run build      # 类型检查 + 产出 dist/
npm run preview    # 预览构建产物
npm run test       # 单元测试（vitest，38 例）
node scripts/e2e.mjs   # 端到端验收（需先启动 dev，另见 docs/TEST-REPORT.md）
```

> ⚠️ 不要直接双击 `index.html` 或 `dist/index.html`——前者是 TypeScript 源码入口，后者是 ES module 构建，双击以 `file://` 打开时模块脚本会被浏览器 CORS 拦截，表现为整页全黑。双击请用 `异闻物料局.html`。

要求：Node ≥ 20.19（开发时使用 22.x）。无需数据库、无需后端。

## 功能一览（0.1 已实现）

| 模块 | 内容 |
| --- | --- |
| 模板 ×4 | 委托书 / 信件（A5）、调查档案（A4）、通缉令 / 公告（A4）、日记 / 线索（A5），全部可编辑 |
| 编辑 | 文字（字体 / 字号 / 字重 / 行高 / 字距 / 对齐 / 颜色）、本地图片（裁切 / 色调 / 圆角 / 描边）、图形（矩形 / 椭圆 / 线条 / 边框 / 印章） |
| 画布 | 缩放（滚轮 / 捏合 / 按钮）、平移（拖空白）、安全区与网格参考线 |
| 图层 | 列表、显隐、锁定、上移 / 下移 / 置顶 / 置底 |
| 历史 | 撤销 / 重做（90 步，连续输入自动合并为一步） |
| 保存 | IndexedDB 自动保存（防抖 700ms）、项目列表、刷新后恢复上次编辑 |
| 文件 | 项目 JSON 导出 / 导入（自包含图片，导入时做结构与版本校验） |
| 导出 | PNG（150/300/600 dpi，按目标 dpi 重新排版渲染）＋ PDF（A4/A5/A6，毫米级页面尺寸，横竖向） |
| 响应式 | 桌面三栏；窄屏（≤860px）左右栏变抽屉，可完成选模板、加文字 / 图片、改属性 |

纸张基准：文档内部一律使用 CSS px @96dpi；A4/A5/A6 的毫米尺寸只在导出时参与换算，因此 PDF 页面物理尺寸是准确的（实测 A4 = 210.0×297.0mm）。

## 目录结构

```
src/
  types/project.ts      项目文档数据模型（纯 JSON，schemaVersion）
  core/                 纯逻辑：纸张换算 / id / 工厂 / 历史 / 校验 / 越界体检 / 图片导入
  data/templates/       四个模板（新增模板见 docs/TEMPLATES.md）
  render/renderer.ts    Konva 渲染层（文档 → 画布，唯一碰 Konva 的地方）
  store/editor.ts       编辑状态与所有变更动作（Vue reactive 单例）
  persistence/db.ts     IndexedDB（projects / index / meta 三个 store）
  export/               JSON / PNG / PDF 导出
  components/           界面（顶栏 / 左栏四页签 / 画布 / 右侧属性 / 导出对话框）
tests/                  vitest 单元测试
scripts/e2e.mjs         端到端验收（playwright-core + 本机 Edge）
```

分层约束：`types` 与 `core` 不依赖 Vue 与 Konva；`render` 只读文档；`store` 是唯一可变文档的地方。这保证文档结构可以被完整序列化、校验和迁移。

## 文档

- [项目 JSON 格式说明](docs/JSON-FORMAT.md)
- [模板扩展说明](docs/TEMPLATES.md)
- [测试结果（单元 + 端到端实测）](docs/TEST-REPORT.md)
- [已知问题](docs/KNOWN-ISSUES.md)
- [依赖与许可证清单](LICENSES.md)

## 隐私与安全约定

- 图片导入在浏览器本地完成，以 dataURL 形式内嵌进项目文件，全程无网络请求；
- 项目 JSON 只接受位图 dataURL，刻意拒绝 `image/svg+xml`（SVG 可携带脚本），拒绝 `javascript:` 伪协议；
- 导入文件版本高于当前支持版本时会拒绝导入并提示，不会半截进入编辑状态破坏现有项目；
- IndexedDB 数据可随时通过「项目」页签删除，或在浏览器站点数据里整站清除。
