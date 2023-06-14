import { createApp } from 'vue'
import App from './App.vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faCog } from '@fortawesome/free-solid-svg-icons'
//import './scss/styles.scss'
//import * as bootstrap from 'bootstrap'


library.add(faCog)

createApp(App)
.component('font-awesome-icon', FontAwesomeIcon)
.mount('#app')
