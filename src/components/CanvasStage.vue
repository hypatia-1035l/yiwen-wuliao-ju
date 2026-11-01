<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { CanvasRenderer } from '@/render/renderer'
import { editor, state } from '@/store/editor'
import { pageSizePx } from '@/core/paper'

const emit = defineEmits<{ (e: 'edit-text', id: string): void }>()

const host = ref<HTMLDivElement>()
let renderer: CanvasRenderer | null = null
let ro: ResizeObserver | null = null

const zoomLabel = computed(() => {
  const z = state.view.zoom
  return z > 0 ? `${Math.round(z * 100)}%` : '—'
})

function fitToScreen(): void {
  if (!renderer) return
  const s = renderer.fitScale()
  state.view.zoom = Math.min(2.5, Math.max(0.05, s))
  state.view.panX = 0
  state.view.panY = 0
}

function setZoom(next: number, anchorX?: number, anchorY?: number): void {
  const el = host.value
  if (!el) return
  const z0 = state.view.zoom > 0 ? state.view.zoom : 1
  const z1 = Math.min(4, Math.max(0.08, next))
  const { width: W, height: H } = pageSizePx(state.doc.page)
  const cw = el.clientWidth
  const ch = el.clientHeight
  const px = anchorX ?? cw / 2
  const py = anchorY ?? ch / 2
  const originX = (cw - W * z0) / 2 + state.view.panX
  const originY = (ch - H * z0) / 2 + state.view.panY
  const docX = (px - originX) / z0
  const docY = (py - originY) / z0
  state.view.zoom = z1
  state.view.panX = px - docX * z1 - (cw - W * z1) / 2
  state.view.panY = py - docY * z1 - (ch - H * z1) / 2
}

function onWheel(e: WheelEvent): void {
  e.preventDefault()
  const rect = host.value?.getBoundingClientRect()
  const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12
  const z = state.view.zoom > 0 ? state.view.zoom : 1
  setZoom(z * factor, e.clientX - (rect?.left ?? 0), e.clientY - (rect?.top ?? 0))
}

/* 双指捏合缩放 */
let pinchDist = 0
function onTouchStart(e: TouchEvent): void {
  if (e.touches.length === 2) {
    pinchDist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY,
    )
  }
}
function onTouchMove(e: TouchEvent): void {
  if (e.touches.length !== 2 || !pinchDist) return
  e.preventDefault()
  const d = Math.hypot(
    e.touches[0].clientX - e.touches[1].clientX,
    e.touches[0].clientY - e.touches[1].clientY,
  )
  const rect = host.value?.getBoundingClientRect()
  const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - (rect?.left ?? 0)
  const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2 - (rect?.top ?? 0)
  const z = state.view.zoom > 0 ? state.view.zoom : 1
  setZoom(z * (d / pinchDist), cx, cy)
  pinchDist = d
}
function onTouchEnd(): void {
  pinchDist = 0
}

onMounted(() => {
  if (!host.value) return
  renderer = new CanvasRenderer(host.value, {
    onSelect: (id, additive) => editor.select(id, additive),
    onDragEnd: (id, x, y) => editor.updateElement(id, { x, y }),
    onTransformEnd: (id, patch) => editor.updateElement(id, patch),
    onDoubleClick: (id) => {
      editor.select(id)
      emit('edit-text', id)
    },
    onPan: (dx, dy) => {
      state.view.panX += dx
      state.view.panY += dy
    },
  })
  renderer.setView(state.view)
  renderer.setDoc(state.doc)
  if (state.view.zoom <= 0) fitToScreen()

  host.value.addEventListener('wheel', onWheel, { passive: false })
  host.value.addEventListener('touchstart', onTouchStart, { passive: true })
  host.value.addEventListener('touchmove', onTouchMove, { passive: false })
  host.value.addEventListener('touchend', onTouchEnd, { passive: true })

  ro = new ResizeObserver(() => {
    if (!host.value || !renderer) return
    renderer.resize(host.value.clientWidth, host.value.clientHeight)
    if (state.view.zoom <= 0) fitToScreen()
  })
  ro.observe(host.value)
})

onBeforeUnmount(() => {
  if (host.value) {
    host.value.removeEventListener('wheel', onWheel)
    host.value.removeEventListener('touchstart', onTouchStart)
    host.value.removeEventListener('touchmove', onTouchMove)
    host.value.removeEventListener('touchend', onTouchEnd)
  }
  ro?.disconnect()
  renderer?.destroy()
  renderer = null
})

watch(
  () => state.doc,
  (doc) => {
    if (!renderer) return
    renderer.setDoc(doc)
    if (state.view.zoom <= 0) fitToScreen()
  },
  { deep: true, flush: 'sync' },
)

watch(
  () => state.view,
  (view) => {
    // zoom 为 0 表示「等待适应窗口」（新建 / 打开项目后设置）
    if (view.zoom <= 0) {
      fitToScreen()
      return
    }
    renderer?.setView(view)
  },
  { deep: true, flush: 'sync' },
)

defineExpose({
  fitToScreen,
  setZoom,
  getRenderer: () => renderer,
})
</script>

<template>
  <div class="stage-wrap">
    <div ref="host" class="stage-host" />
    <div class="zoom-bar">
      <button class="btn ghost sm" title="缩小" @click="setZoom((state.view.zoom || 1) / 1.2)">−</button>
      <button class="btn ghost sm zoom-val" title="恢复到 100%" @click="setZoom(1)">
        {{ zoomLabel }}
      </button>
      <button class="btn ghost sm" title="放大" @click="setZoom((state.view.zoom || 1) * 1.2)">
        ＋
      </button>
      <span class="sep" />
      <button class="btn ghost sm" title="适应窗口" @click="fitToScreen">适应</button>
    </div>
  </div>
</template>

<style scoped>
.stage-wrap {
  position: relative;
  flex: 1;
  min-width: 0;
  min-height: 0;
  background: radial-gradient(circle at 50% 40%, #1a1611 0%, #0d0b08 75%);
  overflow: hidden;
}
.stage-host {
  position: absolute;
  inset: 0;
  touch-action: none;
}
.zoom-bar {
  position: absolute;
  left: 50%;
  bottom: 12px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 3px 5px;
  background: rgba(20, 16, 12, 0.9);
  border: 1px solid var(--line-2);
  border-radius: 20px;
  backdrop-filter: blur(6px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
}
.zoom-val {
  min-width: 52px;
  font-variant-numeric: tabular-nums;
  color: var(--ink-2);
}
.sep {
  width: 1px;
  height: 16px;
  background: var(--line-2);
  margin: 0 3px;
}
@media (max-width: 860px) {
  .zoom-bar {
    bottom: 8px;
  }
}
</style>
