import { createContext, useContext, useCallback, useEffect, useReducer, type ReactNode } from 'react'
import type {
  MarketDataState,
  DataFetchStatus,
  MortgageRateData,
  EconomicIndicators,
  HomePriceIndexSeries,
  MarketNewsFeed,
} from '@/types/market-data'
import { fetchMortgageRates } from '@/services/data/mortgageRates'
import { fetchEconomicIndicators } from '@/services/data/economicIndicators'
import { fetchHomePriceIndex } from '@/services/data/homePriceIndex'
import { fetchMarketNews } from '@/services/data/newsService'

// Initial state
const initialState: MarketDataState = {
  rates: null,
  propertyTax: null,
  hpi: null,
  indicators: null,
  news: null,
  status: {
    rates: { state: 'idle' },
    propertyTax: { state: 'idle' },
    hpi: { state: 'idle' },
    indicators: { state: 'idle' },
    news: { state: 'idle' },
  },
}

// Action types
type MarketDataAction =
  | { type: 'SET_RATES'; payload: MortgageRateData }
  | { type: 'SET_RATES_STATUS'; payload: DataFetchStatus }
  | { type: 'SET_INDICATORS'; payload: EconomicIndicators }
  | { type: 'SET_INDICATORS_STATUS'; payload: DataFetchStatus }
  | { type: 'SET_HPI'; payload: HomePriceIndexSeries }
  | { type: 'SET_HPI_STATUS'; payload: DataFetchStatus }
  | { type: 'SET_NEWS'; payload: MarketNewsFeed }
  | { type: 'SET_NEWS_STATUS'; payload: DataFetchStatus }
  | { type: 'REFRESH_ALL' }

// Reducer
function marketDataReducer(state: MarketDataState, action: MarketDataAction): MarketDataState {
  switch (action.type) {
    case 'SET_RATES':
      return { ...state, rates: action.payload }
    case 'SET_RATES_STATUS':
      return { ...state, status: { ...state.status, rates: action.payload } }
    case 'SET_INDICATORS':
      return { ...state, indicators: action.payload }
    case 'SET_INDICATORS_STATUS':
      return { ...state, status: { ...state.status, indicators: action.payload } }
    case 'SET_HPI':
      return { ...state, hpi: action.payload }
    case 'SET_HPI_STATUS':
      return { ...state, status: { ...state.status, hpi: action.payload } }
    case 'SET_NEWS':
      return { ...state, news: action.payload }
    case 'SET_NEWS_STATUS':
      return { ...state, status: { ...state.status, news: action.payload } }
    default:
      return state
  }
}

// Context value type
interface MarketDataContextValue {
  state: MarketDataState
  refreshRates: () => Promise<void>
  refreshIndicators: () => Promise<void>
  refreshHPI: () => Promise<void>
  refreshNews: () => Promise<void>
  refreshAll: () => Promise<void>
  isLoading: boolean
}

const MarketDataContext = createContext<MarketDataContextValue | null>(null)

// Provider component
export function MarketDataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(marketDataReducer, initialState)

  // Fetch mortgage rates
  const refreshRates = useCallback(async () => {
    dispatch({ type: 'SET_RATES_STATUS', payload: { state: 'loading' } })

    try {
      const rates = await fetchMortgageRates()
      dispatch({ type: 'SET_RATES', payload: rates })
      dispatch({
        type: 'SET_RATES_STATUS',
        payload: { state: 'success', lastUpdated: rates.lastUpdated },
      })
    } catch (error) {
      dispatch({
        type: 'SET_RATES_STATUS',
        payload: {
          state: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          usingFallback: true,
        },
      })
    }
  }, [])

  // Fetch economic indicators
  const refreshIndicators = useCallback(async () => {
    dispatch({ type: 'SET_INDICATORS_STATUS', payload: { state: 'loading' } })

    try {
      const indicators = await fetchEconomicIndicators()
      dispatch({ type: 'SET_INDICATORS', payload: indicators })
      dispatch({
        type: 'SET_INDICATORS_STATUS',
        payload: { state: 'success', lastUpdated: indicators.lastUpdated },
      })
    } catch (error) {
      dispatch({
        type: 'SET_INDICATORS_STATUS',
        payload: {
          state: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          usingFallback: true,
        },
      })
    }
  }, [])

  // Fetch home price index
  const refreshHPI = useCallback(async () => {
    dispatch({ type: 'SET_HPI_STATUS', payload: { state: 'loading' } })

    try {
      const hpi = await fetchHomePriceIndex()
      dispatch({ type: 'SET_HPI', payload: hpi })
      dispatch({
        type: 'SET_HPI_STATUS',
        payload: { state: 'success', lastUpdated: new Date().toISOString() },
      })
    } catch (error) {
      dispatch({
        type: 'SET_HPI_STATUS',
        payload: {
          state: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          usingFallback: true,
        },
      })
    }
  }, [])

  // Fetch market news
  const refreshNews = useCallback(async () => {
    dispatch({ type: 'SET_NEWS_STATUS', payload: { state: 'loading' } })

    try {
      const news = await fetchMarketNews()
      dispatch({ type: 'SET_NEWS', payload: news })
      dispatch({
        type: 'SET_NEWS_STATUS',
        payload: { state: 'success', lastUpdated: news.lastFetched },
      })
    } catch (error) {
      dispatch({
        type: 'SET_NEWS_STATUS',
        payload: {
          state: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          usingFallback: false,
        },
      })
    }
  }, [])

  // Refresh all data
  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshRates(),
      refreshIndicators(),
      refreshHPI(),
      refreshNews(),
    ])
  }, [refreshRates, refreshIndicators, refreshHPI, refreshNews])

  // Initial data fetch
  useEffect(() => {
    refreshAll()
  }, [refreshAll])

  // Calculate loading state
  const isLoading =
    state.status.rates.state === 'loading' ||
    state.status.indicators.state === 'loading' ||
    state.status.hpi.state === 'loading' ||
    state.status.news.state === 'loading'

  const value: MarketDataContextValue = {
    state,
    refreshRates,
    refreshIndicators,
    refreshHPI,
    refreshNews,
    refreshAll,
    isLoading,
  }

  return (
    <MarketDataContext.Provider value={value}>
      {children}
    </MarketDataContext.Provider>
  )
}

// Hook to use market data
export function useMarketData(): MarketDataContextValue {
  const context = useContext(MarketDataContext)
  if (!context) {
    throw new Error('useMarketData must be used within MarketDataProvider')
  }
  return context
}

// Convenience hook for just rates
export function useMortgageRates() {
  const { state, refreshRates } = useMarketData()
  return {
    rates: state.rates,
    status: state.status.rates,
    refresh: refreshRates,
    isLoading: state.status.rates.state === 'loading',
  }
}

// Convenience hook for economic indicators
export function useEconomicIndicators() {
  const { state, refreshIndicators } = useMarketData()
  return {
    indicators: state.indicators,
    status: state.status.indicators,
    refresh: refreshIndicators,
    isLoading: state.status.indicators.state === 'loading',
  }
}

// Convenience hook for home price index
export function useHomePriceIndex() {
  const { state, refreshHPI } = useMarketData()
  return {
    hpi: state.hpi,
    status: state.status.hpi,
    refresh: refreshHPI,
    isLoading: state.status.hpi.state === 'loading',
  }
}

// Convenience hook for market news
export function useMarketNews() {
  const { state, refreshNews } = useMarketData()
  return {
    news: state.news,
    status: state.status.news,
    refresh: refreshNews,
    isLoading: state.status.news.state === 'loading',
  }
}
