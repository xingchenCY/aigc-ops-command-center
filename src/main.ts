import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Drawer } from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import './style.css'
import App from './App.vue'

createApp(App).use(createPinia()).use(Drawer).mount('#app')
