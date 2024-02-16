<template>
  <div class="container-fluid d-flex justify-content-center align-items-center">
    <template v-if="!incompleteConfig">
      <div v-if="showTitle">
        <svg ref="chartSvg" :height="height + 80" :width="width" :viewBox="`0 0 ${width} ${height + 80}`">
          <text x="50%" y="50" dominant-baseline="middle" text-anchor="middle">{{ chartTitle }}</text>
          <g transform="translate(0, 80)">
            <g v-for="(slice, index) in chartPaths" :key="index">
              <path :d="slice.d" :fill="slice.fill"></path>
            </g>
          </g>
        </svg>
      </div>
      <div v-else>
        <svg ref="chartSvg" :height="height" :width="width" :viewBox="`0 0 ${width} ${height}`">
          <g v-for="(slice, index) in chartPaths" :key="index">
            <path :d="slice.d" :fill="slice.fill"></path>
          </g>
        </svg>
      </div>
    </template>
  </div>
</template>

<script>
import useAppInfo from '@/composables/useAppInfo'
import { ref, computed, onMounted, watch } from 'vue'
import { prepareSvgPieChartData, chartTitle as generateChartTitle } from '../assets/chart-utils.js'

export default {
  setup() {
    const appInfo = useAppInfo()
    const chartPaths = ref([])
    const height = ref(null)
    const width = ref(null)

    const data = computed(() => appInfo.data)
    const incompleteConfig = computed(() => appInfo.incompleteConfig === null)
    const config = computed(() => appInfo.config)
    const chartTitle = computed(() => generateChartTitle(config.value))
    const showTitle = computed(() => config.value.showTitle)

    const refresh = async () => {
      height.value = showTitle.value ? window.innerHeight - 100 : window.innerHeight - 10
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
      window.addEventListener('resize', refresh, true)
      refresh()
    })

    return {
      chartPaths,
      incompleteConfig,
      height,
      width,
      showTitle,
      chartTitle
    }
  }
}
</script>

<style lang="css">
.container-fluid {
  width: 100%;
  padding: 0 1rem;
}
</style>
