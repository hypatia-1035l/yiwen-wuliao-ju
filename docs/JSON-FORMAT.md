# 项目 JSON 格式说明

扩展名建议 `.ywmj.json`，UTF-8 编码。文件自包含：图片以 base64 dataURL 内嵌，换机器打开不缺资源。

## 顶层结构

```jsonc
{
  "schemaVersion": 1,          // 必需。当前为 1；高于此版本的文件会被拒绝导入
  "app": "yiwen-wuliao-ju",    // 来源标记，仅作提示
  "id": "proj_xxx",            // 项目 id（导入时会重新生成，避免覆盖本地同名项目）
  "name": "委托书 · 雾港灯影",
  "createdAt": 1790000000000,  // 毫秒时间戳
  "updatedAt": 1790000000000,
  "templateId": "commission",  // 创建时的模板，仅作记录
  "page": { ... },             // 页面设置，见下
  "assets": [ ... ],           // 图片资源池
  "elements": [ ... ]          // 元素数组；数组顺序即图层顺序，索引 0 在最底层
}
```

## page

```jsonc
{
  "size": "A4",              // "A4" | "A5" | "A6"，非法值回落 A4
  "orientation": "portrait", // "portrait" | "landscape"
  "color": "#f3ead6",        // 纸张底色（#hex / rgb() / transparent）
  "background": "paper",     // "color" 无纹理；"paper" 程序生成纸纹
  "texture": 0.45,           // 纹理强度 0–1
  "margin": 42               // 安全边距参考线（px @96dpi），不参与裁切
}
```

坐标系统一为 **CSS px @96dpi**（96px = 25.4mm）。A4 纵向 = 793.7 × 1122.5px。
字体大小同样以 px 存储，与 pt 的换算：`pt = px × 0.75`。

## assets[i]

```jsonc
{
  "id": "asset_xxx",          // 元素通过 assetId 引用
  "name": "照片.png",
  "mime": "image/png",
  "dataUrl": "data:image/png;base64,...",  // 仅接受位图：png/jpeg/webp/gif/bmp/avif
  "width": 1800,              // 导入时最长边已压到 1800px
  "height": 1200,
  "createdAt": 1790000000000
}
```

SVG 会被校验层拒绝（可能携带脚本）。

## elements[i]

公共字段（三种元素都有）：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 稳定 id，终身不变 |
| `type` | string | `"text"` \| `"image"` \| `"shape"`，未知类型导入时丢弃并告警 |
| `name` | string | 图层名 |
| `x` / `y` | number | 未旋转时的左上角坐标 |
| `width` / `height` | number | 尺寸（text 高度自适应时仅为测量缓存） |
| `rotation` | number | 顺时针角度，绕元素中心 |
| `opacity` | number | 0–1 |
| `visible` / `locked` | boolean | |

**text** 附加：`text`、`fontSize`、`fontFamily`（字体栈字符串）、`fontStyle`（normal/bold/italic/bold italic）、`align`（left/center/right/justify）、`verticalAlign`、`lineHeight`、`letterSpacing`、`fill`、`autoHeight`、`padding`。

**image** 附加：`assetId`（必须指向 assets 中存在的资源，否则该元素被丢弃）、`fit`（cover=等比裁切填满 / fill=拉伸）、`tone`（none/gray/sepia/blueprint，导出与预览使用同一预处理管线）、`cornerRadius`、`stroke`、`strokeWidth`。

**shape** 附加：`shape`（rect/ellipse/line/frame/seal）、`fill`、`stroke`、`strokeWidth`、`cornerRadius`、`dash`（如 `[7,5]`）；`seal` 另有 `text`、`textColor`、`fontSize`（印章文字自动排成两行居中）。

## 校验行为（导入时）

1. `schemaVersion` 缺失、非整数或**大于**当前支持版本 → 拒绝导入，现有项目不受影响；
2. 数值字段出现 NaN / Infinity / 字符串 → 回落默认值并夹紧范围（如尺寸 1–20000、透明度 0–1）；
3. 颜色只接受 `#hex`、`rgb()/rgba()`、`transparent`，其余回落；
4. 引用不存在资源的图片元素被丢弃，并在警告中说明；
5. 元素上限 2000、资源上限 200、单图 dataURL 上限 24MB，超限部分忽略；
6. 一切异常都以「丢弃或回落」处理，不会抛出异常，也不会让半成品进入编辑状态。

迁移：0.1 只有 v1。未来若引入 v2，将在读取 v1 文件时自动补齐新字段并升级 `schemaVersion`，导入完成后的提示会注明 `migratedFrom`。
