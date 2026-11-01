<script setup lang="ts">
import TemplatePanel from './panels/TemplatePanel.vue'
import AssetPanel from './panels/AssetPanel.vue'
import LayerPanel from './panels/LayerPanel.vue'
import ProjectPanel from './panels/ProjectPanel.vue'

export type LeftTab = 'templates' | 'assets' | 'layers' | 'projects'

const props = defineProps<{ active: LeftTab }>()
const emit = defineEmits<{ (e: 'update:active', tab: LeftTab): void }>()

const TABS: { id: LeftTab; label: string }[] = [
  { id: 'templates', label: '模板' },
  { id: 'assets', label: '素材' },
  { id: 'layers', label: '图层' },
  { id: 'projects', label: '项目' },
]

function setTab(id: LeftTab): void {
  emit('update:active', id)
}
</script>

<template>
  <aside class="side">
    <nav class="tabs">
      <button
        v-for="t in TABS"
        :key="t.id"
        class="tab"
        :class="{ on: props.active === t.id }"
        @click="setTab(t.id)"
      >
        {{ t.label }}
      </button>
    </nav>
    <div class="body">
      <TemplatePanel v-if="props.active === 'templates'" />
      <AssetPanel v-else-if="props.active === 'assets'" />
      <LayerPanel v-else-if="props.active === 'layers'" />
      <ProjectPanel v-else />
    </div>
  </aside>
</template>

<style scoped>
.side {
  display: flex;
  flex-direction: column;
  width: var(--left-w);
  flex: none;
  min-height: 0;
  background: var(--panel);
  border-right: 1px solid var(--line);
  z-index: 20;
}
.tabs {
  display: flex;
  flex: none;
  border-bottom: 1px solid var(--line);
  background: var(--panel-2);
}
.tab {
  flex: 1;
  height: 34px;
  font-size: 12px;
  color: var(--ink-3);
  position: relative;
  letter-spacing: 0.06em;
  transition: color 0.13s;
}
.tab:hover {
  color: var(--ink-2);
}
.tab.on {
  color: var(--copper-2);
}
.tab.on::after {
  content: '';
  position: absolute;
  left: 20%;
  right: 20%;
  bottom: -1px;
  height: 2px;
  background: var(--copper);
  border-radius: 2px;
}
.body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
@media (max-width: 860px) {
  .side {
    width: min(84vw, 320px);
  }
}
</style>
