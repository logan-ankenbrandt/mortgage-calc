export interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

export interface CacheConfig {
  ttl: number // Time to live in milliseconds
  staleWhileRevalidate: boolean
}

const DEFAULT_CONFIGS: Record<string, CacheConfig> = {
  mortgageRates: {
    ttl: 4 * 60 * 60 * 1000, // 4 hours (rates update weekly)
    staleWhileRevalidate: true,
  },
  homePriceIndex: {
    ttl: 24 * 60 * 60 * 1000, // 24 hours (updates quarterly)
    staleWhileRevalidate: true,
  },
  economicIndicators: {
    ttl: 6 * 60 * 60 * 1000, // 6 hours
    staleWhileRevalidate: true,
  },
  newsFeeds: {
    ttl: 30 * 60 * 1000, // 30 minutes
    staleWhileRevalidate: false,
  },
  propertyTaxRates: {
    ttl: 7 * 24 * 60 * 60 * 1000, // 7 days (static data)
    staleWhileRevalidate: true,
  },
}

const STORAGE_PREFIX = 'mortgage-calc-cache-'

class CacheManager {
  private memoryCache: Map<string, CacheEntry<unknown>> = new Map()

  /**
   * Get data from cache (memory first, then localStorage)
   */
  get<T>(key: string): T | null {
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key) as CacheEntry<T> | undefined
    if (memoryEntry) {
      return memoryEntry.data
    }

    // Fall back to localStorage
    try {
      const stored = localStorage.getItem(STORAGE_PREFIX + key)
      if (stored) {
        const entry = JSON.parse(stored) as CacheEntry<T>
        // Also populate memory cache
        this.memoryCache.set(key, entry)
        return entry.data
      }
    } catch {
      // Ignore parse errors
    }

    return null
  }

  /**
   * Store data in cache (both memory and localStorage)
   */
  set<T>(key: string, data: T, config?: Partial<CacheConfig>): void {
    const cacheConfig = {
      ...DEFAULT_CONFIGS[key],
      ...config,
    }

    const ttl = cacheConfig?.ttl ?? 60 * 60 * 1000 // Default 1 hour

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    }

    // Store in memory
    this.memoryCache.set(key, entry)

    // Store in localStorage
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry))
    } catch {
      // Ignore storage errors (quota exceeded, etc.)
    }
  }

  /**
   * Check if cached data is expired
   */
  isExpired(key: string): boolean {
    const entry = this.getEntry(key)
    if (!entry) return true
    return Date.now() > entry.expiresAt
  }

  /**
   * Check if cached data is stale but still usable
   */
  isStale(key: string): boolean {
    return this.isExpired(key) && this.get(key) !== null
  }

  /**
   * Get the cache entry with metadata
   */
  getEntry<T>(key: string): CacheEntry<T> | null {
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key) as CacheEntry<T> | undefined
    if (memoryEntry) {
      return memoryEntry
    }

    // Fall back to localStorage
    try {
      const stored = localStorage.getItem(STORAGE_PREFIX + key)
      if (stored) {
        return JSON.parse(stored) as CacheEntry<T>
      }
    } catch {
      // Ignore parse errors
    }

    return null
  }

  /**
   * Get timestamp of when data was cached
   */
  getTimestamp(key: string): number | null {
    const entry = this.getEntry(key)
    return entry?.timestamp ?? null
  }

  /**
   * Clear specific cache entry
   */
  clear(key: string): void {
    this.memoryCache.delete(key)
    try {
      localStorage.removeItem(STORAGE_PREFIX + key)
    } catch {
      // Ignore errors
    }
  }

  /**
   * Clear all cache entries
   */
  clearAll(): void {
    this.memoryCache.clear()
    try {
      const keys = Object.keys(localStorage).filter((k) =>
        k.startsWith(STORAGE_PREFIX)
      )
      keys.forEach((k) => localStorage.removeItem(k))
    } catch {
      // Ignore errors
    }
  }

  /**
   * Get cache configuration for a key
   */
  getConfig(key: string): CacheConfig {
    return DEFAULT_CONFIGS[key] ?? { ttl: 60 * 60 * 1000, staleWhileRevalidate: false }
  }
}

// Singleton instance
export const cacheManager = new CacheManager()

// Cache key constants
export const CACHE_KEYS = {
  MORTGAGE_RATES: 'mortgageRates',
  HOME_PRICE_INDEX: 'homePriceIndex',
  ECONOMIC_INDICATORS: 'economicIndicators',
  NEWS_FEEDS: 'newsFeeds',
  PROPERTY_TAX_RATES: 'propertyTaxRates',
} as const
