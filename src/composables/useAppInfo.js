import debounce from 'debounce'
import getReactiveSearchParams from '@data-fair/lib/vue/reactive-search-params-global.js'
import { filters2qs } from '../assets/filters-utils'
import { ofetch } from 'ofetch'
import { reactive, watch } from 'vue'
import { useConceptFilters } from '@data-fair/lib/vue/concept-filters.js'

let instance = null

export default function useAppInfo() {
  if (instance) return instance

  const env = null
  const application = window.APPLICATION
  const data = null
  const searchParams = getReactiveSearchParams
  const conceptFilters = useConceptFilters(searchParams)

  let defaultDataFairUrl = null
  let defaultConfigureUrl = null

  const incompleteConfig = (() => {
    if (!application) return null
    const config = application.configuration
    if (!config) throw new Error('Configuration absente')
    if (!(config.datasets && config.datasets[0] && config.datasets[0].href)) {
      throw new Error('Pas de jeu de données configuré.')
    }
    if (config.dataType.groupBy.field && !config.dataType.groupBy.field.length > 0) {
      throw new Error('Pour ce type de préparation de données vous devez configurer la colonne sur laquelle effectuer un calcul.')
    }
    return config
  })()

  const config = incompleteConfig

  function setAny(params) {
    Object.assign(appInfo, params)
  }

  function init(env) {
    setAny({ env })

    defaultDataFairUrl = env ? new URL(env.defaultDataFairUrl) : null
    defaultConfigureUrl = env ? `${env.defaultDataFairUrl}/applications?import=${encodeURIComponent(window.location.href)}` : null

    if (application) {
      const config = application.configuration
      if (config && config.dynamicFilters) {
        config.dynamicFilters.forEach(f => {
          f.values = f.defaultValues
        })
      }
    }
  }

  const fetchData = debounce(async function () {
    if (incompleteConfig === null) {
      return
    }

    const config = application.configuration
    if (config && config.dynamicFilters) {
      config.dynamicFilters.forEach(f => {
        const regex = new RegExp(`${f.field.key}_in=([^&]+)`)
        const match = window.location.search.match(regex)
        if (match && match[1]) {
          const queryParam = decodeURIComponent(match[1]).replace(/"/g, '')

          if (queryParam.startsWith('[') && queryParam.endsWith(']')) {
            try {
              f.values = JSON.parse(queryParam)
            } catch (e) {
              f.values = []
            }
          } else {
            if (queryParam.includes(',')) {
              f.values = queryParam.split(',').map(value => value.trim())
            } else {
              f.values = [queryParam]
            }
          }
        }
      })
    }

    if (config && config.dataType) {
      const metricData = []

      for (const fieldValue of config.dataType.groupBy.field) {
        const params = {
          metric: config.dataType.metricType,
          field: fieldValue,
          ...conceptFilters.conceptFilters.value,
          finalizedAt: config.datasets[0].finalizedAt // for better caching
        }

        if (config.staticFilters && config.staticFilters.length > 0 && config.dynamicFilters && config.dynamicFilters.length > 0) {
          params.qs = filters2qs(config.staticFilters.concat(config.dynamicFilters))
        }

        const response = await ofetch(`${config.datasets[0].href}/metric_agg`, { params }).catch(err => {
          setError(err)
        })
        const schemaResponse = await ofetch(`${config.datasets[0].href}/schema?calculated=false&type=integer,number`).catch(err => {
          console.error(err)
          return []
        })
        const fieldName = schemaResponse
          .filter(item => fieldValue === item.key)
          .map(item => item.label)
        response.ogField = fieldName

        metricData.push(response)
      }
      metricData.ogMetric = config.dataType.metricType

      setAny({ data: metricData })
    }
  }, 10)

  watch(conceptFilters.conceptFilters, fetchData)

  async function setError(error) {
    console.error(error)
    await ofetch(`${application.href}/error`, {
      method: 'POST',
      body: {
        message: error.message || error
      }
    }).catch(postError => {
      console.error('Failed to report error', postError)
    })
  }

  const appInfo = reactive({
    env,
    application,
    data,
    conceptFilters,
    defaultDataFairUrl,
    defaultConfigureUrl,
    incompleteConfig,
    config,
    fetchData,
    init,
    setAny,
    setError
  })

  instance = appInfo
  return instance
}
