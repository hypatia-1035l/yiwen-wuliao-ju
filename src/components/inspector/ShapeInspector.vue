<script setup lang="ts">
import { computed } from 'vue'
import { editor } from '@/store/editor'
import NumField from '../ui/NumField.vue'
import ColorField from '../ui/ColorField.vue'
import type { ShapeElement } from '@/types/project'

const props = defineProps<{ el: ShapeElement }>()

const DASHES: { label: string; v: number[] }[] = [
  { label: '实线', v: [] },
  { label: '点线', v: [2, 4] },
  { label: '短划', v: [7, 5] },
  { label: '长划', v: [16, 8] },
]

const shapeLabel = computed(() => {
  const map: Record<string, string> = {
    rect: '矩形',
    ellipse: '椭圆',
    line: '线条',
    frame: '边框',
    seal: '印章',
  }
  return map[props.el.shape] ?? '图形'
})

function patch(p: Partial<ShapeElement>, key?: string): void {
  editor.updateElement(props.el.id, p, key)
}

function dashIndex(): number {
  const d = props.el.dash
  if (!d.length) return 0
  return DASHES.findIndex((x) => x.v.length === d.length && x.v[0] === d[0]) || 1
}
</script>

<template>
  <div class="sec">
    <div class="section-title">{{ shapeLabel }}</div>
    <div class="pad">
      <div v-if="el.shape !== 'line'" class="field">
        <ColorField
          label="填充"
          allow-transparent
          :model-value="el.fill"
          @change="patch({ fill: $event }, `fl:${el.id}`)"
        />
      </div>
      <ColorField
        :label="el.shape === 'seal' ? '印色' : '描边'"
        :model-value="el.stroke"
        @change="patch({ stroke: $event }, `sk:${el.id}`)"
      />
      <NumField
        label="线宽"
        suffix="px"
        :model-value="el.strokeWidth"
        :min="0"
        :max="40"
        :step="0.5"
        @change="patch({ strokeWidth: $event }, `sw:${el.id}`)"
      />
      <NumField
        v-if="el.shape === 'rect'"
        label="圆角"
        suffix="px"
        :model-value="el.cornerRadius"
        :min="0"
        :max="400"
        @change="patch({ cornerRadius: $event }, `cr:${el.id}`)"
      />
      <div v-if="el.shape === 'rect' || el.shape === 'frame'" class="field">
        <label>线型</label>
        <div class="seg">
          <button
            v-for="(d, i) in DASHES"
            :key="d.label"
            class="seg-btn"
            :class="{ on: dashIndex() === i }"
            @click="patch({ dash: d.v })"
          >
            {{ d.label }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <div v-if="el.shape === 'seal'" class="sec">
    <div class="section-title">印章文字</div>
    <div class="pad">
      <input
        class="input"
        :value="el.text ?? ''"
        maxlength="8"
        spellcheck="false"
        @input="patch({ text: ($event.target as HTMLInputElement).value }, `seal:${el.id}`)"
      />
      <NumField
        label="字号"
        suffix="px"
        :model-value="el.fontSize ?? 16"
        :min="6"
        :max="120"
        @change="patch({ fontSize: $event }, `sf:${el.id}`)"
      />
      <p class="hint">2–4 字效果最好，文字会自动排成两行并居中。</p>
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
</style>
