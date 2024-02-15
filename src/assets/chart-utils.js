import getColors from '@data-fair/lib/color-scheme/colors.js'
import { generateHuesFromColor } from 'palex'

function formatValue(value, maxLength) {
  if (typeof value === 'number') return value.toLocaleString()
  const str = '' + value
  return str.length > maxLength ? str.slice(0, maxLength) + '...' : str
}

function tooltipTitle(tooltipItems, data) {
  const value = tooltipItems[0].label || data.labels[tooltipItems[0].datasetIndex]
  // title might be truncated in tooltip, but not as much as in xAxis labels
  return formatValue(value, 50)
}

function tooltipLabel(tooltipItem, data) {
  const value = tooltipItem.raw || data.datasets[tooltipItem.datasetIndex].data[tooltipItem.dataIndex]
  let label
  if (tooltipItem.datasetIndex !== undefined) {
    label = data.datasets[tooltipItem.datasetIndex].label
  }
  if (label) return `${formatValue(label, 20)}: ${formatValue(value, 40)}`
  else return formatValue(value, 40)
}

function getSingleTooltips(data) {
  return {
    callbacks: {
      title: (tooltipItems) => tooltipTitle(tooltipItems, data),
      label: (tooltipItem) => tooltipLabel(tooltipItem, data)
    }
  }
}

const chartOptions = {}

chartOptions.pie = (config, data) => {
  return {
    type: 'pie',
    data,
    options: {
      plugins: {
        title: { display: true, text: chartTitle(config) },
        tooltip: getSingleTooltips(data)
      }
    }
  }
}

const metricTypes = [
  { value: 'count', text: 'Nombre de documents' },
  { value: 'min', text: 'Valeur min' },
  { value: 'max', text: 'Valeur max' },
  { value: 'sum', text: 'Somme' },
  { value: 'avg', text: 'Moyenne' }
]

function chartTitle(config) {
  if (config.title) return config.title
  const metricType = metricTypes.find(m => m.value === config.dataType?.metricType)
  let label = metricType?.text + ' de ' + config.dataType?.valueField?.label
  if (config.dataType?.groupBy && config.dataType.groupBy.field) label += ' par ' + config.dataType.groupBy.field.label
  return label
}

function prepareChart(config, data) {
  const renderType = config.chartType?.type
  if (!chartOptions[renderType]) throw new Error('Type de graphique non supporté ' + renderType)
  const chart = chartOptions[renderType](config, prepareData(config, data))
  chart.options.responsive = false
  return chart
}

function prepareData(config, data) {
  if (data.aggs.length > 1000) {
    throw new Error('Nombre d\'éléments à afficher trop important. Abandon.')
  }
  const backgroundColor = config.chartType?.type === 'pie' ? getColors(config.colorscheme, data, data.aggs.length) : getColors(config.colorscheme, data, 1)[0]
  return {
    labels: data.aggs.map(agg => agg.value),
    datasets: [{
      data: data.aggs.map(agg => config.dataType?.type !== 'countBased' ? agg.metric : agg.total),
      backgroundColor,
      borderColor: backgroundColor
    }]
  }
}

function calculatePieSlicePath(cx, cy, radius, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, radius, endAngle)
  const end = polarToCartesian(cx, cy, radius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
  const d = [
    'M', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    'L', cx, cy,
    'Z'
  ].join(' ')
  return d
}

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  }
}

function prepareSvgPieChartData(config, data, cx, cy) {
  console.log('prepareSvgPieChartData', config, data)
  const radius = 100 // Radius of the pie chart
  let startAngle = 0
  const chartData = []

  const totalMetric = data.aggs.reduce((acc, agg) => acc + agg.metric, 0)
  const backgroundColors = generateHuesFromColor('#6272A4', data.aggs.length)

  data.aggs.forEach((agg, index) => {
    const angle = (agg.metric / totalMetric) * 360
    const endAngle = startAngle + angle
    const path = calculatePieSlicePath(cx, cy, radius, startAngle, endAngle)
    chartData.push({
      d: path,
      fill: backgroundColors[index]
    })
    startAngle = endAngle
  })
  console.log('chartData', chartData)

  return chartData
}

export default { prepareChart, prepareData, chartTitle }

export { prepareSvgPieChartData }
