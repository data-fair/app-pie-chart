import { generateHuesFromColor } from 'palex'

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
  if (data.aggs.length > 500) {
    throw new Error('Nombre d\'éléments à afficher trop important. Abandon.')
  }
  const radius = Math.min(cx, cy)
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

  return chartData
}

export { chartTitle, prepareSvgPieChartData, metricTypes }
