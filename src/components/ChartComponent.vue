<template>
  <v-container fluid class="pa-1">
    <template v-if="!incompleteConfig">
      <svg ref="chartSvg" :height="height" :width="width" :viewBox="`0 0 ${height} ${width}`">
        <g v-for="(slice, index) in chartPaths" :key="index">
          <path :d="slice.d" :fill="slice.fill"></path>
        </g>
      </svg>
    </template>
  </v-container>
</template>

<script>
import useAppInfo from '@/composables/useAppInfo'
import { ref, computed, onMounted, watch } from 'vue'
import { prepareSvgPieChartData } from '../assets/chart-utils.js'

export default {
  setup() {
    const appInfo = useAppInfo()
    const chartPaths = ref([])
    const chartTop = ref(0)
    const height = ref(null)
    const width = ref(null)

    const data = computed(() => appInfo.data)
    const incompleteConfig = computed(() => appInfo.incompleteConfig === null)
    const config = computed(() => appInfo.config)

    const refresh = async () => {
      height.value = window.innerHeight - chartTop.value
      width.value = window.innerWidth
      if (chartPaths.value) {
        chartPaths.value = []
      }
      renderChart()
    }

    const renderChart = () => {
      if (!data.value || incompleteConfig.value === null) return
      const cx = width.value / 2
      const cy = height.value / 2

      try {
        chartPaths.value = prepareSvgPieChartData(config.value, data.value, cx, cy)
      } catch (err) {
        appInfo.setError(err)
      }
    }

    watch([data, config], async () => {
      if (data.value && config.value) {
        chartPaths.value = prepareSvgPieChartData(config.value, data.value)
      }
      try {
        await refresh()
      } catch (err) {
        renderChart()
      }
    }, { immediate: true })

    onMounted(async () => {
      if (chartPaths.value.length > 0) {
        chartTop.value = chartPaths.value.getBoundingClientRect().top
      }
      window.addEventListener('resize', refresh, true)
      refresh()
    })

    return {
      chartPaths,
      incompleteConfig,
      height,
      width
    }
  }
}
</script>

<style lang="css">
/* Add styles if needed */
</style>
