<script setup lang="ts">
import { TEMPLATES } from '@/data/templates'
import { editor, state } from '@/store/editor'

function use(templateId: string, name: string): void {
  editor.createFromTemplate(templateId)
  editor.toast(`已创建「${name}」，可在「项目」里找回上一个作品`, 'info')
}
</script>

<template>
  <div class="tpl-list">
    <p class="lead">选一个母版开始。所有文字、图形都可改，版式不锁定。</p>
    <button v-for="t in TEMPLATES" :key="t.id" class="tpl" @click="use(t.id, t.name)">
      <div class="thumb" :class="`thumb-${t.id}`" :style="{ '--accent': t.accent }">
        <template v-if="t.id === 'commission'">
          <span class="frame-outer" /><span class="frame-inner" />
          <span class="t-title">委托书</span>
          <span class="l1" /><span class="l2" /><span class="l3" />
        </template>
        <template v-else-if="t.id === 'dossier'">
          <span class="d-head" />
          <span class="d-title">调查档案</span>
          <span class="d-row" v-for="i in 4" :key="i" :style="{ top: `${50 + i * 6}px` }" />
          <span class="d-box" />
        </template>
        <template v-else-if="t.id === 'wanted'">
          <span class="w-frame" />
          <span class="w-title">通缉</span>
          <span class="w-photo" />
          <span class="w-sub">WANTED</span>
        </template>
        <template v-else>
          <span class="y-rule" v-for="i in 7" :key="i" :style="{ top: `${18 + i * 9}%` }" />
          <span class="y-date" />
          <span class="y-note" />
        </template>
      </div>
      <div class="meta">
        <div class="meta-top">
          <b>{{ t.name }}</b>
          <i>{{ t.size }}</i>
        </div>
        <span>{{ t.blurb }}</span>
      </div>
    </button>
    <p class="hint">当前项目：{{ state.doc.name }}（{{ state.doc.elements.length }} 个元素）</p>
  </div>
</template>

<style scoped>
.tpl-list {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.lead {
  margin: 0 2px 2px;
  font-size: 11.5px;
  color: var(--ink-3);
  line-height: 1.6;
}
.tpl {
  display: flex;
  gap: 10px;
  padding: 8px;
  text-align: left;
  border: 1px solid var(--line);
  border-radius: 7px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent);
  transition: border-color 0.14s, background 0.14s, transform 0.14s;
}
.tpl:hover {
  border-color: var(--line-2);
  background: rgba(201, 154, 81, 0.06);
}
.tpl:active {
  transform: scale(0.995);
}
.thumb {
  position: relative;
  flex: none;
  width: 62px;
  height: 84px;
  border-radius: 2px;
  background: #ede0c4;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.45);
}
.meta {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
  justify-content: center;
}
.meta-top {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.meta b {
  font-size: 13px;
  color: var(--ink);
  font-weight: 600;
}
.meta i {
  font-size: 9.5px;
  font-style: normal;
  color: var(--copper);
  border: 1px solid var(--line-2);
  border-radius: 3px;
  padding: 0 4px;
  line-height: 1.5;
}
.meta span {
  font-size: 10.5px;
  color: var(--ink-4);
  line-height: 1.5;
}

/* 缩略示意 */
.frame-outer,
.frame-inner {
  position: absolute;
  border: 1.5px solid #8a6a3a;
}
.frame-outer {
  inset: 5px;
}
.frame-inner {
  inset: 8px;
  border-width: 0.5px;
}
.t-title {
  position: absolute;
  top: 26px;
  left: 0;
  right: 0;
  text-align: center;
  font-family: var(--font-serif);
  font-size: 9px;
  letter-spacing: 1px;
  color: #3a2e1e;
}
.l1,
.l2,
.l3 {
  position: absolute;
  left: 12px;
  right: 12px;
  height: 1.5px;
  background: rgba(74, 58, 36, 0.4);
}
.l1 {
  top: 42px;
}
.l2 {
  top: 48px;
}
.l3 {
  top: 54px;
}

.d-head {
  position: absolute;
  inset: 0 0 auto;
  height: 20px;
  background: #24364d;
}
.d-title {
  position: absolute;
  top: 42px;
  left: 8px;
  font-family: var(--font-serif);
  font-size: 8px;
  color: #24364d;
}
.d-row {
  position: absolute;
  left: 8px;
  right: 8px;
  height: 1px;
  background: rgba(36, 54, 77, 0.35);
}
.d-box {
  position: absolute;
  right: 8px;
  bottom: 10px;
  width: 20px;
  height: 24px;
  border: 0.8px dashed #8b93a0;
  background: #e6e4dd;
}

.w-frame {
  position: absolute;
  inset: 4px;
  border: 2.5px solid #241c12;
}
.w-title {
  position: absolute;
  top: 12px;
  left: 0;
  right: 0;
  text-align: center;
  font-family: var(--font-serif);
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 2px;
  color: #241c12;
}
.w-photo {
  position: absolute;
  top: 32px;
  left: 50%;
  transform: translateX(-50%);
  width: 26px;
  height: 30px;
  border: 1.5px solid #241c12;
  background: #d8bf97;
}
.w-sub {
  position: absolute;
  bottom: 8px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 6px;
  letter-spacing: 1.5px;
  color: #8c3a2f;
}

.y-rule {
  position: absolute;
  left: 8px;
  right: 8px;
  height: 0.7px;
  background: rgba(120, 100, 70, 0.45);
}
.y-date {
  position: absolute;
  top: 9px;
  left: 10px;
  width: 30px;
  height: 2px;
  background: rgba(61, 52, 42, 0.6);
}
.y-note {
  position: absolute;
  right: 8px;
  bottom: 12px;
  width: 22px;
  height: 18px;
  background: #f2e7c9;
  border: 0.6px solid #c2ab84;
  transform: rotate(-5deg);
}
</style>
