<template>
  <ChartComponent v-if="application" />
</template>

<script>
import ChartComponent from './components/ChartComponent.vue'
import getReactiveSearchParams from '@data-fair/lib/vue/reactive-search-params-global.js'
import useAppInfo from './composables/useAppInfo'
import { computed, inject, onMounted } from 'vue'
import { ofetch } from 'ofetch'

export default {
  components: { ChartComponent },
  setup() {
    let appInfo = null
    let application = null
    try {
      appInfo = useAppInfo()
      const env = inject('startEnv')
      appInfo.init(env)
      application = computed(() => appInfo.application)
    } catch (e) {
      ofetch(window.APPLICATION.href + '/error', { body: { message: e.message || e }, method: 'POST' })
    }
    const urlSearchParams = getReactiveSearchParams
    window.vIframeOptions = { reactiveParams: urlSearchParams }

    onMounted(() => {
      if (application === null) {
        window.location.href = 'https://github.com/data-fair/app-pie-chart'
      } else {
        appInfo.fetchData()
      }
    })

    return {
      application
    }
  }
}
</script>

<style>
html {
  overflow-y: hidden;
}

body {
  margin: 0;
  overflow: hidden;
  overflow-y: hidden;
  font-family: 'Nunito', sans-serif;
}

body .application.embed {
  background: transparent;
}
</style>
