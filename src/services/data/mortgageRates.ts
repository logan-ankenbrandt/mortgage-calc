import { fredApi, FRED_SERIES } from '@/services/api/fredApi'
import { cacheManager, CACHE_KEYS } from '@/services/cache/cacheManager'
import type { MortgageRateData } from '@/types/market-data'

// Fallback rates when API is unavailable
const FALLBACK_RATES: MortgageRateData = {
  rate30Year: 6.5,
  rate15Year: 5.75,
  rate5YearArm: 6.0,
  asOf: '2025-01-01',
  source: 'fallback',
  lastUpdated: new Date().toISOString(),
}

/**
 * Fetch current mortgage rates from FRED API
 */
export async function fetchMortgageRates(): Promise<MortgageRateData> {
  // Check cache first
  const cached = cacheManager.get<MortgageRateData>(CACHE_KEYS.MORTGAGE_RATES)
  if (cached && !cacheManager.isExpired(CACHE_KEYS.MORTGAGE_RATES)) {
    return cached
  }

  // Check if API is configured
  if (!fredApi.isConfigured()) {
    console.warn('FRED API not configured, using fallback rates')
    return getFallbackRates()
  }

  try {
    // Fetch rates from FRED API
    const [rate30Response, rate15Response] = await Promise.all([
      fredApi.getLatestObservation(FRED_SERIES.MORTGAGE_30_YEAR),
      fredApi.getLatestObservation(FRED_SERIES.MORTGAGE_15_YEAR),
    ])

    const rate30Year = parseFloat(rate30Response.value)
    const rate15Year = parseFloat(rate15Response.value)

    // Validate parsed values
    if (isNaN(rate30Year) || isNaN(rate15Year)) {
      throw new Error('Invalid rate data from FRED')
    }

    const data: MortgageRateData = {
      rate30Year,
      rate15Year,
      rate5YearArm: null, // 5/1 ARM data may not always be available
      asOf: rate30Response.date,
      source: 'fred',
      lastUpdated: new Date().toISOString(),
    }

    // Try to get 5/1 ARM rate (optional)
    try {
      const rate5Response = await fredApi.getLatestObservation(
        FRED_SERIES.MORTGAGE_5_YEAR_ARM
      )
      const rate5Year = parseFloat(rate5Response.value)
      if (!isNaN(rate5Year)) {
        data.rate5YearArm = rate5Year
      }
    } catch {
      // 5/1 ARM rate is optional
    }

    // Update cache
    cacheManager.set(CACHE_KEYS.MORTGAGE_RATES, data)

    return data
  } catch (error) {
    console.error('Error fetching mortgage rates:', error)

    // Return stale cache if available
    if (cached) {
      console.warn('Using stale cached mortgage rates')
      return { ...cached, source: 'fallback' }
    }

    // Final fallback to static data
    return getFallbackRates()
  }
}

/**
 * Get fallback rates (static data)
 */
function getFallbackRates(): MortgageRateData {
  return {
    ...FALLBACK_RATES,
    lastUpdated: new Date().toISOString(),
  }
}

/**
 * Get current rates (from cache or fetch)
 */
export async function getCurrentRates(): Promise<MortgageRateData> {
  const cached = cacheManager.get<MortgageRateData>(CACHE_KEYS.MORTGAGE_RATES)

  // Return cache if valid
  if (cached && !cacheManager.isExpired(CACHE_KEYS.MORTGAGE_RATES)) {
    return cached
  }

  // If stale but still have data, return it and refresh in background
  if (cached && cacheManager.isStale(CACHE_KEYS.MORTGAGE_RATES)) {
    // Refresh in background
    fetchMortgageRates().catch(console.error)
    return cached
  }

  // Fetch fresh data
  return fetchMortgageRates()
}

/**
 * Get rate history for charting
 */
export async function getRateHistory(
  months: number = 12
): Promise<{ date: string; rate30: number; rate15: number }[]> {
  if (!fredApi.isConfigured()) {
    return []
  }

  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - months)
  const startDateStr = startDate.toISOString().split('T')[0]

  try {
    const [rate30History, rate15History] = await Promise.all([
      fredApi.getSeriesObservations(FRED_SERIES.MORTGAGE_30_YEAR, {
        observationStart: startDateStr,
        sortOrder: 'asc',
      }),
      fredApi.getSeriesObservations(FRED_SERIES.MORTGAGE_15_YEAR, {
        observationStart: startDateStr,
        sortOrder: 'asc',
      }),
    ])

    // Merge the two series by date
    const rate15Map = new Map(
      rate15History.observations.map((o) => [o.date, parseFloat(o.value)])
    )

    return rate30History.observations
      .map((o) => ({
        date: o.date,
        rate30: parseFloat(o.value),
        rate15: rate15Map.get(o.date) ?? 0,
      }))
      .filter((r) => !isNaN(r.rate30) && r.rate15 > 0)
  } catch (error) {
    console.error('Error fetching rate history:', error)
    return []
  }
}
