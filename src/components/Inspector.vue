<script setup lang="ts">
import { computed, ref } from 'vue'
import { editor, state } from '@/store/editor'
import PageInspector from './inspector/PageInspector.vue'
import TextInspector from './inspector/TextInspector.vue'
import ImageInspector from './inspector/ImageInspector.vue'
import ShapeInspector from './inspector/ShapeInspector.vue'
import NumField from './ui/NumField.vue'

const el = computed(() => {
  const id = state.view.selectedIds[0]
  return id ? state.doc.elements.find((e) => e.id === id) ?? null : null
})

const multi = computed(() => state.view.selectedIds.length > 1)

const typeLabel = computed(() => {
  if (!el.value) return ''
  if (el.value.type === 'text') return '文字'
  if (el.value.type === 'image') return '图片'
  const map: Record<string, string> = {
    rect: '矩形',
    ellipse: '椭圆',
    line: '线条',
    frame: '边框',
    seal: '印章',
  }
  return map[el.value.shape] ?? '图形'
})

const textRef = ref<InstanceType<typeof TextInspector>>()

function patch(p: Record<string, unknown>, key?: string): void {
  if (!el.value) return
  editor.updateElement(el.value.id, p as never, key)
}

defineExpose({ focusText: () => textRef.value?.focusText() })
</script>

<template>
  <aside class="insp">
    <div class="insp-head">
      <span v-if="el" class="tag">{{ typeLabel }}</span>
      <span v-if="multi" class="multi">已选 {{ state.view.selectedIds.length }} 个</span>
      <span v-else class="head-hint">{{ el ? '元素属性' : '页面属性' }}</span>
    </div>

    <div class="scroll">
      <template v-if="!el">
        <PageInspector />
      </template>

      <template v-else>
        <div class="sec">
          <div class="section-title">基本</div>
          <div class="pad">
            <input
              class="input"
              :value="el.name"
              maxlength="60"
              spellcheck="false"
              @input="patch({ name: ($event.target as HTMLInputElement).value }, `name:${el.id}`)"
            />
            <div class="row">
              <NumField
                class="grow"
                label="X"
                :model-value="el.x"
                @change="patch({ x: $event }, `x:${el.id}`)"
              />
              <NumField
                class="grow"
                label="Y"
                :model-value="el.y"
                @change="patch({ y: $event }, `y:${el.id}`)"
              />
            </div>
            <div class="row">
              <NumField
                class="grow"
                label="宽"
                :min="1"
                :model-value="el.width"
                @change="patch({ width: $event }, `w:${el.id}`)"
              />
              <NumField
                class="grow"
                label="高"
                :min="0"
                :disabled="el.type === 'text' && el.autoHeight"
                :model-value="el.height"
                @change="patch({ height: $event }, `h:${el.id}`)"
              />
            </div>
            <div class="row">
              <NumField
                class="grow"
                label="旋转"
                suffix="°"
                :min="-180"
                :max="180"
                :model-value="el.rotation"
                @change="patch({ rotation: $event }, `rot:${el.id}`)"
              />
              <NumField
                class="grow"
                label="不透明"
                suffix="%"
                :min="0"
                :max="100"
                :model-value="Math.round(el.opacity * 100)"
                @change="patch({ opacity: $event / 100 }, `op:${el.id}`)"
              />
            </div>
            <div class="row flags">
              <button class="btn sm" :class="{ on: el.locked }" @click="editor.toggleLock(el.id)">
                {{ el.locked ? '已锁定' : '锁定' }}
              </button>
              <button class="btn sm" @click="editor.toggleVisible(el.id)">
                {{ el.visible ? '隐藏' : '显示' }}
              </button>
              <span class="grow" />
              <button class="btn sm" @click="editor.duplicateSelected()">复制</button>
              <button class="btn sm danger" @click="editor.deleteSelected()">删除</button>
            </div>
          </div>
        </div>

        <TextInspector v-if="el.type === 'text'" ref="textRef" :key="el.id" :el="el" />
        <ImageInspector v-else-if="el.type === 'image'" :key="el.id" :el="el" />
        <ShapeInspector v-else :key="el.id" :el="el" />
      </template>
    </div>
  </aside>
</template>

<style scoped>
.insp {
  display: flex;
  flex-direction: column;
  width: var(--right-w);
  flex: none;
  min-height: 0;
  background: var(--panel);
  border-left: 1px solid var(--line);
  z-index: 20;
}
.insp-head {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 34px;
  padding: 0 12px;
  flex: none;
  border-bottom: 1px solid var(--line);
  background: var(--panel-2);
}
.tag {
  font-size: 10.5px;
  color: #1a1409;
  background: var(--copper);
  border-radius: 3px;
  padding: 1px 6px;
  font-weight: 600;
}
.head-hint {
  font-size: 11px;
  color: var(--ink-4);
  letter-spacing: 0.05em;
}
.multi {
  font-size: 11px;
  color: var(--warn);
}
.scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
.sec {
  border-bottom: 1px solid var(--line);
}
.pad {
  padding: 10px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.row {
  display: flex;
  gap: 8px;
}
.flags {
  align-items: center;
  flex-wrap: wrap;
}
.flags .btn.on {
  color: #1a1409;
  background: var(--copper);
  border-color: var(--copper);
}
.danger {
  color: var(--danger);
  border-color: rgba(194, 90, 77, 0.3);
}
.danger:hover {
  background: rgba(194, 90, 77, 0.12);
}
@media (max-width: 860px) {
  .insp {
    width: min(88vw, 340px);
  }
}
</style>
