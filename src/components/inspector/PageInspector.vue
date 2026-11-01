<script setup lang="ts">
import { computed } from 'vue'
import { editor, state } from '@/store/editor'
import { pageSizeMm, pageSizePx } from '@/core/paper'
import { boundsOf } from '@/core/audit'
import { PAPER_COLORS } from '@/core/palette'
import { PAPER_LABEL, type PaperSize } from '@/types/project'
import NumField from '../ui/NumField.vue'
import ColorField from '../ui/ColorField.vue'

const sizes: PaperSize[] = ['A4', 'A5', 'A6']

const mm = computed(() => pageSizeMm(state.doc.page.size, state.doc.page.orientation))
const px = computed(() => pageSizePx(state.doc.page))

const outside = computed(() => {
  const { width: W, height: H } = px.value
  return state.doc.elements.filter((el) => {
    if (!el.visible) return false
    const b = boundsOf(el)
    return b.x < -0.5 || b.y < -0.5 || b.x + b.width > W + 0.5 || b.y + b.height > H + 0.5
  }).length
})

function setSize(s: PaperSize): void {
  editor.updatePage({ size: s })
}
</script>

<template>
  <div class="sec">
    <div class="section-title">纸张</div>
    <div class="pad">
      <div class="field">
        <label>规格</label>
        <div class="seg">
          <button
            v-for="s in sizes"
            :key="s"
            class="seg-btn"
            :class="{ on: state.doc.page.size === s }"
            @click="setSize(s)"
          >
            {{ s }}
          </button>
        </div>
        <span class="hint">{{ PAPER_LABEL[state.doc.page.size] }}</span>
      </div>

      <div class="field">
        <label>方向</label>
        <div class="seg">
          <button
            class="seg-btn"
            :class="{ on: state.doc.page.orientation === 'portrait' }"
            @click="editor.updatePage({ orientation: 'portrait' })"
          >
            纵向
          </button>
          <button
            class="seg-btn"
            :class="{ on: state.doc.page.orientation === 'landscape' }"
            @click="editor.updatePage({ orientation: 'landscape' })"
          >
            横向
          </button>
        </div>
      </div>

      <div class="dim">
        {{ mm.width }} × {{ mm.height }} mm
        <span>·</span>
        {{ Math.round(px.width) }} × {{ Math.round(px.height) }} px @96dpi
      </div>
    </div>
  </div>

  <div class="sec">
    <div class="section-title">纸面</div>
    <div class="pad">
      <div class="paper-swatches">
        <button
          v-for="c in PAPER_COLORS"
          :key="c.color"
          class="psw"
          :class="{ on: state.doc.page.color.toLowerCase() === c.color }"
          :style="{ background: c.color }"
          :title="c.label"
          @click="editor.updatePage({ color: c.color })"
        >
          <span>{{ c.label }}</span>
        </button>
      </div>
      <ColorField
        label="自定义底色"
        :model-value="state.doc.page.color"
        @change="editor.updatePage({ color: $event }, 'pageColor')"
      />

      <div class="field">
        <label>纸纹强度 {{ Math.round(state.doc.page.texture * 100) }}%</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.02"
          :value="state.doc.page.texture"
          @input="editor.updatePage({ texture: Number(($event.target as HTMLInputElement).value) }, 'texture')"
        />
      </div>
    </div>
  </div>

  <div class="sec">
    <div class="section-title">辅助</div>
    <div class="pad">
      <NumField
        label="安全边距"
        suffix="mm"
        :model-value="+(state.doc.page.margin / 96 * 25.4).toFixed(1)"
        :min="0"
        :max="60"
        :step="1"
        @change="editor.updatePage({ margin: Math.round(($event * 96) / 25.4) }, 'margin')"
      />
      <label class="check">
        <input
          type="checkbox"
          :checked="state.view.showSafeArea"
          @change="state.view.showSafeArea = ($event.target as HTMLInputElement).checked"
        />
        <span>显示安全区（虚框）</span>
      </label>
      <label class="check">
        <input
          type="checkbox"
          :checked="state.view.showGuides"
          @change="state.view.showGuides = ($event.target as HTMLInputElement).checked"
        />
        <span>显示辅助网格</span>
      </label>
      <p v-if="outside" class="warn">
        有 {{ outside }} 个元素超出纸张，导出时会被裁切。
      </p>
    </div>
  </div>

  <div class="sec">
    <div class="section-title">统计</div>
    <div class="pad">
      <div class="stats">
        <span>元素 <b>{{ state.doc.elements.length }}</b></span>
        <span>图片 <b>{{ state.doc.assets.length }}</b></span>
        <span>模板 <b>{{ state.doc.templateId }}</b></span>
      </div>
      <p class="hint">提示：Ctrl/⌘ + 滚轮缩放画布，空白处拖动可平移。</p>
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
  gap: 10px;
}
.seg {
  display: flex;
  border: 1px solid var(--line-2);
  border-radius: 5px;
  overflow: hidden;
}
.seg-btn {
  flex: 1;
  height: 27px;
  font-size: 12px;
  color: var(--ink-3);
  background: #120f0b;
}
.seg-btn + .seg-btn {
  border-left: 1px solid var(--line);
}
.seg-btn.on {
  color: #1a1409;
  background: var(--copper);
  font-weight: 600;
}
.dim {
  font-size: 10.5px;
  color: var(--ink-4);
  font-family: var(--font-mono);
  letter-spacing: 0.02em;
}
.dim span {
  opacity: 0.5;
  margin: 0 3px;
}
.paper-swatches {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 5px;
}
.psw {
  height: 34px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.35);
  display: grid;
  place-items: end center;
  padding-bottom: 2px;
  transition: outline 0.1s;
}
.psw span {
  font-size: 8.5px;
  color: rgba(40, 30, 18, 0.72);
  letter-spacing: 0.02em;
}
.psw.on {
  outline: 1.5px solid var(--copper-2);
  outline-offset: 1px;
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
.warn {
  margin: 0;
  font-size: 11px;
  line-height: 1.55;
  color: var(--warn);
}
.stats {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: var(--ink-4);
}
.stats b {
  color: var(--ink-2);
  font-weight: 500;
}
</style>
