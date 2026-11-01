# 依赖与许可证清单

生成日期：2026-11-01，锁定版本见 `package.json` 与 `package-lock.json`。

## 运行时依赖（dependencies）

| 包 | 版本 | 许可证 | 用途 | 维护状态 |
| --- | --- | --- | --- | --- |
| vue | 3.5.44 | MIT | 界面框架 | 官方活跃维护 |
| konva | 10.9.1 | MIT | 2D 画布引擎（场景图、变换、拖拽、缩放、导出） | 官方活跃维护（10.x） |
| jspdf | 4.2.1 | MIT | PDF 生成（页面毫米尺寸、位图嵌入） | 官方活跃维护 |

> Konva 与 jsPDF 均为纯前端库，不发起网络请求、不含遥测。jsPDF 的 html2canvas / dompurify 为其可选动态依赖，构建时被拆分为独立 chunk，仅在实际调用相应功能时加载。

## 开发依赖（devDependencies）

| 包 | 版本 | 许可证 | 用途 |
| --- | --- | --- | --- |
| vite | 7.3.7 | MIT | 构建 / dev server |
| @vitejs/plugin-vue | 6.0.10 | MIT | Vue 3 SFC 支持 |
| typescript | 5.9.3 | Apache-2.0 | 类型系统 |
| vue-tsc | 3.3.14 | MIT | .vue 类型检查 |
| vitest | 3.2.7 | MIT | 单元测试 |
| @types/node | 22.x | MIT | vite.config 的 node 类型 |
| playwright-core | latest | Apache-2.0 | E2E 验收（复用本机 Edge，不下载浏览器） |

## 传递依赖的合规说明

- 全部依赖许可证为 **MIT 或 Apache-2.0**，均允许商业使用、修改与再分发，无 copyleft 传染条款；
- 未引入任何需要密钥 / 付费 / 账号的 SDK；
- 未引入 UI 组件库或状态管理库——界面用原生 CSS 变量体系手写，状态用一个 Vue reactive 单例，保持轻量。

## 复查命令

```bash
npx license-checker --production --summary   # 需要时临时 npx，不作为固定依赖
```
