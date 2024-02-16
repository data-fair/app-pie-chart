<template>
  <div class="container-fluid d-flex justify-content-center align-items-center">
    <template v-if="!incompleteConfig">
      <div v-if="showTitle">
        <svg ref="chartSvg" :height="height + 80" :width="width" :viewBox="`0 0 ${width} ${height + 80}`">
          <text x="50%" y="50" dominant-baseline="middle" text-anchor="middle">{{ chartTitle }}</text>
          <g transform="translate(0, 80)">
            <g v-for="(slice, index) in chartPaths" :key="index"
              @mouseenter="showTooltip($event, index)"
              @mousemove="moveTooltip($event)"
              @mouseleave="hideTooltip">
              <path :d="slice.d" :fill="slice.fill"></path>
            </g>
          </g>
        </svg>
      </div>
      <div v-else>
        <svg ref="chartSvg" :height="height" :width="width" :viewBox="`0 0 ${width} ${height}`">
          <g v-for="(slice, index) in chartPaths" :key="index"
            @mouseenter="showTooltip($event, index)"
            @mousemove="moveTooltip($event)"
            @mouseleave="hideTooltip">
            <path :d="slice.d" :fill="slice.fill"></path>
          </g>
        </svg>
      </div>
      <div v-if="tooltip.show" :style="{position: 'absolute', top: tooltip.y + 'px', left: tooltip.x + 'px'}" class="tooltip">
        <div><b>{{ tooltip.title }}</b></div>
        <div>{{ tooltip.value }}</div>
      </div>
    </template>
  </div>
</template>

<script>
import useAppInfo from '@/composables/useAppInfo'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { prepareSvgPieChartData, chartTitle as generateChartTitle, metricTypes } from '../assets/chart-utils.js'

export default {
  setup() {
    const appInfo = useAppInfo()
    const chartPaths = ref([])
    const height = ref(window.innerHeight - 10)
    const width = ref(window.innerWidth)

    const data = computed(() => appInfo.data)
    const incompleteConfig = computed(() => appInfo.incompleteConfig === null)
    const config = computed(() => appInfo.config)
    const chartTitle = ref('')
    const showTitle = computed(() => config.value.showTitle)

    const tooltip = ref({
      show: false,
      x: 0,
      y: 0,
      title: '',
      value: ''
    })

    const showTooltip = (event, index) => {
      const agg = data.value[index]
      tooltip.value = {
        show: true,
        x: event.clientX,
        y: event.clientY,
        title: agg.ogField[0],
        value: metricTypes.find(m => m.value === data.value.ogMetric).text + ' : ' + agg.metric
      }
    }

    const moveTooltip = (event) => {
      if (tooltip.value.show) {
        tooltip.value.x = event.clientX + 20
        tooltip.value.y = event.clientY - 5
      }
    }

    const hideTooltip = () => {
      tooltip.value.show = false
    }

    const refresh = async () => {
      height.value = showTitle.value ? window.innerHeight - 100 : window.innerHeight - 10
      width.value = window.innerWidth
      if (chartPaths.value) {
        chartPaths.value = []
      }
      await renderChart()
    }

    const renderChart = async () => {
      if (!data.value || incompleteConfig.value === null) return
      const cx = width.value / 2
      const cy = height.value / 2
      chartTitle.value = generateChartTitle(config.value, data.value)

      await nextTick()
      try {
        chartPaths.value = prepareSvgPieChartData(data.value, cx, cy)
      } catch (err) {
        appInfo.setError(err)
      }
    }

    watch([data, config], async () => {
      if (data.value && config.value) {
        try {
          await refresh()
        } catch (err) {
          await renderChart()
        }
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
      chartTitle,
      tooltip,
      showTooltip,
      moveTooltip,
      hideTooltip
    }
  }
}
</script>

<style lang="css">
.container-fluid {
  width: 100%;
  padding: 0 1rem;
}

.tooltip {
  border: 1px solid #282A36;
  background-color: #44475A;
  color: #F8F8F2;
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  pointer-events: none;
}
</style>
