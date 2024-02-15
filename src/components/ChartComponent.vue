<template lang="html">
  <v-container fluid class="pa-1">
    <template v-if="!incompleteConfig">
      <canvas ref="chartCanvas" :height="height" :width="width" />
    </template>
  </v-container>
</template>

<script>
import chartUtils from '../assets/chart-utils.js'
import useAppInfo from '@/composables/useAppInfo'
import { ref, computed, onMounted, watch, nextTick, shallowRef } from 'vue'

export default {
  setup() {
    const appInfo = useAppInfo()
    const chartCanvas = shallowRef(null)
    const chart = shallowRef(null)
    const chartTop = ref(0)
    const height = ref(null)
    const width = ref(null)

    const data = computed(() => appInfo.data)
    const incompleteConfig = computed(() => appInfo.incompleteConfig === null)
    const config = computed(() => appInfo.config)

    watch(data, async () => {
      if (chartCanvas.value) {
        chartTop.value = chartCanvas.value.getBoundingClientRect().top
      }
      try {
        await refresh()
      } catch (err) {
        await nextTick()
        renderChart()
      }
    }, { immediate: true })

    onMounted(async () => {
      await nextTick()
      if (chartCanvas.value) {
        chartTop.value = chartCanvas.value.getBoundingClientRect().top
      }
      window.addEventListener('resize', refresh, true)
      refresh()
    })

    const refresh = async () => {
      height.value = window.innerHeight - chartTop.value
      width.value = window.innerWidth
      if (chart.value) {
        chart.value.destroy()
        chart.value = null
      }
      await nextTick()
      renderChart()
    }

    const renderChart = () => {
      if (!data.value || incompleteConfig.value === null) return
      try {
        if (!chart.value) {
          // create the chart
        } else {
          // update the values of the chart
        }
      } catch (err) {
        appInfo.setError(err)
      }
    }

    return {
      chartCanvas,
      height,
      width,
      incompleteConfig,
      config
    }
  }
}
</script>

<style lang="css">
</style>
