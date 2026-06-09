<script setup lang="ts">
import { ref, watch } from 'vue'
import { useDailyProgress } from '../composables/useDailyProgress'

const { count, goal, percent, reached, updateGoal } = useDailyProgress()

const editing = ref(false)
const draft = ref(goal.value)
watch(goal, (g) => (draft.value = g))

const save = () => {
  updateGoal(draft.value)
  editing.value = false
}
</script>

<template>
  <section class="panel daily-panel">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Сьогодні</p>
        <h2>Денна ціль</h2>
      </div>
      <button
        v-if="!editing"
        class="ghost-button small"
        type="button"
        @click="editing = true"
      >
        Змінити
      </button>
    </div>

    <div class="daily-body">
      <div class="accuracy-ring" :style="{ '--score': `${percent}%` }">
        <strong>{{ count }}</strong>
        <span>/ {{ goal }}</span>
      </div>
      <div class="daily-copy">
        <p v-if="reached" class="daily-done">🎯 Ціль виконана! Чудова робота.</p>
        <p v-else class="muted compact">
          Ще {{ goal - count }} {{ count + 1 === goal ? 'картка' : 'карток' }} до денної цілі.
        </p>
      </div>
    </div>

    <form v-if="editing" class="daily-edit" @submit.prevent="save">
      <label class="eyebrow" for="daily-goal-input">Карток на день</label>
      <div class="daily-edit-row">
        <input
          id="daily-goal-input"
          v-model.number="draft"
          class="mic-select"
          type="number"
          min="1"
          max="500"
          inputmode="numeric"
        />
        <button class="primary-button" type="submit">Зберегти</button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.daily-panel {
  display: grid;
  gap: 14px;
}

/* Внутрішній gap панелі вже розділяє блоки — глобальний margin зайвий. */
.daily-panel .section-heading {
  margin-bottom: 0;
}

.daily-body {
  display: flex;
  align-items: center;
  gap: 18px;
}

.daily-copy {
  flex: 1;
}

.daily-done {
  margin: 0;
  font-weight: 700;
  color: var(--mint-strong);
}

.daily-edit {
  display: grid;
  gap: 6px;
}

.daily-edit-row {
  display: flex;
  gap: 10px;
}

.daily-edit-row input {
  width: 100px;
}
</style>
