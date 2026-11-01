<script setup lang="ts">
import { computed, ref } from 'vue'
import { editor, state } from '@/store/editor'
import { exportProjectFile, readProjectFile } from '@/export/json'

const emit = defineEmits<{
  (e: 'export'): void
  (e: 'open-left', tab: 'templates' | 'layers' | 'projects'): void
  (e: 'toggle-left'): void
  (e: 'toggle-right'): void
}>()

const menuOpen = ref(false)
const fileInput = ref<HTMLInputElement>()

const savedLabel = computed(() => {
  if (!state.storageOk) return '仅本地导出'
  if (state.saving) return '保存中…'
  if (!state.savedAt) return '未保存'
  const d = new Date(state.savedAt)
  const p = (n: number) => String(n).padStart(2, '0')
  return `已存 ${p(d.getHours())}:${p(d.getMinutes())}`
})

function onNameInput(e: Event): void {
  editor.renameProject((e.target as HTMLInputElement).value)
}

async function onImportFile(e: Event): Promise<void> {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  try {
    const raw = await readProjectFile(file)
    editor.importDoc(raw)
  } catch (err) {
    editor.toast(err instanceof Error ? err.message : '导入失败', 'error')
  }
}

function saveCopy(): void {
  menuOpen.value = false
  const name = exportProjectFile(state.doc)
  editor.toast(`已导出 ${name}`, 'ok')
}

function pickMenu(action: 'new' | 'open'): void {
  menuOpen.value = false
  emit('open-left', action === 'new' ? 'templates' : 'projects')
}
</script>

<template>
  <header class="topbar">
    <button class="btn ghost icon only-mobile" title="面板" @click="emit('toggle-left')">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4">
        <path d="M2 4h12M2 8h12M2 12h12" />
      </svg>
    </button>

    <div class="brand" title="异闻物料局">
      <span class="mark">異</span>
      <span class="brand-text">
        <b>异闻物料局</b>
        <i>0.1</i>
      </span>
    </div>

    <div class="name-wrap">
      <input
        class="name-input"
        :value="state.doc.name"
        spellcheck="false"
        aria-label="项目名称"
        @input="onNameInput"
        @keyup.enter="($event.target as HTMLInputElement).blur()"
      />
    </div>

    <div class="spacer" />

    <div class="group hist">
      <button
        class="btn ghost icon"
        title="撤销 (Ctrl+Z)"
        :disabled="!state.hist.canUndo"
        @click="editor.undo()"
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4">
          <path d="M6 4L3 7l3 3" />
          <path d="M3 7h6a4 4 0 1 1 0 8H7" />
        </svg>
      </button>
      <button
        class="btn ghost icon"
        title="重做 (Ctrl+Shift+Z)"
        :disabled="!state.hist.canRedo"
        @click="editor.redo()"
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4">
          <path d="M10 4l3 3-3 3" />
          <path d="M13 7H7a4 4 0 1 0 0 8h2" />
        </svg>
      </button>
    </div>

    <span class="save-state" :class="{ err: !!state.saveError }" :title="state.saveError || '本地自动保存'">
      <i class="dot" />
      {{ savedLabel }}
    </span>

    <div class="menu-wrap">
      <button class="btn" @click="menuOpen = !menuOpen">
        文件
        <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M2 4l3 3 3-3" />
        </svg>
      </button>
      <div v-if="menuOpen" class="menu" @mouseleave="menuOpen = false">
        <button class="menu-item" @click="pickMenu('new')">新建（选模板）</button>
        <button class="menu-item" @click="pickMenu('open')">打开本地项目</button>
        <div class="menu-sep" />
        <button class="menu-item" @click="saveCopy">导出项目 JSON</button>
        <button class="menu-item" @click="fileInput?.click()">导入项目 JSON</button>
      </div>
      <input
        ref="fileInput"
        type="file"
        accept=".json,application/json"
        class="hidden"
        @change="onImportFile"
      />
    </div>

    <button class="btn primary export-btn" @click="emit('export')">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M8 2v8M5 7l3 3 3-3" />
        <path d="M2.5 12.5v1h11v-1" />
      </svg>
      导出
    </button>

    <button class="btn ghost icon only-mobile" title="属性" @click="emit('toggle-right')">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4">
        <circle cx="8" cy="8" r="2.2" />
        <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2" />
      </svg>
    </button>
  </header>
</template>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  gap: 8px;
  height: var(--top-h);
  padding: 0 10px 0 12px;
  background: linear-gradient(180deg, #1d1812, #171310);
  border-bottom: 1px solid var(--line-2);
  flex: none;
  z-index: 30;
}
.brand {
  display: flex;
  align-items: center;
  gap: 7px;
  flex: none;
}
.mark {
  display: grid;
  place-items: center;
  width: 25px;
  height: 25px;
  border: 1px solid var(--copper);
  border-radius: 3px;
  font-family: var(--font-serif);
  font-size: 15px;
  color: var(--copper-2);
  background: rgba(201, 154, 81, 0.08);
  transform: rotate(-2deg);
}
.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.05;
}
.brand-text b {
  font-family: var(--font-serif);
  font-size: 13.5px;
  letter-spacing: 0.13em;
  color: #e6d7b6;
  font-weight: 600;
}
.brand-text i {
  font-size: 9px;
  color: var(--ink-4);
  font-style: normal;
  letter-spacing: 0.1em;
}
.name-wrap {
  flex: 0 1 260px;
  margin-left: 6px;
}
.name-input {
  width: 100%;
  height: 28px;
  padding: 0 8px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 5px;
  color: var(--ink-2);
  font-size: 12.5px;
  outline: none;
  transition: all 0.12s;
}
.name-input:hover {
  border-color: var(--line);
}
.name-input:focus {
  background: #100d0a;
  border-color: var(--copper);
  color: var(--ink);
}
.spacer {
  flex: 1;
}
.group {
  display: flex;
  gap: 1px;
}
.save-state {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--ink-4);
  white-space: nowrap;
  padding: 0 4px;
}
.save-state .dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--ok);
}
.save-state.err {
  color: var(--danger);
}
.save-state.err .dot {
  background: var(--danger);
}
.menu-wrap {
  position: relative;
}
.menu {
  position: absolute;
  right: 0;
  top: calc(100% + 5px);
  min-width: 168px;
  padding: 5px;
  background: #201a14;
  border: 1px solid var(--line-2);
  border-radius: 7px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.55);
  z-index: 60;
}
.menu-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 7px 9px;
  border-radius: 4px;
  font-size: 12.5px;
  color: var(--ink-2);
}
.menu-item:hover {
  background: rgba(201, 154, 81, 0.12);
  color: var(--ink);
}
.menu-sep {
  height: 1px;
  background: var(--line);
  margin: 4px 2px;
}
.only-mobile {
  display: none;
}
@media (max-width: 860px) {
  .only-mobile {
    display: inline-flex;
  }
  .name-wrap {
    display: none;
  }
  .save-state {
    display: none;
  }
  .brand-text i {
    display: none;
  }
  .topbar {
    gap: 6px;
    padding: 0 8px;
  }
  .export-btn {
    padding: 0 10px;
  }
}
</style>
