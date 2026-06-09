import { useRegisterSW } from 'virtual:pwa-register/vue'

// Thin wrapper around vite-plugin-pwa's Vue helper. With `registerType: 'prompt'`
// the service worker waits for an explicit call before taking control, so we can
// surface a «new version» toast instead of silently reloading.
export const usePwaUpdate = () => {
  const { needRefresh, offlineReady, updateServiceWorker } = useRegisterSW()

  const refresh = () => updateServiceWorker(true)

  return { needRefresh, offlineReady, refresh }
}
