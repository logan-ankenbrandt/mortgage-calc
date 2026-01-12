import { fredApi, FRED_SERIES } from '@/services/api/fredApi'
import { cacheManager, CACHE_KEYS } from '@/services/cache/cacheManager'
import type { EconomicIndicators } from '@/types/market-data'

// Fallback data when API is unavailable
const FALLBACK_INDICATORS: EconomicIndicators = {
  fedFundsRate: {
    current: 4.5,
    target: { lower: 4.25, upper: 4.5 },
    lastChange: '2024-12-01',
    changeDirection: 'down',
  },
  treasury10Year: 4.2,
  inflation: {
    cpiAllItems: 2.7,
    cpiCore: 3.2,
    asOf: '2024-12-01',
  },
  unemployment: {
    rate: 4.1,
    asOf: '2024-12-01',
  },
  housingStarts: null,
  lastUpdated: new Date().toISOString(),
  source: 'fallback',
}

/**
 * Fetch economic indicators from FRED API
 */
export async function fetchEconomicIndicators(forceRefresh = false): Promise<EconomicIndicators> {
  // Clear cache if force refreshing
  if (forceRefresh) {
    cacheManager.clear(CACHE_KEYS.ECONOMIC_INDICATORS)
  }

  // Check cache first
  const cached = cacheManager.get<EconomicIndicators>(CACHE_KEYS.ECONOMIC_INDICATORS)
  if (cached && !cacheManager.isExpired(CACHE_KEYS.ECONOMIC_INDICATORS)) {
    return cached
  }

  // Check if API is configured
  if (!fredApi.isConfigured()) {
    console.warn('FRED API not configured, using fallback indicators')
    return getFallbackIndicators()
  }

  try {
    // Fetch all indicators in parallel
    const [
      fedFundsResponse,
      fedTargetUpperResponse,
      fedTargetLowerResponse,
      treasury10Response,
      cpiResponse,
      cpiCoreResponse,
      unemploymentResponse,
    ] = await Promise.all([
      fredApi.getLatestObservation(FRED_SERIES.FED_FUNDS_RATE),
      fredApi.getLatestObservation(FRED_SERIES.FED_FUNDS_TARGET_UPPER),
      fredApi.getLatestObservation(FRED_SERIES.FED_FUNDS_TARGET_LOWER),
      fredApi.getLatestObservation(FRED_SERIES.TREASURY_10_YEAR),
      fredApi.getLatestObservation(FRED_SERIES.CPI_ALL_ITEMS),
      fredApi.getLatestObservation(FRED_SERIES.CPI_CORE),
      fredApi.getLatestObservation(FRED_SERIES.UNEMPLOYMENT_RATE),
    ])

    // Get year-over-year inflation rates
    const [cpiYoY, cpiCoreYoY] = await Promise.all([
      fredApi.getYearOverYearChange(FRED_SERIES.CPI_ALL_ITEMS),
      fredApi.getYearOverYearChange(FRED_SERIES.CPI_CORE),
    ])

    const data: EconomicIndicators = {
      fedFundsRate: {
        current: parseFloat(fedFundsResponse.value),
        target: {
          lower: parseFloat(fedTargetLowerResponse.value),
          upper: parseFloat(fedTargetUpperResponse.value),
        },
        lastChange: fedFundsResponse.date,
        changeDirection: 'unchanged', // Would need historical data to determine
      },
      treasury10Year: parseFloat(treasury10Response.value),
      inflation: {
        cpiAllItems: cpiYoY ?? parseFloat(cpiResponse.value),
        cpiCore: cpiCoreYoY ?? parseFloat(cpiCoreResponse.value),
        asOf: cpiResponse.date,
      },
      unemployment: {
        rate: parseFloat(unemploymentResponse.value),
        asOf: unemploymentResponse.date,
      },
      housingStarts: null,
      lastUpdated: new Date().toISOString(),
      source: 'fred',
    }

    // Try to get housing starts (optional)
    try {
      const housingStartsResponse = await fredApi.getLatestObservation(
        FRED_SERIES.HOUSING_STARTS
      )
      const housingStartsYoY = await fredApi.getYearOverYearChange(
        FRED_SERIES.HOUSING_STARTS
      )

      data.housingStarts = {
        value: parseFloat(housingStartsResponse.value),
        monthOverMonth: housingStartsYoY ?? 0,
        asOf: housingStartsResponse.date,
      }
    } catch {
      // Housing starts is optional
    }

    // Update cache
    cacheManager.set(CACHE_KEYS.ECONOMIC_INDICATORS, data)

    return data
  } catch (error) {
    console.error('Error fetching economic indicators:', error)

    // Return stale cache if available
    if (cached) {
      console.warn('Using stale cached economic indicators')
      return { ...cached, source: 'fallback' }
    }

    // Final fallback
    return getFallbackIndicators()
  }
}

/**
 * Get fallback indicators
 */
function getFallbackIndicators(): EconomicIndicators {
  return {
    ...FALLBACK_INDICATORS,
    lastUpdated: new Date().toISOString(),
  }
}

/**
 * Get current indicators (from cache or fetch)
 */
export async function getCurrentIndicators(): Promise<EconomicIndicators> {
  const cached = cacheManager.get<EconomicIndicators>(CACHE_KEYS.ECONOMIC_INDICATORS)

  // Return cache if valid
  if (cached && !cacheManager.isExpired(CACHE_KEYS.ECONOMIC_INDICATORS)) {
    return cached
  }

  // If stale but still have data, return it and refresh in background
  if (cached && cacheManager.isStale(CACHE_KEYS.ECONOMIC_INDICATORS)) {
    fetchEconomicIndicators().catch(console.error)
    return cached
  }

  // Fetch fresh data
  return fetchEconomicIndicators()
}

/**
 * Get Fed rate context string
 */
export function getFedRateContext(indicators: EconomicIndicators): string {
  const { fedFundsRate, inflation } = indicators
  const targetMidpoint = (fedFundsRate.target.lower + fedFundsRate.target.upper) / 2

  if (inflation.cpiAllItems > 3) {
    return 'Inflation remains elevated, suggesting rates may stay higher for longer.'
  } else if (inflation.cpiAllItems < 2) {
    return 'Inflation is below the Fed\'s 2% target, potentially allowing for rate cuts.'
  } else if (fedFundsRate.current > 4) {
    return 'The Fed is maintaining restrictive policy to bring inflation to target.'
  }

  return `The Fed funds rate is at ${targetMidpoint.toFixed(2)}% with inflation at ${inflation.cpiAllItems.toFixed(1)}%.`
}
