<script setup lang="ts">
import { computed } from 'vue'
import { useActivityLog } from '../composables/useActivityLog'
import { buildCalendar, activeDays, monthShort } from '../utils/calendar'

const WEEKS = 16
const { log } = useActivityLog()
const today = new Date().toISOString().slice(0, 10)

const weeks = computed(() => buildCalendar(log.value, today, WEEKS))
const total = computed(() => activeDays(weeks.value))

// One label per week column, shown only when the month changes.
const monthLabels = computed(() =>
  weeks.value.map((week, i) => {
    const current = monthShort(week[0]!.date)
    const prev = i > 0 ? monthShort(weeks.value[i - 1]![0]!.date) : ''
    return current !== prev ? current : ''
  }),
)

const WEEKDAY_LABELS = ['Пн', '', 'Ср', '', 'Пт', '', '']

const cellTitle = (date: string, count: number) =>
  count > 0 ? `${date}: ${count} відповідей` : `${date}: без активності`
</script>

<template>
  <section class="panel calendar-panel">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Активність</p>
        <h2>Останні {{ WEEKS }} тижнів</h2>
      </div>
      <div class="panel-score">
        <strong>{{ total }}</strong>
        <span>активних днів</span>
      </div>
    </div>

    <div class="cal-scroll">
      <div class="cal-months">
        <span class="cal-wd-spacer" aria-hidden="true" />
        <span v-for="(label, i) in monthLabels" :key="`m-${i}`" class="cal-month">{{ label }}</span>
      </div>

      <div class="cal-body">
        <div class="cal-weekdays" aria-hidden="true">
          <span v-for="(wd, i) in WEEKDAY_LABELS" :key="`wd-${i}`">{{ wd }}</span>
        </div>
        <div class="cal-cols">
          <div v-for="(week, wi) in weeks" :key="`w-${wi}`" class="cal-col">
            <i
              v-for="day in week"
              :key="day.date"
              class="cal-cell"
              :class="[`level-${day.level}`, { future: day.future }]"
              :title="cellTitle(day.date, day.count)"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="cal-legend">
      <span>менше</span>
      <i class="cal-cell level-0" />
      <i class="cal-cell level-1" />
      <i class="cal-cell level-2" />
      <i class="cal-cell level-3" />
      <i class="cal-cell level-4" />
      <span>більше</span>
    </div>
  </section>
</template>

<style scoped>
.calendar-panel {
  display: grid;
  gap: 12px;
}

/* Внутрішній gap панелі вже розділяє блоки — глобальний margin зайвий. */
.calendar-panel .section-heading {
  margin-bottom: 0;
}

.cal-scroll {
  overflow-x: auto;
  padding-bottom: 4px;
}

.cal-cell {
  width: 13px;
  height: 13px;
  border-radius: 3px;
  background: var(--divider);
  flex: 0 0 auto;
}

.cal-cell.level-1 {
  background: #bde6d6;
}
.cal-cell.level-2 {
  background: #7fd3b4;
}
.cal-cell.level-3 {
  background: #45b89c;
}
.cal-cell.level-4 {
  background: #2f8e77;
}
.cal-cell.future {
  opacity: 0.35;
}

.cal-months {
  display: flex;
  gap: 3px;
  margin-bottom: 4px;
}

.cal-wd-spacer {
  width: 24px;
  flex: 0 0 auto;
}

.cal-month {
  width: 13px;
  flex: 0 0 auto;
  font-size: 0.66rem;
  font-weight: 700;
  color: var(--muted);
  white-space: nowrap;
}

.cal-body {
  display: flex;
  gap: 6px;
}

.cal-weekdays {
  display: flex;
  flex-direction: column;
  gap: 3px;
  width: 24px;
  flex: 0 0 auto;
}

.cal-weekdays span {
  height: 13px;
  font-size: 0.62rem;
  font-weight: 700;
  color: var(--muted);
  line-height: 13px;
}

.cal-cols {
  display: flex;
  gap: 3px;
}

.cal-col {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.cal-legend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  color: var(--muted);
}

.cal-legend .cal-cell {
  width: 11px;
  height: 11px;
}

.cal-legend span:first-child {
  margin-right: 2px;
}

.cal-legend span:last-child {
  margin-left: 2px;
}
</style>
