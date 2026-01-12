import { cacheManager, CACHE_KEYS } from '@/services/cache/cacheManager'
import type { NewsItem, MarketNewsFeed } from '@/types/market-data'

// RSS feed sources - use Vite proxy in development to avoid CORS
const RSS_FEEDS = import.meta.env.DEV
  ? {
      mortgageNewsDaily: '/api/rss/mortgagenews',
      housingWire: '/api/rss/housingwire',
      calculateRisk: '/api/rss/calculatedrisk',
    }
  : {
      mortgageNewsDaily: 'https://www.mortgagenewsdaily.com/mortgage-rates-feed',
      housingWire: 'https://www.housingwire.com/feed/',
      calculateRisk: 'https://www.calculatedriskblog.com/feeds/posts/default?alt=rss',
    }

// Whether we're using Vite proxy (direct fetch) or need CORS proxy wrapper
const USE_VITE_PROXY = import.meta.env.DEV

// CORS proxy for fetching RSS feeds (production only)
const CORS_PROXY = import.meta.env.VITE_CORS_PROXY || 'https://api.allorigins.win/get?url='

/**
 * Parse RSS XML into news items
 */
function parseRSS(xml: string, source: string): NewsItem[] {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, 'text/xml')

    // Check for parse errors
    const parseError = doc.querySelector('parsererror')
    if (parseError) {
      console.warn(`RSS parse error for ${source}`)
      return []
    }

    const items = doc.querySelectorAll('item')
    const newsItems: NewsItem[] = []

    items.forEach((item, index) => {
      const title = item.querySelector('title')?.textContent?.trim() ?? ''
      const link = item.querySelector('link')?.textContent?.trim() ?? ''
      const pubDate = item.querySelector('pubDate')?.textContent?.trim() ?? ''
      const description =
        item.querySelector('description')?.textContent?.trim() ??
        item.querySelector('content\\:encoded')?.textContent?.trim() ??
        ''

      // Extract summary (first 200 chars, strip HTML)
      const summary = description
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .substring(0, 200)
        .trim()

      // Categorize based on title/content
      const category = categorizeNewsItem(title, summary)

      if (title && link) {
        newsItems.push({
          id: `${source}-${index}-${Date.now()}`,
          title,
          summary: summary + (summary.length >= 200 ? '...' : ''),
          link,
          pubDate: pubDate || new Date().toISOString(),
          source,
          category,
        })
      }
    })

    return newsItems
  } catch (error) {
    console.error(`Error parsing RSS for ${source}:`, error)
    return []
  }
}

/**
 * Categorize news item based on content
 */
function categorizeNewsItem(title: string, summary: string): NewsItem['category'] {
  const text = (title + ' ' + summary).toLowerCase()

  if (text.includes('fed') || text.includes('federal reserve') || text.includes('powell') || text.includes('fomc')) {
    return 'fed'
  }
  if (text.includes('rate') || text.includes('mortgage') || text.includes('apr') || text.includes('refinanc')) {
    return 'rates'
  }
  if (text.includes('housing') || text.includes('home price') || text.includes('inventory') || text.includes('sale')) {
    return 'market'
  }

  return 'general'
}

/**
 * Fetch a single RSS feed (uses Vite proxy in dev, CORS proxy in prod)
 */
async function fetchRSSFeed(url: string, source: string): Promise<NewsItem[]> {
  try {
    let xml: string

    if (USE_VITE_PROXY) {
      // In development: direct fetch through Vite proxy
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      xml = await response.text()
    } else {
      // In production: use CORS proxy wrapper
      const proxyUrl = `${CORS_PROXY}${encodeURIComponent(url)}`
      const response = await fetch(proxyUrl)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data = await response.json()
      // allorigins returns the content in a 'contents' field
      xml = data.contents || data
      if (typeof xml !== 'string') {
        throw new Error('Invalid response format')
      }
    }

    return parseRSS(xml, source)
  } catch (error) {
    console.warn(`Failed to fetch RSS feed from ${source}:`, error)
    return []
  }
}

/**
 * Fetch all news feeds and aggregate
 */
export async function fetchMarketNews(): Promise<MarketNewsFeed> {
  // Check cache first
  const cached = cacheManager.get<MarketNewsFeed>(CACHE_KEYS.NEWS_FEEDS)
  if (cached && !cacheManager.isExpired(CACHE_KEYS.NEWS_FEEDS)) {
    return cached
  }

  try {
    // Fetch all feeds in parallel
    const results = await Promise.allSettled([
      fetchRSSFeed(RSS_FEEDS.mortgageNewsDaily, 'Mortgage News Daily'),
      fetchRSSFeed(RSS_FEEDS.housingWire, 'HousingWire'),
      fetchRSSFeed(RSS_FEEDS.calculateRisk, 'Calculated Risk'),
    ])

    // Combine and sort by date
    const allItems: NewsItem[] = []
    const successfulSources: string[] = []

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.length > 0) {
        allItems.push(...result.value)
        successfulSources.push(Object.values(RSS_FEEDS)[index] ?? 'Unknown')
      }
    })

    // Sort by publication date (newest first)
    allItems.sort((a, b) => {
      const dateA = new Date(a.pubDate).getTime()
      const dateB = new Date(b.pubDate).getTime()
      return dateB - dateA
    })

    // Limit to most recent 50 items
    const items = allItems.slice(0, 50)

    const feed: MarketNewsFeed = {
      items,
      lastFetched: new Date().toISOString(),
      sources: successfulSources,
    }

    // Update cache
    cacheManager.set(CACHE_KEYS.NEWS_FEEDS, feed)

    return feed
  } catch (error) {
    console.error('Error fetching market news:', error)

    // Return stale cache if available
    if (cached) {
      console.warn('Using stale cached news feed')
      return cached
    }

    // Return empty feed
    return {
      items: [],
      lastFetched: new Date().toISOString(),
      sources: [],
    }
  }
}

/**
 * Get current news (from cache or fetch)
 */
export async function getCurrentNews(): Promise<MarketNewsFeed> {
  const cached = cacheManager.get<MarketNewsFeed>(CACHE_KEYS.NEWS_FEEDS)

  // Return cache if valid
  if (cached && !cacheManager.isExpired(CACHE_KEYS.NEWS_FEEDS)) {
    return cached
  }

  // If stale but still have data, return it and refresh in background
  if (cached && cacheManager.isStale(CACHE_KEYS.NEWS_FEEDS)) {
    fetchMarketNews().catch(console.error)
    return cached
  }

  // Fetch fresh data
  return fetchMarketNews()
}

/**
 * Get news items by category
 */
export function getNewsByCategory(
  feed: MarketNewsFeed,
  category: NewsItem['category']
): NewsItem[] {
  return feed.items.filter((item) => item.category === category)
}

/**
 * Get recent Fed-related news
 */
export function getFedNews(feed: MarketNewsFeed, limit = 5): NewsItem[] {
  return feed.items.filter((item) => item.category === 'fed').slice(0, limit)
}

/**
 * Get recent rate-related news
 */
export function getRateNews(feed: MarketNewsFeed, limit = 5): NewsItem[] {
  return feed.items.filter((item) => item.category === 'rates').slice(0, limit)
}

/**
 * Search news items
 */
export function searchNews(feed: MarketNewsFeed, query: string): NewsItem[] {
  const normalizedQuery = query.toLowerCase()
  return feed.items.filter(
    (item) =>
      item.title.toLowerCase().includes(normalizedQuery) ||
      item.summary.toLowerCase().includes(normalizedQuery)
  )
}

/**
 * Format relative time for display
 */
export function formatNewsDate(pubDate: string): string {
  const date = new Date(pubDate)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffHours < 1) {
    return 'Just now'
  } else if (diffHours < 24) {
    return `${diffHours}h ago`
  } else if (diffDays < 7) {
    return `${diffDays}d ago`
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
}
