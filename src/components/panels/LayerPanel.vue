<script setup lang="ts">
import { computed } from 'vue'
import { editor, state } from '@/store/editor'
import type { ElementDoc } from '@/types/project'

const ordered = computed(() => [...state.doc.elements].reverse())

const selectedId = computed(() => state.view.selectedIds[0] ?? '')

function iconOf(el: ElementDoc): string {
  if (el.type === 'text') return 'T'
  if (el.type === 'image') return '▣'
  const map: Record<string, string> = { rect: '▭', ellipse: '◯', line: '／', frame: '▢', seal: '◉' }
  return map[el.shape] ?? '▭'
}

function select(id: string, e: MouseEvent): void {
  editor.select(id, e.shiftKey)
}
</script>

<template>
  <div class="layer-panel">
    <div class="section-title">
      图层（{{ state.doc.elements.length }}）
      <span class="hint">顶层在上</span>
    </div>

    <div class="layer-list">
      <p v-if="!state.doc.elements.length" class="empty">画布还是空的。用「素材」添加内容，或换个模板。</p>
      <div
        v-for="el in ordered"
        :key="el.id"
        class="layer"
        :class="{ active: el.id === selectedId, hiddenEl: !el.visible }"
        @click="select(el.id, $event)"
      >
        <span class="ico">{{ iconOf(el) }}</span>
        <span class="name" :title="el.name">{{ el.name }}</span>
        <button
          class="mini"
          :title="el.visible ? '隐藏' : '显示'"
          @click.stop="editor.toggleVisible(el.id)"
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3">
            <path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z" />
            <circle cx="8" cy="8" r="1.8" />
            <path v-if="!el.visible" d="M2.5 13.5l11-11" />
          </svg>
        </button>
        <button class="mini" :title="el.locked ? '解锁' : '锁定'" @click.stop="editor.toggleLock(el.id)">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3">
            <rect x="3.5" y="7" width="9" height="6.5" rx="1" />
            <path :d="el.locked ? 'M5.5 7V5a2.5 2.5 0 0 1 5 0v2' : 'M5.5 7V5a2.5 2.5 0 0 1 4.6-1.3'" />
          </svg>
        </button>
      </div>
    </div>

    <div class="layer-tools">
      <button class="btn sm" :disabled="!selectedId" title="上移一层" @click="editor.moveLayer(selectedId, 'up')">
        ↑
      </button>
      <button class="btn sm" :disabled="!selectedId" title="下移一层" @click="editor.moveLayer(selectedId, 'down')">
        ↓
      </button>
      <button class="btn sm" :disabled="!selectedId" title="置顶" @click="editor.moveLayer(selectedId, 'top')">
        顶
      </button>
      <button class="btn sm" :disabled="!selectedId" title="置底" @click="editor.moveLayer(selectedId, 'bottom')">
        底
      </button>
      <span class="grow" />
      <button class="btn sm" :disabled="!selectedId" title="复制 (Ctrl+D)" @click="editor.duplicateSelected()">
        复制
      </button>
      <button class="btn sm danger" :disabled="!selectedId" title="删除 (Delete)" @click="editor.deleteSelected()">
        删除
      </button>
    </div>
  </div>
</template>

<style scoped>
.layer-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}
.layer-list {
  flex: 1;
  overflow-y: auto;
  padding: 6px;
  min-height: 0;
}
.empty {
  padding: 18px 10px;
  font-size: 11.5px;
  color: var(--ink-4);
  line-height: 1.7;
  text-align: center;
}
.layer {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 6px 0 7px;
  border-radius: 5px;
  border: 1px solid transparent;
  cursor: pointer;
  user-select: none;
}
.layer:hover {
  background: rgba(201, 154, 81, 0.07);
}
.layer.active {
  background: rgba(201, 154, 81, 0.14);
  border-color: var(--line-2);
}
.layer.hiddenEl {
  opacity: 0.45;
}
.ico {
  width: 16px;
  text-align: center;
  font-size: 11px;
  color: var(--copper);
  flex: none;
}
.name {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  color: var(--ink-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.layer.active .name {
  color: var(--ink);
}
.mini {
  width: 20px;
  height: 20px;
  display: grid;
  place-items: center;
  border-radius: 4px;
  color: var(--ink-4);
  flex: none;
}
.mini:hover {
  color: var(--copper-2);
  background: rgba(201, 154, 81, 0.12);
}
.layer-tools {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 7px 8px;
  border-top: 1px solid var(--line);
  background: var(--panel);
}
.layer-tools .btn.sm {
  min-width: 26px;
  justify-content: center;
}
.danger {
  color: var(--danger);
  border-color: rgba(194, 90, 77, 0.3);
}
.danger:hover:not(:disabled) {
  background: rgba(194, 90, 77, 0.12);
}
</style>
