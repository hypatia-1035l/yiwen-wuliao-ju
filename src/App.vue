<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import TopBar from './components/TopBar.vue'
import SidePanel from './components/SidePanel.vue'
import CanvasStage from './components/CanvasStage.vue'
import Inspector from './components/Inspector.vue'
import ExportDialog from './components/ExportDialog.vue'
import { editor, state } from './store/editor'
import type { LeftTab } from './components/SidePanel.vue'

const leftTab = ref<LeftTab>('templates')
const leftOpen = ref(false)
const rightOpen = ref(false)
const exportOpen = ref(false)
const canvasRef = ref<InstanceType<typeof CanvasStage>>()
const inspRef = ref<InstanceType<typeof Inspector>>()

function openLeft(tab: LeftTab): void {
  leftTab.value = tab
  leftOpen.value = true
}

function onEditText(id: string): void {
  editor.select(id)
  rightOpen.value = true
  requestAnimationFrame(() => inspRef.value?.focusText())
}

function isTypingTarget(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable
}

function onKeydown(e: KeyboardEvent): void {
  const mod = e.ctrlKey || e.metaKey
  const typing = isTypingTarget(e.target)

  if (mod && e.key.toLowerCase() === 'z') {
    if (typing) return
    e.preventDefault()
    e.shiftKey ? editor.redo() : editor.undo()
    return
  }
  if (mod && e.key.toLowerCase() === 'y') {
    if (typing) return
    e.preventDefault()
    editor.redo()
    return
  }
  if (mod && e.key.toLowerCase() === 's') {
    e.preventDefault()
    void editor.persistNow().then(() => editor.toast('已保存到本机', 'ok'))
    return
  }
  if (mod && e.key.toLowerCase() === 'd') {
    if (typing) return
    e.preventDefault()
    editor.duplicateSelected()
    return
  }
  if ((e.key === 'Delete' || e.key === 'Backspace') && !typing) {
    if (state.view.selectedIds.length) {
      e.preventDefault()
      editor.deleteSelected()
    }
    return
  }
  if (e.key === 'Escape') {
    if (exportOpen.value) {
      exportOpen.value = false
      return
    }
    editor.clearSelection()
    leftOpen.value = false
    rightOpen.value = false
    return
  }
  if (!typing && state.view.selectedIds.length && e.key.startsWith('Arrow')) {
    e.preventDefault()
    const step = e.shiftKey ? 10 : 1
    const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
    const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0
    editor.nudgeSelected(dx, dy)
  }
}

onMounted(async () => {
  window.addEventListener('keydown', onKeydown)
  await editor.bootstrap()
  await editor.refreshProjects()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div class="app">
    <TopBar
      @export="exportOpen = true"
      @open-left="openLeft"
      @toggle-left="leftOpen = !leftOpen"
      @toggle-right="rightOpen = !rightOpen"
    />

    <div class="main">
      <SidePanel v-model:active="leftTab" :class="{ 'drawer-left': true, open: leftOpen }" />

      <CanvasStage ref="canvasRef" @edit-text="onEditText" />

      <Inspector ref="inspRef" :class="{ 'drawer-right': true, open: rightOpen }" />
    </div>

    <div
      v-if="leftOpen || rightOpen"
      class="scrim"
      @click="
        () => {
          leftOpen = false
          rightOpen = false
        }
      "
    />

    <div class="toasts">
      <div v-for="t in state.toasts" :key="t.id" class="toast" :class="t.type">
        {{ t.text }}
      </div>
    </div>

    <ExportDialog
      :open="exportOpen"
      :get-renderer="() => canvasRef?.getRenderer() ?? null"
      @close="exportOpen = false"
    />
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
.main {
  flex: 1;
  display: flex;
  min-height: 0;
  position: relative;
}
.scrim {
  display: none;
}
.toasts {
  position: fixed;
  left: 50%;
  bottom: 58px;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  gap: 6px;
  z-index: 200;
  pointer-events: none;
  width: min(90vw, 420px);
}
.toast {
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 12.5px;
  line-height: 1.5;
  background: rgba(32, 26, 20, 0.96);
  border: 1px solid var(--line-2);
  color: var(--ink);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  animation: rise 0.18s ease-out;
  text-align: center;
}
.toast.ok {
  border-color: rgba(116, 160, 108, 0.45);
}
.toast.warn {
  border-color: rgba(211, 160, 74, 0.45);
  color: var(--warn);
}
.toast.error {
  border-color: rgba(194, 90, 77, 0.5);
  color: #e09084;
}
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (max-width: 860px) {
  .drawer-left,
  .drawer-right {
    position: absolute;
    top: 0;
    bottom: 0;
    transition: transform 0.2s ease;
    box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
  }
  .drawer-left {
    left: 0;
    transform: translateX(-104%);
  }
  .drawer-left.open {
    transform: none;
  }
  .drawer-right {
    right: 0;
    transform: translateX(104%);
  }
  .drawer-right.open {
    transform: none;
  }
  .scrim {
    display: block;
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.42);
    z-index: 15;
  }
}
</style>
