<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { editor, state } from '@/store/editor'
import { pageSizeMm, exportPixelSize } from '@/core/paper'
import { preflight, type PreflightResult } from '@/core/audit'
import { exportPng } from '@/export/png'
import { exportPdf } from '@/export/pdf'
import { formatBytes } from '@/export/download'
import { FONT_OPTIONS } from '@/core/fonts'

const props = defineProps<{ open: boolean; getRenderer: () => unknown }>()
const emit = defineEmits<{ (e: 'close'): void }>()

type Format = 'png' | 'pdf'

const format = ref<Format>('png')
const dpi = ref(300)
const busy = ref(false)
const result = ref('')
const check = ref<PreflightResult | null>(null)
const checking = ref(false)

const mm = computed(() => pageSizeMm(state.doc.page.size, state.doc.page.orientation))
const px = computed(() => exportPixelSize(state.doc.page, dpi.value))

const DPI_OPTIONS = [
  { v: 150, label: '150 dpi', note: '屏幕／草稿' },
  { v: 300, label: '300 dpi', note: '常规印刷' },
  { v: 600, label: '600 dpi', note: '精细输出（较慢）' },
]

const fontLabel = (family: string): string => FONT_OPTIONS.find((f) => f.family === family)?.label ?? family

watch(
  () => props.open,
  async (open) => {
    if (!open) return
    result.value = ''
    checking.value = true
    try {
      check.value = await preflight(state.doc)
    } finally {
      checking.value = false
    }
  },
)

async function run(): Promise<void> {
  const renderer = props.getRenderer()
  if (!renderer) {
    editor.toast('画布尚未准备好', 'error')
    return
  }
  busy.value = true
  result.value = ''
  try {
    const source = renderer as Parameters<typeof exportPng>[0]
    if (format.value === 'png') {
      const r = await exportPng(source, state.doc.name, state.doc.page, dpi.value)
      result.value = `已导出 ${r.filename}（${r.width}×${r.height}px，${formatBytes(r.bytes)}）`
    } else {
      const r = await exportPdf(source, state.doc.name, state.doc.page, dpi.value)
      result.value = `已导出 ${r.filename}（${r.pageInfo.widthMm}×${r.pageInfo.heightMm}mm，${formatBytes(r.bytes)}）`
    }
    editor.toast('导出完成', 'ok')
  } catch (err) {
    const msg = err instanceof Error ? err.message : '导出失败'
    result.value = `导出失败：${msg}`
    editor.toast(msg, 'error')
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div v-if="open" class="mask" @click.self="emit('close')">
    <div class="dialog" role="dialog" aria-label="导出">
      <header class="dhead">
        <h2>导出</h2>
        <button class="btn ghost icon" @click="emit('close')" aria-label="关闭">✕</button>
      </header>

      <div class="dbody">
        <div class="page-info">
          <span class="pi-main">{{ state.doc.page.size }} · {{ state.doc.page.orientation === 'portrait' ? '纵向' : '横向' }}</span>
          <span class="pi-sub">{{ mm.width }} × {{ mm.height }} mm</span>
        </div>

        <div class="field">
          <label>格式</label>
          <div class="seg">
            <button class="seg-btn" :class="{ on: format === 'png' }" @click="format = 'png'">
              PNG 图片
            </button>
            <button class="seg-btn" :class="{ on: format === 'pdf' }" @click="format = 'pdf'">
              PDF 文档
            </button>
          </div>
        </div>

        <div class="field">
          <label>输出精度</label>
          <div class="seg three">
            <button
              v-for="o in DPI_OPTIONS"
              :key="o.v"
              class="seg-btn col"
              :class="{ on: dpi === o.v }"
              @click="dpi = o.v"
            >
              <b>{{ o.label }}</b>
              <i>{{ o.note }}</i>
            </button>
          </div>
        </div>

        <div class="pixel-note">
          输出像素 <b>{{ px.width }} × {{ px.height }}</b>
          <span>（按 {{ dpi }}dpi 重新排版渲染，不是放大预览图）</span>
        </div>

        <div v-if="checking" class="hint">正在检查版面…</div>
        <template v-else-if="check">
          <div v-if="check.overflow.length" class="alert warn">
            <b>{{ check.overflow.length }} 个元素超出纸张</b>
            <span>导出时会被裁切：</span>
            <ul>
              <li v-for="o in check.overflow.slice(0, 4)" :key="o.id">
                {{ o.name }}（超 {{ o.mm }}mm：{{ o.sides.join('、') }}）
              </li>
              <li v-if="check.overflow.length > 4">…另有 {{ check.overflow.length - 4 }} 个</li>
            </ul>
          </div>
          <div v-if="check.missingAssets.length" class="alert danger">
            <b>{{ check.missingAssets.length }} 张图片资源缺失</b>
            <span>这些图片会导出成空白占位。</span>
          </div>
          <div v-if="check.fonts.some((f) => !f.available)" class="alert warn">
            <b>本机缺少部分字体</b>
            <span>
              会由系统自动回退，排版可能与设计略有差异：
              {{ check.fonts.filter((f) => !f.available).map((f) => fontLabel(f.family)).join('、') }}
            </span>
          </div>
          <div v-if="!check.overflow.length && !check.missingAssets.length" class="alert ok">
            <b>版面检查通过</b>
            <span>元素都在纸张范围内，图片资源完整。</span>
          </div>
        </template>

        <p v-if="result" class="result">{{ result }}</p>
      </div>

      <footer class="dfoot">
        <span class="hint">导出文件直接下载到本机，不经过任何服务器。</span>
        <span class="grow" />
        <button class="btn" @click="emit('close')">关闭</button>
        <button class="btn primary" :disabled="busy" @click="run">
          {{ busy ? '渲染中…' : `导出 ${format.toUpperCase()}` }}
        </button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.mask {
  position: fixed;
  inset: 0;
  background: rgba(6, 5, 3, 0.66);
  backdrop-filter: blur(2px);
  display: grid;
  place-items: center;
  z-index: 100;
  padding: 16px;
}
.dialog {
  width: min(460px, 100%);
  max-height: calc(100vh - 32px);
  display: flex;
  flex-direction: column;
  background: var(--panel);
  border: 1px solid var(--line-2);
  border-radius: 10px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
  overflow: hidden;
}
.dhead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 12px 10px 16px;
  border-bottom: 1px solid var(--line);
  background: var(--panel-2);
}
.dhead h2 {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.16em;
  color: #e6d7b6;
}
.dbody {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}
.page-info {
  display: flex;
  align-items: baseline;
  gap: 9px;
  padding-bottom: 10px;
  border-bottom: 1px dashed var(--line-2);
}
.pi-main {
  font-size: 13px;
  color: var(--ink);
  letter-spacing: 0.06em;
}
.pi-sub {
  font-size: 11px;
  color: var(--ink-4);
  font-family: var(--font-mono);
}
.seg {
  display: flex;
  border: 1px solid var(--line-2);
  border-radius: 5px;
  overflow: hidden;
}
.seg-btn {
  flex: 1;
  height: 30px;
  font-size: 12.5px;
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
.seg.three .col {
  height: 46px;
  display: flex;
  flex-direction: column;
  gap: 1px;
  justify-content: center;
}
.seg.three .col b {
  font-size: 12px;
}
.seg.three .col i {
  font-size: 9.5px;
  font-style: normal;
  opacity: 0.7;
}
.pixel-note {
  font-size: 11px;
  color: var(--ink-3);
  line-height: 1.6;
}
.pixel-note b {
  color: var(--copper-2);
  font-family: var(--font-mono);
}
.pixel-note span {
  color: var(--ink-4);
}
.alert {
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 11.5px;
  line-height: 1.6;
  border: 1px solid var(--line-2);
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.alert b {
  font-size: 12px;
}
.alert ul {
  margin: 2px 0 0;
  padding-left: 16px;
  color: var(--ink-3);
}
.alert.ok {
  border-color: rgba(116, 160, 108, 0.35);
  background: rgba(116, 160, 108, 0.08);
  color: #9fc097;
}
.alert.warn {
  border-color: rgba(211, 160, 74, 0.35);
  background: rgba(211, 160, 74, 0.07);
  color: var(--warn);
}
.alert.danger {
  border-color: rgba(194, 90, 77, 0.4);
  background: rgba(194, 90, 77, 0.08);
  color: var(--danger);
}
.result {
  margin: 0;
  font-size: 11.5px;
  color: var(--ok);
  word-break: break-all;
}
.dfoot {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-top: 1px solid var(--line);
  background: var(--panel-2);
}
.dfoot .hint {
  max-width: 190px;
  line-height: 1.4;
}
@media (max-width: 520px) {
  .dfoot .hint {
    display: none;
  }
}
</style>
