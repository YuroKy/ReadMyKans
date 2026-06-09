import { createApp } from 'vue'
import App from './App.vue'
import './styles/base.css'

// Service worker registration is handled reactively by usePwaUpdate()
// (virtual:pwa-register/vue) so the app can show an update toast.

createApp(App).mount('#app')
