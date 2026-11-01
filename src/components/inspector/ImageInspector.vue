<script setup lang="ts">
import { ref } from 'vue'
import { editor } from '@/store/editor'
import { importImageFile } from '@/core/image'
import { newId } from '@/core/id'
import NumField from '../ui/NumField.vue'
import ColorField from '../ui/ColorField.vue'
import type { ImageElement, ImageTone } from '@/types/project'

const props = defineProps<{ el: ImageElement }>()
const fileInput = ref<HTMLInputElement>()

const TONES: { v: ImageTone; label: string }[] = [
  { v: 'none', label: '原色' },
  { v: 'gray', label: '黑白' },
  { v: 'sepia', label: '做旧' },
  { v: 'blueprint', label: '蓝图' },
]

function patch(p: Partial<ImageElement>, key?: string): void {
  editor.updateElement(props.el.id, p, key)
}

async function replace(e: Event): Promise<void> {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  try {
    const img = await importImageFile(file)
    const asset = {
      id: newId('asset'),
      name: img.name,
      mime: img.mime,
      dataUrl: img.dataUrl,
      width: img.width,
      height: img.height,
      createdAt: Date.now(),
    }
    editor.state.doc.assets.push(asset)
    patch({ assetId: asset.id, name: img.name })
    editor.purgeUnusedAssets()
    editor.toast('图片已替换', 'ok')
  } catch (err) {
    editor.toast(err instanceof Error ? err.message : '替换失败', 'error')
  }
}
</script>

<template>
  <div class="sec">
    <div class="section-title">图片</div>
    <div class="pad">
      <button class="btn wide" @click="fileInput?.click()">替换为本地图片…</button>
      <input
        ref="fileInput"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/bmp,image/avif"
        class="hidden"
        @change="replace"
      />
      <div class="field">
        <label>裁切方式</label>
        <div class="seg">
          <button class="seg-btn" :class="{ on: el.fit === 'cover' }" @click="patch({ fit: 'cover' })">
            填满裁切
          </button>
          <button class="seg-btn" :class="{ on: el.fit === 'fill' }" @click="patch({ fit: 'fill' })">
            拉伸铺满
          </button>
        </div>
      </div>
      <div class="field">
        <label>色调</label>
        <div class="seg">
          <button
            v-for="t in TONES"
            :key="t.v"
            class="seg-btn"
            :class="{ on: el.tone === t.v }"
            @click="patch({ tone: t.v })"
          >
            {{ t.label }}
          </button>
        </div>
      </div>
      <NumField
        label="圆角"
        suffix="px"
        :model-value="el.cornerRadius"
        :min="0"
        :max="400"
        @change="patch({ cornerRadius: $event }, `cr:${el.id}`)"
      />
    </div>
  </div>

  <div class="sec">
    <div class="section-title">描边</div>
    <div class="pad">
      <ColorField label="颜色" allow-transparent :model-value="el.stroke" @change="patch({ stroke: $event }, `st:${el.id}`)" />
      <NumField
        label="宽度"
        suffix="px"
        :model-value="el.strokeWidth"
        :min="0"
        :max="40"
        :step="0.5"
        @change="patch({ strokeWidth: $event }, `sw:${el.id}`)"
      />
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
.wide {
  width: 100%;
  justify-content: center;
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
