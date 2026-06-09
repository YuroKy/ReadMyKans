import { computed, ref } from 'vue'
import { evaluate, type ProgressSnapshot } from '../utils/achievements'

// id -> ISO timestamp it was unlocked at.
export type UnlockedMap = Record<string, string>
const KEY = 'kana-achievements'

export interface SyncResult {
  map: UnlockedMap
  newlyUnlocked: string[]
}

// Pure: merge currently-satisfied ids into the unlocked map, stamping only the
// ones that weren't there before.
export const diffUnlocked = (
  unlocked: UnlockedMap,
  satisfied: string[],
  now: string,
): SyncResult => {
  const map = { ...unlocked }
  const newlyUnlocked: string[] = []
  for (const id of satisfied) {
    if (!(id in map)) {
      map[id] = now
      newlyUnlocked.push(id)
    }
  }
  return { map, newlyUnlocked }
}

const read = (): UnlockedMap => {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as UnlockedMap
  } catch {
    return {}
  }
}

const unlocked = ref<UnlockedMap>(read())

const persist = () => {
  if (typeof window !== 'undefined') localStorage.setItem(KEY, JSON.stringify(unlocked.value))
}

export const useAchievements = () => {
  const isUnlocked = (id: string): boolean => id in unlocked.value
  const unlockedCount = computed(() => Object.keys(unlocked.value).length)

  // Reconcile against a fresh snapshot; returns the ids unlocked by THIS call so
  // the caller can celebrate them.
  const sync = (snapshot: ProgressSnapshot): string[] => {
    const { map, newlyUnlocked } = diffUnlocked(
      unlocked.value,
      evaluate(snapshot),
      new Date().toISOString(),
    )
    if (newlyUnlocked.length > 0) {
      unlocked.value = map
      persist()
    }
    return newlyUnlocked
  }

  return { unlocked, isUnlocked, unlockedCount, sync }
}
