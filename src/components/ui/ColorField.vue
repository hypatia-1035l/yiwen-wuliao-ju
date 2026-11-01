<script setup lang="ts">
const props = defineProps<{ modelValue: string; label?: string; allowTransparent?: boolean }>()
const emit = defineEmits<{ (e: 'change', v: string): void }>()

const PRESETS = ['#1b1712', '#7a2b23', '#a8732a', '#24364d', '#6b543a', '#f3ead6', '#ffffff']

function normalize(v: string): string {
  const s = v.trim()
  if (s === 'transparent') return s
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s)) return s
  if (/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s)) return `#${s}`
  return props.modelValue
}

function onHex(e: Event): void {
  const v = normalize((e.target as HTMLInputElement).value)
  if (v !== props.modelValue) emit('change', v)
  ;(e.target as HTMLInputElement).value = v
}

function onPick(e: Event): void {
  emit('change', (e.target as HTMLInputElement).value)
}

function setPreset(c: string): void {
  emit('change', c)
}
</script>

<template>
  <div class="color">
    <span v-if="label" class="lbl">{{ label }}</span>
    <div class="row">
      <input
        class="picker"
        type="color"
        :value="modelValue === 'transparent' ? '#000000' : modelValue"
        @input="onPick"
      />
      <input class="hex" type="text" :value="modelValue" spellcheck="false" @change="onHex" />
    </div>
    <div class="swatches">
      <button
        v-if="allowTransparent"
        class="sw none"
        :class="{ on: modelValue === 'transparent' }"
        title="透明"
        @click="setPreset('transparent')"
      />
      <button
        v-for="c in PRESETS"
        :key="c"
        class="sw"
        :class="{ on: modelValue.toLowerCase() === c }"
        :style="{ background: c }"
        :title="c"
        @click="setPreset(c)"
      />
    </div>
  </div>
</template>

<style scoped>
.color {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}
.lbl {
  font-size: 11px;
  color: var(--ink-3);
}
.row {
  display: flex;
  gap: 6px;
}
.picker {
  width: 34px;
  height: 26px;
  flex: none;
  padding: 2px;
  background: #120f0b;
  border: 1px solid var(--line-2);
  border-radius: 5px;
  cursor: pointer;
}
.hex {
  flex: 1;
  min-width: 0;
  height: 26px;
  padding: 0 7px;
  background: #120f0b;
  border: 1px solid var(--line-2);
  border-radius: 5px;
  color: var(--ink-2);
  font-family: var(--font-mono);
  font-size: 11px;
  outline: none;
}
.hex:focus {
  border-color: var(--copper);
}
.swatches {
  display: flex;
  gap: 4px;
}
.sw {
  width: 17px;
  height: 17px;
  border-radius: 3px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  transition: transform 0.1s;
}
.sw:hover {
  transform: scale(1.14);
}
.sw.on {
  outline: 1.5px solid var(--copper-2);
  outline-offset: 1px;
}
.sw.none {
  background: repeating-linear-gradient(
    45deg,
    #3a332b,
    #3a332b 3px,
    #221c16 3px,
    #221c16 6px
  );
}
</style>
