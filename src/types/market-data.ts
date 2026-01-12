// ==================== Mortgage Rates ====================
export interface MortgageRateData {
  rate30Year: number
  rate15Year: number
  rate5YearArm: number | null
  asOf: string // ISO date string
  source: 'fred' | 'fallback'
  lastUpdated: string
}

export interface FREDObservation {
  date: string
  value: string // FRED returns strings
}

export interface FREDSeriesResponse {
  realtime_start: string
  realtime_end: string
  observation_start: string
  observation_end: string
  units: string
  output_type: number
  file_type: string
  order_by: string
  sort_order: string
  count: number
  offset: number
  limit: number
  observations: FREDObservation[]
}

// ==================== Property Tax ====================
export interface TexasCountyTaxRate {
  countyId: string
  name: string
  totalRate: number
  countyRate: number
  schoolRate: number
  hospitalRate: number | null
  otherSpecialDistricts: number
  lastUpdated: string
}

export interface TexasTaxRateDatabase {
  version: string
  lastUpdated: string
  source?: string
  counties: Record<string, TexasCountyTaxRate>
}

export interface PropertyTaxLookupResult {
  found: boolean
  county: TexasCountyTaxRate | null
  source: 'database' | 'manual'
}

// ==================== Home Price Index ====================
export interface HomePriceIndexData {
  current: number
  previousYear: number
  yearOverYearChange: number
  fiveYearChange: number | null
  asOf: string
  source: 'fred' | 'fhfa' | 'fallback'
}

export interface HomePriceIndexSeries {
  texas: HomePriceIndexData | null
  national: HomePriceIndexData | null
  metro?: {
    houston?: HomePriceIndexData
    dallas?: HomePriceIndexData
    austin?: HomePriceIndexData
    sanAntonio?: HomePriceIndexData
  }
}

// ==================== Economic Indicators ====================
export interface EconomicIndicators {
  fedFundsRate: {
    current: number
    target: { lower: number; upper: number }
    lastChange: string
    changeDirection: 'up' | 'down' | 'unchanged'
  }
  treasury10Year: number
  inflation: {
    cpiAllItems: number
    cpiCore: number
    asOf: string
  }
  unemployment: {
    rate: number
    asOf: string
  }
  housingStarts: {
    value: number
    monthOverMonth: number
    asOf: string
  } | null
  lastUpdated: string
  source: 'fred' | 'fallback'
}

// ==================== News Feed ====================
export interface NewsItem {
  id: string
  title: string
  summary: string
  fullDescription?: string // Full content when available (longer than summary)
  link: string
  pubDate: string
  source: string
  category: 'rates' | 'market' | 'fed' | 'general'
}

export interface MarketNewsFeed {
  items: NewsItem[]
  lastFetched: string
  sources: string[]
}

// ==================== Combined Market Data ====================
export type DataFetchStatus =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'success'; lastUpdated: string }
  | { state: 'error'; error: string; usingFallback: boolean }
  | { state: 'stale'; lastUpdated: string; refreshing: boolean }

export interface MarketDataState {
  rates: MortgageRateData | null
  propertyTax: PropertyTaxLookupResult | null
  hpi: HomePriceIndexSeries | null
  indicators: EconomicIndicators | null
  news: MarketNewsFeed | null
  status: {
    rates: DataFetchStatus
    propertyTax: DataFetchStatus
    hpi: DataFetchStatus
    indicators: DataFetchStatus
    news: DataFetchStatus
  }
}
