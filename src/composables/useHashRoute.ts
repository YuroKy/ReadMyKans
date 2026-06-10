import { watch, type Ref } from 'vue'
import type { AppView } from '../types'
import { hashForView, viewForHash } from '../utils/route'

// Keeps `view` and `location.hash` in sync: views become deep-linkable and the
// browser Back button returns to the setup screen instead of leaving the app.
// `resolve` lets the caller veto a deep link (e.g. #/result without a result).
export const useHashRoute = (
  view: Ref<AppView>,
  resolve: (target: AppView) => AppView = (target) => target,
) => {
  if (typeof window === 'undefined') return

  const apply = (target: AppView) => {
    const resolved = resolve(target)
    if (view.value !== resolved) view.value = resolved
    const hash = hashForView(resolved)
    // Rewrite without adding a history entry so a vetoed deep link does not
    // leave a dead URL in the address bar.
    if (window.location.hash !== hash) window.history.replaceState(null, '', hash)
  }

  apply(viewForHash(window.location.hash))

  watch(view, (next) => {
    const hash = hashForView(next)
    // Assigning location.hash pushes a history entry — that is what makes
    // Back work; the resulting hashchange round-trip is a no-op in `apply`.
    if (window.location.hash !== hash) window.location.hash = hash
  })

  window.addEventListener('hashchange', () => {
    apply(viewForHash(window.location.hash))
  })
}
