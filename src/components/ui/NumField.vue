<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: number
    min?: number
    max?: number
    step?: number
    label?: string
    suffix?: string
    disabled?: boolean
  }>(),
  { min: -9999, max: 9999, step: 1, suffix: '', disabled: false },
)
const emit = defineEmits<{ (e: 'change', v: number): void }>()

function onChange(e: Event): void {
  const raw = (e.target as HTMLInputElement).value
  const n = Number(raw)
  if (!Number.isFinite(n)) {
    ;(e.target as HTMLInputElement).value = String(props.modelValue)
    return
  }
  const clamped = Math.min(props.max, Math.max(props.min, n))
  ;(e.target as HTMLInputElement).value = String(clamped)
  if (clamped !== props.modelValue) emit('change', clamped)
}
</script>

<template>
  <label class="num">
    <span v-if="label" class="lbl">{{ label }}</span>
    <span class="box">
      <input
        type="number"
        :value="Math.round(modelValue * 10) / 10"
        :min="min"
        :max="max"
        :step="step"
        :disabled="disabled"
        @change="onChange"
        @keyup.enter="onChange"
      />
      <i v-if="suffix">{{ suffix }}</i>
    </span>
  </label>
</template>

<style scoped>
.num {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.lbl {
  font-size: 11px;
  color: var(--ink-3);
}
.box {
  position: relative;
  display: flex;
  align-items: center;
}
input {
  width: 100%;
  height: 28px;
  padding: 0 22px 0 8px;
  background: #120f0b;
  border: 1px solid var(--line-2);
  border-radius: 5px;
  color: var(--ink);
  outline: none;
  font-variant-numeric: tabular-nums;
  -moz-appearance: textfield;
  appearance: textfield;
}
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input:focus {
  border-color: var(--copper);
  box-shadow: 0 0 0 2px rgba(201, 154, 81, 0.13);
}
input:disabled {
  opacity: 0.4;
}
i {
  position: absolute;
  right: 7px;
  font-size: 10px;
  font-style: normal;
  color: var(--ink-4);
  pointer-events: none;
}
</style>
