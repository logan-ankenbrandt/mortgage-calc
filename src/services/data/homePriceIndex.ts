import { fredApi, FRED_SERIES } from '@/services/api/fredApi'
import { cacheManager, CACHE_KEYS } from '@/services/cache/cacheManager'
import type { HomePriceIndexData, HomePriceIndexSeries } from '@/types/market-data'

// Fallback data when API is unavailable
const FALLBACK_HPI: HomePriceIndexSeries = {
  texas: {
    current: 290.5,
    previousYear: 275.2,
    yearOverYearChange: 5.6,
    fiveYearChange: 52.3,
    asOf: '2024-Q3',
    source: 'fallback',
  },
  national: {
    current: 315.8,
    previousYear: 298.1,
    yearOverYearChange: 5.9,
    fiveYearChange: 48.7,
    asOf: '2024-Q3',
    source: 'fallback',
  },
  metro: {
    houston: {
      current: 285.2,
      previousYear: 270.8,
      yearOverYearChange: 5.3,
      fiveYearChange: null,
      asOf: '2024-Q3',
      source: 'fallback',
    },
    dallas: {
      current: 312.4,
      previousYear: 295.6,
      yearOverYearChange: 5.7,
      fiveYearChange: null,
      asOf: '2024-Q3',
      source: 'fallback',
    },
    austin: {
      current: 298.7,
      previousYear: 310.2,
      yearOverYearChange: -3.7,
      fiveYearChange: null,
      asOf: '2024-Q3',
      source: 'fallback',
    },
    sanAntonio: {
      current: 275.9,
      previousYear: 262.1,
      yearOverYearChange: 5.3,
      fiveYearChange: null,
      asOf: '2024-Q3',
      source: 'fallback',
    },
  },
}

/**
 * Parse HPI observation from FRED
 */
async function parseHPIFromFred(
  seriesId: string,
  source: 'fred' | 'fhfa' = 'fred'
): Promise<HomePriceIndexData | null> {
  try {
    // Get latest observation
    const latest = await fredApi.getLatestObservation(seriesId)
    const currentValue = parseFloat(latest.value)

    if (isNaN(currentValue)) {
      return null
    }

    // Get year-over-year change
    const yoyChange = await fredApi.getYearOverYearChange(seriesId)

    // Try to get 5-year change (will need historical data)
    let fiveYearChange: number | null = null
    try {
      const fiveYearsAgo = new Date()
      fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5)
      const historicalResponse = await fredApi.getSeriesObservations(seriesId, {
        observationStart: fiveYearsAgo.toISOString().split('T')[0],
        limit: 1,
        sortOrder: 'asc',
      })

      if (historicalResponse.observations.length > 0) {
        const historicalValue = parseFloat(historicalResponse.observations[0]!.value)
        if (!isNaN(historicalValue) && historicalValue > 0) {
          fiveYearChange = ((currentValue - historicalValue) / historicalValue) * 100
        }
      }
    } catch {
      // 5-year change is optional
    }

    // Calculate previous year value from YoY change
    const previousYear = yoyChange !== null ? currentValue / (1 + yoyChange / 100) : currentValue

    return {
      current: currentValue,
      previousYear,
      yearOverYearChange: yoyChange ?? 0,
      fiveYearChange,
      asOf: latest.date,
      source,
    }
  } catch (error) {
    console.warn(`Failed to fetch HPI for series ${seriesId}:`, error)
    return null
  }
}

/**
 * Fetch all HPI data from FRED API
 */
export async function fetchHomePriceIndex(forceRefresh = false): Promise<HomePriceIndexSeries> {
  // Clear cache if force refreshing
  if (forceRefresh) {
    cacheManager.clear(CACHE_KEYS.HOME_PRICE_INDEX)
  }

  // Check cache first
  const cached = cacheManager.get<HomePriceIndexSeries>(CACHE_KEYS.HOME_PRICE_INDEX)
  if (cached && !cacheManager.isExpired(CACHE_KEYS.HOME_PRICE_INDEX)) {
    return cached
  }

  // Check if API is configured
  if (!fredApi.isConfigured()) {
    console.warn('FRED API not configured, using fallback HPI data')
    return getFallbackHPI()
  }

  try {
    // Fetch all HPI series in parallel
    const [texas, national, houston, dallas, austin, sanAntonio] = await Promise.all([
      parseHPIFromFred(FRED_SERIES.TEXAS_HPI, 'fhfa'),
      parseHPIFromFred(FRED_SERIES.NATIONAL_HPI, 'fhfa'),
      parseHPIFromFred(FRED_SERIES.HOUSTON_HPI, 'fred'),
      parseHPIFromFred(FRED_SERIES.DALLAS_HPI, 'fred'),
      parseHPIFromFred(FRED_SERIES.AUSTIN_HPI, 'fred'),
      parseHPIFromFred(FRED_SERIES.SAN_ANTONIO_HPI, 'fred'),
    ])

    // Use fallback data for any series that failed to fetch
    const fallback = FALLBACK_HPI
    const fallbackMetro = fallback.metro!
    const data: HomePriceIndexSeries = {
      texas: texas ?? fallback.texas,
      national: national ?? fallback.national,
      metro: {
        houston: houston ?? fallbackMetro.houston,
        dallas: dallas ?? fallbackMetro.dallas,
        austin: austin ?? fallbackMetro.austin,
        sanAntonio: sanAntonio ?? fallbackMetro.sanAntonio,
      },
    }

    // Update cache
    cacheManager.set(CACHE_KEYS.HOME_PRICE_INDEX, data)

    return data
  } catch (error) {
    console.error('Error fetching HPI data:', error)

    // Return stale cache if available
    if (cached) {
      console.warn('Using stale cached HPI data')
      return cached
    }

    // Final fallback
    return getFallbackHPI()
  }
}

/**
 * Get fallback HPI data
 */
function getFallbackHPI(): HomePriceIndexSeries {
  return FALLBACK_HPI
}

/**
 * Get current HPI (from cache or fetch)
 */
export async function getCurrentHPI(): Promise<HomePriceIndexSeries> {
  const cached = cacheManager.get<HomePriceIndexSeries>(CACHE_KEYS.HOME_PRICE_INDEX)

  // Return cache if valid
  if (cached && !cacheManager.isExpired(CACHE_KEYS.HOME_PRICE_INDEX)) {
    return cached
  }

  // If stale but still have data, return it and refresh in background
  if (cached && cacheManager.isStale(CACHE_KEYS.HOME_PRICE_INDEX)) {
    fetchHomePriceIndex().catch(console.error)
    return cached
  }

  // Fetch fresh data
  return fetchHomePriceIndex()
}

/**
 * Get Texas HPI context string
 */
export function getTexasHPIContext(hpi: HomePriceIndexSeries): string {
  if (!hpi.texas || !hpi.national) {
    return 'Home price data unavailable.'
  }

  const texasYoY = hpi.texas.yearOverYearChange
  const nationalYoY = hpi.national.yearOverYearChange
  const comparison = texasYoY > nationalYoY ? 'outpacing' : 'trailing'

  if (texasYoY > 0) {
    return `Texas home prices are up ${texasYoY.toFixed(1)}% year-over-year, ${comparison} the national average of ${nationalYoY.toFixed(1)}%.`
  } else {
    return `Texas home prices have declined ${Math.abs(texasYoY).toFixed(1)}% year-over-year, compared to the national change of ${nationalYoY.toFixed(1)}%.`
  }
}

/**
 * Get metro area comparison
 */
export function getMetroComparison(hpi: HomePriceIndexSeries): Array<{
  name: string
  current: number
  change: number
}> {
  const metros: Array<{ name: string; current: number; change: number }> = []

  if (hpi.metro?.houston) {
    metros.push({
      name: 'Houston',
      current: hpi.metro.houston.current,
      change: hpi.metro.houston.yearOverYearChange,
    })
  }
  if (hpi.metro?.dallas) {
    metros.push({
      name: 'Dallas-Fort Worth',
      current: hpi.metro.dallas.current,
      change: hpi.metro.dallas.yearOverYearChange,
    })
  }
  if (hpi.metro?.austin) {
    metros.push({
      name: 'Austin',
      current: hpi.metro.austin.current,
      change: hpi.metro.austin.yearOverYearChange,
    })
  }
  if (hpi.metro?.sanAntonio) {
    metros.push({
      name: 'San Antonio',
      current: hpi.metro.sanAntonio.current,
      change: hpi.metro.sanAntonio.yearOverYearChange,
    })
  }

  return metros.sort((a, b) => b.change - a.change)
}
