import { createApp } from 'vue'
import App from './App.vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faCog } from '@fortawesome/free-solid-svg-icons'

library.add(faCog)

createApp(App)
.component('font-awesome-icon', FontAwesomeIcon)
.mount('#app')
