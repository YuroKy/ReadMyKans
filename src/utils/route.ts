import type { AppView } from '../types'

const HASH_BY_VIEW: Record<AppView, string> = {
  setup: '#/',
  drill: '#/drill',
  reading: '#/reading',
  result: '#/result',
  sprint: '#/sprint',
  memory: '#/memory',
  exam: '#/exam',
}

const VIEW_BY_PATH = new Map<string, AppView>(
  (Object.entries(HASH_BY_VIEW) as Array<[AppView, string]>).map(([view, hash]) => [
    hash.replace(/^#\//, ''),
    view,
  ]),
)

export const hashForView = (view: AppView): string => HASH_BY_VIEW[view]

// Unknown or empty hashes land on the setup screen.
export const viewForHash = (hash: string): AppView => {
  const path = hash.replace(/^#\/?/, '').replace(/\/+$/, '')
  return VIEW_BY_PATH.get(path) ?? 'setup'
}
