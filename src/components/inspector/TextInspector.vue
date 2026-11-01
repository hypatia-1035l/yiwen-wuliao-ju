<script setup lang="ts">
import { computed, ref } from 'vue'
import { editor } from '@/store/editor'
import { FONT_OPTIONS } from '@/core/fonts'
import { pxToPt } from '@/core/paper'
import NumField from '../ui/NumField.vue'
import ColorField from '../ui/ColorField.vue'
import type { TextAlign, TextElement } from '@/types/project'

const props = defineProps<{ el: TextElement }>()
const area = ref<HTMLTextAreaElement>()

const isBold = computed(() => props.el.fontStyle.includes('bold'))
const isItalic = computed(() => props.el.fontStyle.includes('italic'))

function patch(p: Partial<TextElement>, key?: string): void {
  editor.updateElement(props.el.id, p, key)
}

function onText(e: Event): void {
  patch({ text: (e.target as HTMLInputElement).value }, `text:${props.el.id}`)
}

function toggleStyle(kind: 'bold' | 'italic'): void {
  const bold = kind === 'bold' ? !isBold.value : isBold.value
  const italic = kind === 'italic' ? !isItalic.value : isItalic.value
  const style = [bold ? 'bold' : '', italic ? 'italic' : ''].filter(Boolean).join(' ')
  patch({ fontStyle: (style || 'normal') as TextElement['fontStyle'] }, `style:${props.el.id}`)
}

const ALIGNS: { v: TextAlign; label: string }[] = [
  { v: 'left', label: '左' },
  { v: 'center', label: '中' },
  { v: 'right', label: '右' },
  { v: 'justify', label: '两端' },
]

defineExpose({ focusText: () => area.value?.focus() })
</script>

<template>
  <div class="sec">
    <div class="section-title">文字内容</div>
    <div class="pad">
      <textarea
        ref="area"
        class="textarea"
        rows="5"
        spellcheck="false"
        :value="el.text"
        @input="onText"
      />
      <p class="hint">{{ el.text.length }} 字 · 双击画布上的文字可直接回到这里编辑</p>
    </div>
  </div>

  <div class="sec">
    <div class="section-title">字体</div>
    <div class="pad col">
      <select class="select" :value="el.fontFamily" @change="patch({ fontFamily: ($event.target as HTMLSelectElement).value })">
        <option v-for="f in FONT_OPTIONS" :key="f.id" :value="f.family">{{ f.label }} · {{ f.note }}</option>
      </select>

      <div class="row">
        <NumField
          class="grow"
          label="字号"
          suffix="pt"
          :model-value="pxToPt(el.fontSize)"
          :min="4"
          :max="400"
          :step="0.5"
          @change="patch({ fontSize: ($event * 96) / 72 }, `fs:${el.id}`)"
        />
        <div class="style-group">
          <button class="tgl" :class="{ on: isBold }" title="加粗" @click="toggleStyle('bold')">
            <b>B</b>
          </button>
          <button class="tgl" :class="{ on: isItalic }" title="斜体" @click="toggleStyle('italic')">
            <i>I</i>
          </button>
        </div>
      </div>

      <div class="row">
        <NumField
          class="grow"
          label="行高"
          :model-value="el.lineHeight"
          :min="0.6"
          :max="4"
          :step="0.05"
          @change="patch({ lineHeight: $event }, `lh:${el.id}`)"
        />
        <NumField
          class="grow"
          label="字距"
          suffix="px"
          :model-value="el.letterSpacing"
          :min="-10"
          :max="40"
          :step="0.5"
          @change="patch({ letterSpacing: $event }, `ls:${el.id}`)"
        />
      </div>

      <div class="field">
        <label>对齐</label>
        <div class="seg">
          <button
            v-for="a in ALIGNS"
            :key="a.v"
            class="seg-btn"
            :class="{ on: el.align === a.v }"
            @click="patch({ align: a.v })"
          >
            {{ a.label }}
          </button>
        </div>
      </div>

      <ColorField label="文字颜色" :model-value="el.fill" @change="patch({ fill: $event }, `fill:${el.id}`)" />
    </div>
  </div>

  <div class="sec">
    <div class="section-title">文本块</div>
    <div class="pad col">
      <label class="check">
        <input
          type="checkbox"
          :checked="el.autoHeight"
          @change="patch({ autoHeight: ($event.target as HTMLInputElement).checked })"
        />
        <span>高度随内容自适应</span>
      </label>
      <div class="row">
        <NumField
          class="grow"
          label="内边距"
          suffix="px"
          :model-value="el.padding"
          :min="0"
          :max="120"
          @change="patch({ padding: $event }, `pad:${el.id}`)"
        />
        <NumField
          v-if="!el.autoHeight"
          class="grow"
          label="垂直对齐"
          :model-value="el.verticalAlign === 'top' ? 0 : el.verticalAlign === 'middle' ? 1 : 2"
          :min="0"
          :max="2"
          :step="1"
          @change="patch({ verticalAlign: $event === 0 ? 'top' : $event === 1 ? 'middle' : 'bottom' })"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.sec {
  border-bottom: 1px solid var(--line);
}
.pad {
  padding: 10px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.col {
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.style-group {
  display: flex;
  gap: 4px;
  align-items: flex-end;
  padding-bottom: 1px;
}
.tgl {
  width: 30px;
  height: 28px;
  border: 1px solid var(--line-2);
  border-radius: 5px;
  color: var(--ink-3);
  background: #120f0b;
}
.tgl.on {
  color: #1a1409;
  background: var(--copper);
  border-color: var(--copper);
}
.seg {
  display: flex;
  border: 1px solid var(--line-2);
  border-radius: 5px;
  overflow: hidden;
}
.seg-btn {
  flex: 1;
  height: 26px;
  font-size: 11.5px;
  color: var(--ink-3);
  background: #120f0b;
}
.seg-btn + .seg-btn {
  border-left: 1px solid var(--line);
}
.seg-btn.on {
  color: #1a1409;
  background: var(--copper);
}
.check {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  color: var(--ink-2);
  cursor: pointer;
}
.check input {
  accent-color: var(--copper);
}
</style>
