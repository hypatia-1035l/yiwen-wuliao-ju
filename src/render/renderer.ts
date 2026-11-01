import Konva from 'konva'
import { pageSizePx } from '@/core/paper'
import type {
  AssetDoc,
  ElementDoc,
  ImageElement,
  ProjectDoc,
  ShapeElement,
  TextElement,
  ViewState,
} from '@/types/project'

export interface RendererCallbacks {
  onSelect: (id: string | null, additive: boolean) => void
  onDragEnd: (id: string, x: number, y: number) => void
  onTransformEnd: (id: string, patch: { x: number; y: number; width: number; height: number }) => void
  onDoubleClick: (id: string) => void
  onPan: (dx: number, dy: number) => void
}

const PAPER_PAD = 48

/**
 * 画布渲染器：把 ProjectDoc 渲染为 Konva 场景。
 *
 * 关键实现约定
 * - stage 尺寸 = 视口容器尺寸；文档纸张放在 `world` 组里，由 world 的 scale/position 承担缩放与平移。
 *   导出时临时把 world 放大到目标 DPI、位置归零、stage 尺寸设为纸张像素尺寸，
 *   于是文字与矢量图形由 Konva 重新绘制，而不是把屏幕预览图拉伸放大。
 * - 每个元素渲染成一个 Konva.Group，group 的 offset 设为其宽高的一半，
 *   因此文档中的 (x, y) 始终是元素「左上角」，旋转则围绕元素中心，符合直觉。
 * - 元素数据变化时整体重建该元素节点（元素量级在百以内，简单可靠胜过细粒度 diff）。
 */
export class CanvasRenderer {
  private stage: Konva.Stage
  private world: Konva.Group
  private paperLayer: Konva.Group
  private contentLayer: Konva.Group
  private overlay: Konva.Group
  private transformer: Konva.Transformer
  private nodeMap = new Map<string, Konva.Node>()
  private imageCache = new Map<string, CanvasImageSource>()
  private loading = new Set<string>()
  private assets = new Map<string, AssetDoc>()
  private doc: ProjectDoc | null = null
  private view: ViewState | null = null
  private overlayKey = ''
  private paperKey = ''
  private panMoved = false
  private destroyed = false

  constructor(
    container: HTMLDivElement,
    private cb: RendererCallbacks,
  ) {
    this.stage = new Konva.Stage({
      container,
      width: container.clientWidth || 300,
      height: container.clientHeight || 300,
    })
    const layer = new Konva.Layer({ listening: true })
    this.world = new Konva.Group()
    this.paperLayer = new Konva.Group({ listening: false })
    this.contentLayer = new Konva.Group()
    this.overlay = new Konva.Group()
    // overlay 必须放在 world 内：选中框 / 参考线要跟随缩放与平移
    this.world.add(this.paperLayer, this.contentLayer, this.overlay)
    layer.add(this.world)
    this.stage.add(layer)

    this.transformer = new Konva.Transformer({
      rotateEnabled: true,
      borderStroke: '#c99a51',
      borderStrokeWidth: 1.5,
      anchorStroke: '#c99a51',
      anchorFill: '#1b1712',
      anchorSize: 9,
      anchorCornerRadius: 2,
      rotateAnchorOffset: 26,
      ignoreStroke: true,
      padding: 2,
      enabledAnchors: [
        'top-left',
        'top-right',
        'bottom-left',
        'bottom-right',
        'middle-left',
        'middle-right',
        'top-center',
        'bottom-center',
      ],
      boundBoxFunc: (oldBox, newBox) => {
        if (newBox.width < 4) return oldBox
        return newBox
      },
    })
    this.overlay.add(this.transformer)

    this.stage.on('click tap', this.handleStagePointer)
    this.stage.on('dblclick dbltap', this.handleDoubleClick)
    this.stage.on('pointerdown', this.handlePointerDown)
  }

  destroy(): void {
    this.destroyed = true
    this.stage.off('click tap', this.handleStagePointer)
    this.stage.off('dblclick dbltap', this.handleDoubleClick)
    this.stage.destroy()
    this.nodeMap.clear()
    this.imageCache.clear()
  }

  resize(width: number, height: number): void {
    this.stage.size({ width: Math.max(80, width), height: Math.max(80, height) })
    this.applyView()
  }

  /** 计算「适应视口」的缩放值 */
  fitScale(): number {
    if (!this.doc) return 1
    const { width: W, height: H } = pageSizePx(this.doc.page)
    const cw = this.stage.width() - PAPER_PAD * 2
    const ch = this.stage.height() - PAPER_PAD * 2
    return Math.min(cw / W, ch / H, 2)
  }

  pagePixelSize(): { width: number; height: number } {
    if (!this.doc) return { width: 0, height: 0 }
    return pageSizePx(this.doc.page)
  }

  setDoc(doc: ProjectDoc): void {
    if (this.destroyed) return
    this.doc = doc
    this.assets = new Map(doc.assets.map((a) => [a.id, a]))
    this.renderPaper(doc)
    this.renderElements(doc)
    this.applyView()
  }

  setView(view: ViewState): void {
    this.view = view
    this.applyView()
    this.applySelection(view)
  }

  /* ------------------------------- 纸张背景 ------------------------------- */

  private renderPaper(doc: ProjectDoc): void {
    const { width: W, height: H } = pageSizePx(doc.page)
    const key = `${doc.page.color}|${doc.page.background}|${doc.page.texture}|${W}x${H}`
    if (this.paperKey === key) return
    this.paperKey = key
    this.paperLayer.destroyChildren()

    this.paperLayer.add(
      new Konva.Rect({
        x: 0,
        y: 0,
        width: W,
        height: H,
        fill: doc.page.color,
        listening: false,
      }),
    )

    if (doc.page.background === 'paper' && doc.page.texture > 0) {
      const tile = this.noiseTile(doc.page.color)
      this.paperLayer.add(
        new Konva.Rect({
          x: 0,
          y: 0,
          width: W,
          height: H,
          fillPatternImage: tile as unknown as HTMLImageElement,
          fillPatternRepeat: 'repeat',
          opacity: Math.min(0.55, doc.page.texture * 0.7),
          listening: false,
        }),
      )
      this.paperLayer.add(
        new Konva.Rect({
          x: 0,
          y: 0,
          width: W,
          height: H,
          fillRadialGradientStartPoint: { x: W / 2, y: H / 2 },
          fillRadialGradientStartRadius: Math.min(W, H) * 0.18,
          fillRadialGradientEndPoint: { x: W / 2, y: H / 2 },
          fillRadialGradientEndRadius: Math.max(W, H) * 0.78,
          fillRadialGradientColorStops: [0, 'rgba(0,0,0,0)', 1, 'rgba(60,40,20,0.30)'],
          opacity: doc.page.texture * 0.75,
          listening: false,
        }),
      )
    }

    // 纸张投影，仅用于屏幕观感；导出时移除
    this.paperLayer.add(
      new Konva.Rect({
        x: 0,
        y: 0,
        width: W,
        height: H,
        stroke: 'rgba(0,0,0,0.55)',
        strokeWidth: 1,
        shadowColor: 'black',
        shadowBlur: 24,
        shadowOpacity: 0.45,
        shadowOffsetY: 6,
        listening: false,
        name: 'paper-shadow',
      }),
    )
  }

  private noiseTile(baseColor: string): HTMLCanvasElement {
    const key = baseColor
    const cached = noiseCache.get(key)
    if (cached) return cached

    const size = 160
    const c = document.createElement('canvas')
    c.width = size
    c.height = size
    const ctx = c.getContext('2d')
    if (ctx) {
      const img = ctx.createImageData(size, size)
      for (let i = 0; i < size * size; i++) {
        const v = Math.random()
        const dark = v < 0.5
        const alpha = Math.random() * 46
        img.data[i * 4] = dark ? 80 : 255
        img.data[i * 4 + 1] = dark ? 66 : 250
        img.data[i * 4 + 2] = dark ? 46 : 238
        img.data[i * 4 + 3] = alpha
      }
      ctx.putImageData(img, 0, 0)
      // 少量纤维
      ctx.strokeStyle = 'rgba(90,72,48,0.16)'
      ctx.lineWidth = 1
      for (let i = 0; i < 14; i++) {
        ctx.beginPath()
        const x = Math.random() * size
        const y = Math.random() * size
        ctx.moveTo(x, y)
        ctx.lineTo(x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 10)
        ctx.stroke()
      }
    }
    noiseCache.set(key, c)
    return c
  }

  /* ------------------------------- 元素 ------------------------------- */

  private renderElements(doc: ProjectDoc): void {
    const alive = new Set<string>()
    for (const el of doc.elements) {
      alive.add(el.id)
      const sig = JSON.stringify(el)
      const existing = this.nodeMap.get(el.id)
      if (existing && existing.getAttr('sig') === sig) {
        this.contentLayer.add(existing as Konva.Group)
        continue
      }
      existing?.destroy()
      const node = this.buildNode(el)
      node.setAttr('sig', sig)
      node.setAttr('dataId', el.id)
      this.nodeMap.set(el.id, node)
      this.contentLayer.add(node)
    }
    for (const [id, node] of [...this.nodeMap]) {
      if (!alive.has(id)) {
        node.destroy()
        this.nodeMap.delete(id)
      }
    }
  }

  private buildNode(el: ElementDoc): Konva.Group {
    const group = new Konva.Group({
      x: el.x + el.width / 2,
      y: el.y + el.height / 2,
      offsetX: el.width / 2,
      offsetY: el.height / 2,
      rotation: el.rotation,
      opacity: el.opacity,
      visible: el.visible,
      draggable: !el.locked,
    })
    group.setAttr('baseW', el.width)
    group.setAttr('baseH', el.height)

    if (el.type === 'text') this.buildText(group, el)
    else if (el.type === 'image') this.buildImage(group, el)
    else this.buildShape(group, el)

    this.bindEvents(group, el)
    return group
  }

  private buildText(group: Konva.Group, el: TextElement): void {
    const innerW = Math.max(4, el.width - el.padding * 2)
    const text = new Konva.Text({
      x: el.padding,
      y: 0,
      width: innerW,
      text: el.text,
      fontSize: el.fontSize,
      fontFamily: el.fontFamily,
      fontStyle: el.fontStyle,
      align: el.align,
      verticalAlign: el.verticalAlign,
      lineHeight: el.lineHeight,
      letterSpacing: el.letterSpacing,
      fill: el.fill,
      wrap: 'word',
      listening: true,
      perfectDrawEnabled: false,
    })
    if (!el.autoHeight) text.height(el.height)
    group.add(text)

    const measured = text.height()
    if (el.autoHeight) {
      group.height(measured)
      group.offsetY(measured / 2)
      group.y(el.y + measured / 2)
      group.setAttr('baseH', measured)
    }
  }

  private buildShape(group: Konva.Group, el: ShapeElement): void {
    const w = el.width
    const h = el.height
    if (el.shape === 'line') {
      group.add(
        new Konva.Line({
          points: [0, 0, w, h],
          stroke: el.stroke,
          strokeWidth: el.strokeWidth,
          dash: el.dash,
          lineCap: 'round',
          hitStrokeWidth: 16,
        }),
      )
      return
    }
    if (el.shape === 'ellipse') {
      group.add(
        new Konva.Ellipse({
          x: w / 2,
          y: h / 2,
          radiusX: w / 2,
          radiusY: h / 2,
          fill: el.fill,
          stroke: el.strokeWidth > 0 ? el.stroke : undefined,
          strokeWidth: el.strokeWidth,
        }),
      )
      return
    }
    if (el.shape === 'frame') {
      group.add(
        new Konva.Rect({
          x: 0,
          y: 0,
          width: w,
          height: h,
          stroke: el.stroke,
          strokeWidth: el.strokeWidth,
          fill: el.fill === 'transparent' ? undefined : el.fill,
        }),
      )
      const inset = Math.max(3, el.strokeWidth * 2.4)
      if (w > inset * 4 && h > inset * 4) {
        group.add(
          new Konva.Rect({
            x: inset,
            y: inset,
            width: w - inset * 2,
            height: h - inset * 2,
            stroke: el.stroke,
            strokeWidth: Math.max(0.5, el.strokeWidth * 0.28),
            opacity: 0.8,
          }),
        )
      }
      return
    }
    if (el.shape === 'seal') {
      const r = Math.min(w, h) / 2 - el.strokeWidth / 2
      group.add(
        new Konva.Circle({
          x: w / 2,
          y: h / 2,
          radius: Math.max(2, r),
          stroke: el.stroke,
          strokeWidth: el.strokeWidth,
          fill: el.fill === 'transparent' ? undefined : el.fill,
        }),
      )
      const label = (el.text ?? '印').replace(/\s/g, '')
      const chars = label.slice(0, 8)
      const perLine = Math.ceil(chars.length / 2) || 1
      const lines: string[] = []
      for (let i = 0; i < chars.length; i += perLine) lines.push(chars.slice(i, i + perLine))
      group.add(
        new Konva.Text({
          x: 0,
          y: 0,
          width: w,
          height: h,
          text: lines.join('\n'),
          fontSize: el.fontSize ?? Math.max(9, w * 0.19),
          fontFamily: '"Songti SC", "SimSun", "STSong", serif',
          fontStyle: 'bold',
          align: 'center',
          verticalAlign: 'middle',
          lineHeight: 1.25,
          letterSpacing: 1,
          fill: el.textColor ?? el.stroke,
          listening: false,
        }),
      )
      return
    }
    group.add(
      new Konva.Rect({
        x: 0,
        y: 0,
        width: w,
        height: h,
        fill: el.fill === 'transparent' ? undefined : el.fill,
        stroke: el.strokeWidth > 0 ? el.stroke : undefined,
        strokeWidth: el.strokeWidth,
        cornerRadius: el.cornerRadius,
        dash: el.dash,
      }),
    )
  }

  private buildImage(group: Konva.Group, el: ImageElement): void {
    const asset = this.assets.get(el.assetId)
    const key = `${el.assetId}#${el.tone}`
    const src = this.imageCache.get(key)

    if (!asset || !src) {
      group.add(
        new Konva.Rect({
          x: 0,
          y: 0,
          width: el.width,
          height: el.height,
          fill: 'rgba(120,110,96,0.16)',
          stroke: 'rgba(120,110,96,0.5)',
          strokeWidth: 1,
          dash: [6, 4],
        }),
      )
      group.add(
        new Konva.Text({
          x: 0,
          y: el.height / 2 - 8,
          width: el.width,
          text: asset ? '正在载入图片…' : '图片资源缺失',
          fontSize: Math.min(13, el.width / 8),
          fontFamily: 'sans-serif',
          align: 'center',
          fill: 'rgba(90,80,66,0.8)',
          listening: false,
        }),
      )
      if (asset) this.ensureAsset(asset, el.tone)
      return
    }

    const natW = asset.width || 1
    const natH = asset.height || 1
    let crop: { x: number; y: number; width: number; height: number } | undefined
    if (el.fit === 'cover') {
      const boxRatio = el.width / el.height
      const natRatio = natW / natH
      if (natRatio > boxRatio) {
        const cw = natH * boxRatio
        crop = { x: (natW - cw) / 2, y: 0, width: cw, height: natH }
      } else {
        const ch = natW / boxRatio
        crop = { x: 0, y: (natH - ch) / 2, width: natW, height: ch }
      }
    }

    group.add(
      new Konva.Image({
        x: 0,
        y: 0,
        width: el.width,
        height: el.height,
        image: src as HTMLImageElement,
        crop,
        cornerRadius: el.cornerRadius,
        stroke: el.strokeWidth > 0 ? el.stroke : undefined,
        strokeWidth: el.strokeWidth,
        listening: true,
        perfectDrawEnabled: false,
      }),
    )
  }

  private ensureAsset(asset: AssetDoc, tone: string): void {
    const key = `${asset.id}#${tone}`
    if (this.imageCache.has(key) || this.loading.has(key)) return
    this.loading.add(key)
    const img = new Image()
    img.onload = () => {
      if (this.destroyed) return
      try {
        const src = tone === 'none' ? img : applyTone(img, tone)
        this.imageCache.set(key, src)
      } catch {
        this.imageCache.set(key, img)
      }
      this.loading.delete(key)
      if (this.doc) this.setDoc(this.doc)
    }
    img.onerror = () => {
      this.loading.delete(key)
    }
    img.src = asset.dataUrl
  }

  /* ------------------------------- 交互 ------------------------------- */

  private bindEvents(group: Konva.Group, el: ElementDoc): void {
    group.on('click tap', (e) => {
      e.cancelBubble = true
      const additive = !!(e.evt as MouseEvent).shiftKey
      this.cb.onSelect(el.id, additive)
    })
    group.on('dragend', () => {
      const nx = group.x() - group.offsetX()
      const ny = group.y() - group.offsetY()
      this.cb.onDragEnd(el.id, Math.round(nx * 10) / 10, Math.round(ny * 10) / 10)
    })
    group.on('transformend', () => {
      const bw = (group.getAttr('baseW') as number) ?? el.width
      const bh = (group.getAttr('baseH') as number) ?? el.height
      const w = Math.max(4, bw * group.scaleX())
      const h = Math.max(0, bh * group.scaleY())
      const x = group.x() - w / 2
      const y = group.y() - h / 2
      group.scale({ x: 1, y: 1 })
      this.cb.onTransformEnd(el.id, {
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
        width: Math.round(w * 10) / 10,
        height: Math.round(h * 10) / 10,
      })
    })
  }

  private handleStagePointer = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>): void => {
    if (this.panMoved) {
      this.panMoved = false
      return
    }
    if (e.target === this.stage) {
      this.cb.onSelect(null, false)
    }
  }

  /** 在空白处按下 = 平移画布（不改变文档数据） */
  private handlePointerDown = (e: Konva.KonvaEventObject<PointerEvent>): void => {
    if (e.target !== this.stage) return
    if (e.evt.button !== undefined && e.evt.button !== 0 && e.evt.button !== 1) return
    let last = { x: e.evt.clientX, y: e.evt.clientY }
    let moved = 0
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - last.x
      const dy = ev.clientY - last.y
      last = { x: ev.clientX, y: ev.clientY }
      moved += Math.abs(dx) + Math.abs(dy)
      if (moved > 2) this.cb.onPan(dx, dy)
    }
    const up = () => {
      this.panMoved = moved > 4
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  private handleDoubleClick = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>): void => {
    let node: Konva.Node | null = e.target
    while (node && !node.getAttr('dataId')) node = node.getParent()
    const id = node?.getAttr('dataId') as string | undefined
    if (id) this.cb.onDoubleClick(id)
  }

  /* ------------------------------- 视图 ------------------------------- */

  private applyView(): void {
    if (!this.doc || !this.view) return
    const { width: W, height: H } = pageSizePx(this.doc.page)
    const zoom = this.view.zoom
    const cw = this.stage.width()
    const ch = this.stage.height()
    this.world.scale({ x: zoom, y: zoom })
    this.world.position({
      x: (cw - W * zoom) / 2 + this.view.panX,
      y: (ch - H * zoom) / 2 + this.view.panY,
    })
    this.renderOverlay(W, H)
  }

  private renderOverlay(W: number, H: number): void {
    if (!this.view) return
    const key = `${W}x${H}|${this.view.showGuides}|${this.view.showSafeArea}|${this.doc?.page.margin ?? 0}`
    if (this.overlayKey === key) return
    this.overlayKey = key

    // transformer 需要保留（正在被使用），只清掉辅助线
    const keep = this.transformer
    if (keep.getParent()) keep.remove()
    this.overlay.destroyChildren()
    this.overlay.add(keep)

    // 纸张外框
    this.overlay.add(
      new Konva.Rect({
        x: 0,
        y: 0,
        width: W,
        height: H,
        stroke: 'rgba(201,154,81,0.55)',
        strokeWidth: 1,
        listening: false,
      }),
    )

    if (this.view.showGuides) {
      const step = 48
      for (let x = step; x < W; x += step) {
        this.overlay.add(
          new Konva.Line({
            points: [x, 0, x, H],
            stroke: 'rgba(201,154,81,0.18)',
            strokeWidth: 0.5,
            listening: false,
          }),
        )
      }
      for (let y = step; y < H; y += step) {
        this.overlay.add(
          new Konva.Line({
            points: [0, y, W, y],
            stroke: 'rgba(201,154,81,0.18)',
            strokeWidth: 0.5,
            listening: false,
          }),
        )
      }
    }

    if (this.view.showSafeArea && this.doc) {
      const m = this.doc.page.margin
      this.overlay.add(
        new Konva.Rect({
          x: m,
          y: m,
          width: W - m * 2,
          height: H - m * 2,
          stroke: 'rgba(120,180,220,0.55)',
          strokeWidth: 1,
          dash: [8, 6],
          listening: false,
        }),
      )
    }
  }

  private applySelection(view: ViewState): void {
    const nodes = view.selectedIds
      .map((id) => this.nodeMap.get(id))
      .filter((n): n is Konva.Node => !!n)
    this.transformer.nodes(nodes)

    const first = view.selectedIds[0]
    const el = this.doc?.elements.find((x) => x.id === first)
    if (el && el.type === 'text' && el.autoHeight) {
      this.transformer.enabledAnchors(['middle-left', 'middle-right'])
    } else {
      this.transformer.enabledAnchors([
        'top-left',
        'top-right',
        'bottom-left',
        'bottom-right',
        'middle-left',
        'middle-right',
        'top-center',
        'bottom-center',
      ])
    }
    this.overlay.getLayer()?.batchDraw()
  }

  /* ------------------------------- 导出 ------------------------------- */

  /**
   * 以目标缩放比渲染出「只有纸张内容」的 canvas。
   * 文字是按新字号重新排版绘制的，不是把预览位图拉大。
   */
  async exportCanvas(scale: number): Promise<HTMLCanvasElement> {
    if (!this.doc) throw new Error('没有可导出的文档')
    const { width: W, height: H } = pageSizePx(this.doc.page)
    const targetW = Math.round(W * scale)
    const targetH = Math.round(H * scale)

    const shadow = this.paperLayer.findOne('.paper-shadow')
    const prevShadowVisible = shadow ? shadow.visible() : false
    shadow?.visible(false)
    this.overlay.visible(false)

    const prevStage = { width: this.stage.width(), height: this.stage.height() }
    const prevScale = { x: this.world.scaleX(), y: this.world.scaleY() }
    const prevPos = { x: this.world.x(), y: this.world.y() }

    try {
      this.stage.size({ width: targetW, height: targetH })
      this.world.scale({ x: scale, y: scale })
      this.world.position({ x: 0, y: 0 })
      this.stage.draw()
      await new Promise<void>((r) => requestAnimationFrame(() => r()))
      const canvas = this.stage.toCanvas({ pixelRatio: 1 })
      return canvas
    } finally {
      shadow?.visible(prevShadowVisible)
      this.overlay.visible(true)
      this.stage.size(prevStage)
      this.world.scale(prevScale)
      this.world.position(prevPos)
      this.stage.draw()
      this.applyView()
    }
  }

  draw(): void {
    this.stage.draw()
  }
}

const noiseCache = new Map<string, HTMLCanvasElement>()

/** 图片色调预处理：做旧照片 / 蓝图 / 底片 */
function applyTone(img: HTMLImageElement, tone: string): HTMLCanvasElement {
  const w = img.naturalWidth || img.width
  const h = img.naturalHeight || img.height
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  if (!ctx) return c
  ctx.drawImage(img, 0, 0)
  const data = ctx.getImageData(0, 0, w, h)
  const d = data.data
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i]
    const g = d[i + 1]
    const b = d[i + 2]
    const lum = 0.299 * r + 0.587 * g + 0.114 * b
    if (tone === 'gray') {
      d[i] = d[i + 1] = d[i + 2] = lum
    } else if (tone === 'sepia') {
      d[i] = Math.min(255, lum * 1.07 + 24)
      d[i + 1] = Math.min(255, lum * 0.94 + 12)
      d[i + 2] = Math.min(255, lum * 0.72)
    } else if (tone === 'blueprint') {
      d[i] = lum * 0.16
      d[i + 1] = lum * 0.46
      d[i + 2] = Math.min(255, lum * 0.95 + 28)
    }
  }
  ctx.putImageData(data, 0, 0)
  return c
}
