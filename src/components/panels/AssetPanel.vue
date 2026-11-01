<script setup lang="ts">
import { ref } from 'vue'
import { editor, state } from '@/store/editor'
import { createImage } from '@/core/factory'
import { pageSize } from '@/store/editor'
import type { ShapeKind } from '@/types/project'

const fileInput = ref<HTMLInputElement>()
const dragging = ref(false)

const SHAPES: { kind: ShapeKind; label: string; d: string }[] = [
  { kind: 'rect', label: '矩形', d: 'M3 5h14v10H3z' },
  { kind: 'ellipse', label: '椭圆', d: 'M10 5a7 5 0 1 1 0 10a7 5 0 1 1 0-10' },
  { kind: 'line', label: '线条', d: 'M3 14L17 6' },
  { kind: 'frame', label: '边框', d: 'M3 4h14v12H3zM5 6h10v8H5z' },
  { kind: 'seal', label: '印章', d: 'M10 3a7 7 0 1 1 0 14a7 7 0 1 1 0-14M10 6v8M6 10h8' },
]

function pick(files: FileList | null): void {
  if (!files) return
  for (const f of Array.from(files).slice(0, 6)) void editor.addImageFile(f)
}

function onDrop(e: DragEvent): void {
  dragging.value = false
  pick(e.dataTransfer?.files ?? null)
}

function insertExisting(assetId: string): void {
  const asset = state.doc.assets.find((a) => a.id === assetId)
  if (!asset) return
  const { width: W, height: H } = pageSize()
  const tw = Math.round(W * 0.4)
  const th = Math.round(tw * (asset.height / Math.max(1, asset.width)))
  editor.addElement(
    createImage(asset.id, {
      x: Math.round((W - tw) / 2),
      y: Math.round(H * 0.3),
      width: tw,
      height: th,
      name: asset.name,
    }),
  )
}
</script>

<template>
  <div class="asset-panel">
    <div class="section-title">文字</div>
    <div class="block">
      <button class="btn wide" @click="editor.addText()">＋ 添加文字块</button>
      <div class="mini-grid">
        <button class="btn sm" @click="editor.addText({ fontSize: 30, fontStyle: 'bold', text: '标题' })">
          大标题
        </button>
        <button class="btn sm" @click="editor.addText({ fontSize: 11, text: '小字注记' })">小注</button>
      </div>
    </div>

    <div class="section-title">图形与装饰</div>
    <div class="shape-grid">
      <button
        v-for="s in SHAPES"
        :key="s.kind"
        class="shape-btn"
        :title="s.label"
        @click="editor.addShapeElement(s.kind)"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.2">
          <path :d="s.d" />
        </svg>
        <span>{{ s.label }}</span>
      </button>
    </div>

    <div class="section-title">图片</div>
    <div class="block">
      <div
        class="drop"
        :class="{ on: dragging }"
        @click="fileInput?.click()"
        @dragover.prevent="dragging = true"
        @dragleave.prevent="dragging = false"
        @drop.prevent="onDrop"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="8.5" cy="9.5" r="1.6" />
          <path d="M4 17l5-5 4 4 3-3 4 4" />
        </svg>
        <b>点此导入，或把图片拖进来</b>
        <span>仅在本机处理，不上传，不转远程地址</span>
      </div>
      <input
        ref="fileInput"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/bmp,image/avif"
        multiple
        class="hidden"
        @change="pick(($event.target as HTMLInputElement).files); ($event.target as HTMLInputElement).value = ''"
      />
    </div>

    <template v-if="state.doc.assets.length">
      <div class="section-title">本项目图片（{{ state.doc.assets.length }}）</div>
      <div class="asset-grid">
        <button
          v-for="a in state.doc.assets"
          :key="a.id"
          class="asset-item"
          :title="`插入 ${a.name}`"
          @click="insertExisting(a.id)"
        >
          <img :src="a.dataUrl" :alt="a.name" />
          <span>{{ a.name }}</span>
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.asset-panel {
  padding-bottom: 14px;
}
.block {
  padding: 9px 10px 4px;
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.wide {
  width: 100%;
  justify-content: center;
}
.mini-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.shape-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  padding: 9px 10px 4px;
}
.shape-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 9px 2px 7px;
  border: 1px solid var(--line);
  border-radius: 6px;
  color: var(--ink-2);
  background: rgba(255, 255, 255, 0.015);
  transition: all 0.13s;
}
.shape-btn:hover {
  border-color: var(--line-2);
  color: var(--copper-2);
  background: rgba(201, 154, 81, 0.07);
}
.shape-btn span {
  font-size: 10.5px;
}
.drop {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px 8px;
  border: 1px dashed var(--line-2);
  border-radius: 7px;
  color: var(--ink-3);
  cursor: pointer;
  text-align: center;
  transition: all 0.14s;
}
.drop:hover,
.drop.on {
  border-color: var(--copper);
  color: var(--copper-2);
  background: rgba(201, 154, 81, 0.06);
}
.drop b {
  font-size: 12px;
  font-weight: 500;
  color: var(--ink-2);
}
.drop span {
  font-size: 10px;
  color: var(--ink-4);
}
.asset-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  padding: 9px 10px 0;
}
.asset-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 3px;
  border: 1px solid var(--line);
  border-radius: 5px;
  overflow: hidden;
}
.asset-item:hover {
  border-color: var(--copper);
}
.asset-item img {
  width: 100%;
  height: 46px;
  object-fit: cover;
  border-radius: 3px;
  background: #0e0c09;
}
.asset-item span {
  font-size: 9px;
  color: var(--ink-4);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
