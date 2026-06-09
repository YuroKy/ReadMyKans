import { onBeforeUnmount, onMounted, ref } from 'vue'

// The `beforeinstallprompt` event is not yet in the standard lib DOM types.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// True when the app is already running as an installed PWA — then there is
// nothing to install, so the button must stay hidden. Pure & testable.
export const isStandalone = (): boolean => {
  if (typeof window === 'undefined') return false
  const standaloneMedia = window.matchMedia?.('(display-mode: standalone)').matches ?? false
  // iOS Safari exposes a non-standard `navigator.standalone` instead.
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  return standaloneMedia || iosStandalone
}

// Captures the deferred `beforeinstallprompt` event so the UI can offer its own
// «Install» button. Browsers without the event (Firefox, iOS Safari) simply
// never set `canInstall` — the caller falls back to an OS-specific hint.
export const usePwaInstall = () => {
  const canInstall = ref(false)
  const installed = ref(isStandalone())
  let deferred: BeforeInstallPromptEvent | null = null

  const onBeforeInstallPrompt = (event: Event) => {
    event.preventDefault()
    deferred = event as BeforeInstallPromptEvent
    canInstall.value = !installed.value
  }

  const onInstalled = () => {
    installed.value = true
    canInstall.value = false
    deferred = null
  }

  const promptInstall = async (): Promise<boolean> => {
    if (!deferred) return false
    await deferred.prompt()
    const choice = await deferred.userChoice
    deferred = null
    canInstall.value = false
    return choice.outcome === 'accepted'
  }

  onMounted(() => {
    if (typeof window === 'undefined') return
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)
  })

  onBeforeUnmount(() => {
    if (typeof window === 'undefined') return
    window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.removeEventListener('appinstalled', onInstalled)
  })

  return { canInstall, installed, promptInstall }
}
