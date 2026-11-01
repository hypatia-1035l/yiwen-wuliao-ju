<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { editor, state } from '@/store/editor'
import { storageEstimate } from '@/persistence/db'
import { formatBytes } from '@/export/download'

const usage = ref('')

onMounted(async () => {
  await editor.refreshProjects()
  await usageText()
})

async function usageText(): Promise<void> {
  const est = await storageEstimate()
  if (!est) {
    usage.value = ''
    return
  }
  usage.value = `本地已用 ${formatBytes(est.usage)}`
}

function stamp(t: number): string {
  const d = new Date(t)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

async function open(id: string): Promise<void> {
  await editor.openProject(id)
  await editor.persistNow()
}

async function remove(id: string, name: string): Promise<void> {
  if (!window.confirm(`删除本地项目「${name}」？此操作不可撤销。`)) return
  await editor.removeProject(id)
  await usageText()
}
</script>

<template>
  <div class="proj-panel">
    <div class="section-title">
      本地项目（{{ state.projects.length }}）
      <button class="btn ghost sm" @click="editor.refreshProjects().then(usageText)">刷新</button>
    </div>

    <p v-if="!state.storageOk" class="warn">
      本地数据库不可用，项目不会被自动保存。仍可导出 JSON / PNG / PDF。
    </p>

    <div class="list">
      <p v-if="!state.projects.length" class="empty">
        还没有存档。编辑器会自动把当前作品存在浏览器里，稍等或点「刷新」。
      </p>
      <div
        v-for="p in state.projects"
        :key="p.id"
        class="item"
        :class="{ cur: p.id === state.doc.id }"
      >
        <button class="main" @click="open(p.id)">
          <b>{{ p.name }}</b>
          <span class="meta">{{ stamp(p.updatedAt) }} · {{ p.elementCount }} 元素 · {{ p.pageSize }}</span>
        </button>
        <button class="del" title="删除" @click="remove(p.id, p.name)">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4">
            <path d="M3 4h10M6 4V2.8h4V4M4.5 4l.6 9h5.8l.6-9" />
          </svg>
        </button>
      </div>
    </div>

    <div class="foot">
      <span class="hint">{{ usage }}</span>
      <span class="hint">数据只存在本机浏览器</span>
    </div>
  </div>
</template>

<style scoped>
.proj-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}
.list {
  flex: 1;
  overflow-y: auto;
  padding: 6px;
  min-height: 0;
}
.empty {
  padding: 16px 10px;
  font-size: 11.5px;
  color: var(--ink-4);
  line-height: 1.7;
  text-align: center;
}
.warn {
  margin: 8px 10px;
  padding: 8px 10px;
  font-size: 11px;
  line-height: 1.6;
  color: var(--warn);
  border: 1px solid rgba(211, 160, 74, 0.3);
  border-radius: 5px;
  background: rgba(211, 160, 74, 0.07);
}
.item {
  display: flex;
  align-items: stretch;
  gap: 2px;
  border-radius: 5px;
  border: 1px solid transparent;
}
.item:hover {
  background: rgba(201, 154, 81, 0.06);
}
.item.cur {
  border-color: var(--line-2);
  background: rgba(201, 154, 81, 0.1);
}
.main {
  flex: 1;
  min-width: 0;
  text-align: left;
  padding: 7px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.main b {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--ink-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.item.cur .main b {
  color: var(--ink);
}
.meta {
  font-size: 10px;
  color: var(--ink-4);
}
.del {
  width: 26px;
  display: grid;
  place-items: center;
  color: var(--ink-4);
  border-radius: 4px;
  flex: none;
}
.del:hover {
  color: var(--danger);
  background: rgba(194, 90, 77, 0.12);
}
.foot {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 10px;
  border-top: 1px solid var(--line);
}
</style>
