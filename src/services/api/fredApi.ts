import type { FREDSeriesResponse, FREDObservation } from '@/types/market-data'

// Use Vite proxy in development to avoid CORS issues
const FRED_BASE_URL = import.meta.env.DEV
  ? '/api/fred'
  : 'https://api.stlouisfed.org/fred'

// Common FRED series IDs for mortgage/housing data
export const FRED_SERIES = {
  // Mortgage rates
  MORTGAGE_30_YEAR: 'MORTGAGE30US',
  MORTGAGE_15_YEAR: 'MORTGAGE15US',
  MORTGAGE_5_YEAR_ARM: 'MORTGAGE5US',

  // Home price indices
  TEXAS_HPI: 'TXSTHPI',
  NATIONAL_HPI: 'USSTHPI',
  CASE_SHILLER_NATIONAL: 'CSUSHPINSA',
  HOUSTON_HPI: 'ATNHPIUS26420Q',
  DALLAS_HPI: 'ATNHPIUS19100Q',
  AUSTIN_HPI: 'ATNHPIUS12420Q',
  SAN_ANTONIO_HPI: 'ATNHPIUS41700Q',

  // Economic indicators
  FED_FUNDS_RATE: 'FEDFUNDS',
  FED_FUNDS_TARGET_UPPER: 'DFEDTARU',
  FED_FUNDS_TARGET_LOWER: 'DFEDTARL',
  TREASURY_10_YEAR: 'DGS10',
  CPI_ALL_ITEMS: 'CPIAUCSL',
  CPI_CORE: 'CPILFESL',
  UNEMPLOYMENT_RATE: 'UNRATE',
  HOUSING_STARTS: 'HOUST',
} as const

interface FredApiOptions {
  observationStart?: string
  observationEnd?: string
  limit?: number
  sortOrder?: 'asc' | 'desc'
  units?: 'lin' | 'chg' | 'pc1' | 'pch'
}

class FredApiClient {
  private apiKey: string

  constructor(apiKey: string = '') {
    this.apiKey = apiKey
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return this.apiKey.length > 0
  }

  /**
   * Set API key
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey.trim()
  }

  /**
   * Get series observations from FRED
   */
  async getSeriesObservations(
    seriesId: string,
    options: FredApiOptions = {}
  ): Promise<FREDSeriesResponse> {
    if (!this.apiKey) {
      throw new Error('FRED API key not configured')
    }

    const params = new URLSearchParams({
      series_id: seriesId,
      api_key: this.apiKey,
      file_type: 'json',
      ...(options.observationStart && {
        observation_start: options.observationStart,
      }),
      ...(options.observationEnd && { observation_end: options.observationEnd }),
      ...(options.limit && { limit: String(options.limit) }),
      ...(options.sortOrder && { sort_order: options.sortOrder }),
      ...(options.units && { units: options.units }),
    })

    const response = await fetch(
      `${FRED_BASE_URL}/series/observations?${params}`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`FRED API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get the latest observation for a series
   */
  async getLatestObservation(seriesId: string): Promise<FREDObservation> {
    const response = await this.getSeriesObservations(seriesId, {
      limit: 1,
      sortOrder: 'desc',
    })

    if (!response.observations.length) {
      throw new Error(`No observations found for series ${seriesId}`)
    }

    return response.observations[0]!
  }

  /**
   * Get multiple series in parallel
   */
  async getMultipleSeries(
    seriesIds: string[],
    options?: FredApiOptions
  ): Promise<Record<string, FREDSeriesResponse>> {
    const results = await Promise.all(
      seriesIds.map(async (id) => {
        try {
          const data = await this.getSeriesObservations(id, options)
          return [id, data] as const
        } catch (error) {
          console.warn(`Failed to fetch series ${id}:`, error)
          return [id, null] as const
        }
      })
    )

    return Object.fromEntries(results.filter(([, data]) => data !== null)) as Record<
      string,
      FREDSeriesResponse
    >
  }

  /**
   * Get percent change from year ago for a series
   */
  async getYearOverYearChange(seriesId: string): Promise<number | null> {
    try {
      const response = await this.getSeriesObservations(seriesId, {
        limit: 1,
        sortOrder: 'desc',
        units: 'pc1', // Percent change from year ago
      })

      if (response.observations.length > 0) {
        const value = parseFloat(response.observations[0]!.value)
        return isNaN(value) ? null : value
      }
    } catch {
      // Return null on error
    }
    return null
  }
}

// Create singleton instance
// API key can be set via environment variable or later via setApiKey()
const FRED_API_KEY = (import.meta.env.VITE_FRED_API_KEY || '541c1c2eb9bad23735fa515363596d18').trim()
export const fredApi = new FredApiClient(FRED_API_KEY)

// Export class for testing or custom instances
export { FredApiClient }
