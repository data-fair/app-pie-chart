import 'url-polyfill'
import { createApp, defineAsyncComponent } from 'vue'

const asyncApp = defineAsyncComponent(() => import('./App.vue'))

let env = import.meta.env
if (env === undefined) {
  env = {
    defaultDataFairUrl: process.env.DEFAULT_DATA_FAIR ?? 'http://localhost:5888'
  }
} else {
  env.defaultDataFairUrl = env.VITE_DEFAULT_DATA_FAIR ?? 'http://localhost:5888'
}

const app = createApp(asyncApp)
app.provide('startEnv', env)

app.mount('#app')
