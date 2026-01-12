import type { TexasCountyTaxRate, PropertyTaxLookupResult, TexasTaxRateDatabase } from '@/types/market-data'
import texasTaxData from '@/data/texas-property-tax.json'

// Type assertion for the imported JSON
const taxDatabase = texasTaxData as TexasTaxRateDatabase

/**
 * Get all Texas counties sorted alphabetically
 */
export function getAllCounties(): TexasCountyTaxRate[] {
  return Object.values(taxDatabase.counties).sort((a, b) =>
    a.name.localeCompare(b.name)
  )
}

/**
 * Look up a county's tax rate by ID
 */
export function lookupCountyTaxRate(countyId: string): PropertyTaxLookupResult {
  const normalizedId = countyId.toLowerCase().replace(/\s+/g, '_')
  const county = taxDatabase.counties[normalizedId]

  if (county) {
    return {
      found: true,
      county,
      source: 'database',
    }
  }

  return {
    found: false,
    county: null,
    source: 'database',
  }
}

/**
 * Search counties by name (partial match)
 */
export function searchCounties(query: string): TexasCountyTaxRate[] {
  if (!query || query.length < 2) {
    return getAllCounties()
  }

  const normalizedQuery = query.toLowerCase()

  return Object.values(taxDatabase.counties)
    .filter(
      (county) =>
        county.name.toLowerCase().includes(normalizedQuery) ||
        county.countyId.includes(normalizedQuery)
    )
    .sort((a, b) => {
      // Prioritize exact prefix matches
      const aStartsWith = a.name.toLowerCase().startsWith(normalizedQuery)
      const bStartsWith = b.name.toLowerCase().startsWith(normalizedQuery)
      if (aStartsWith && !bStartsWith) return -1
      if (!aStartsWith && bStartsWith) return 1
      return a.name.localeCompare(b.name)
    })
}

/**
 * Get county by name (case-insensitive)
 */
export function getCountyByName(name: string): TexasCountyTaxRate | null {
  const normalizedName = name.toLowerCase()

  for (const county of Object.values(taxDatabase.counties)) {
    if (county.name.toLowerCase() === normalizedName) {
      return county
    }
  }

  return null
}

/**
 * Get database metadata
 */
export function getDatabaseMetadata(): { version: string; lastUpdated: string; source: string } {
  return {
    version: taxDatabase.version,
    lastUpdated: taxDatabase.lastUpdated,
    source: taxDatabase.source ?? 'Texas Comptroller of Public Accounts',
  }
}

/**
 * Get counties with the highest tax rates
 */
export function getHighestTaxCounties(limit: number = 10): TexasCountyTaxRate[] {
  return Object.values(taxDatabase.counties)
    .sort((a, b) => b.totalRate - a.totalRate)
    .slice(0, limit)
}

/**
 * Get counties with the lowest tax rates
 */
export function getLowestTaxCounties(limit: number = 10): TexasCountyTaxRate[] {
  return Object.values(taxDatabase.counties)
    .sort((a, b) => a.totalRate - b.totalRate)
    .slice(0, limit)
}

/**
 * Get the average tax rate across all counties
 */
export function getAverageTaxRate(): number {
  const counties = Object.values(taxDatabase.counties)
  const total = counties.reduce((sum, county) => sum + county.totalRate, 0)
  return total / counties.length
}

/**
 * Get major metro area counties
 */
export function getMetroCounties(): Record<string, TexasCountyTaxRate[]> {
  const metros: Record<string, string[]> = {
    'Houston Metro': ['harris', 'fort_bend', 'montgomery', 'brazoria', 'galveston'],
    'Dallas-Fort Worth': ['dallas', 'tarrant', 'collin', 'denton', 'ellis', 'kaufman', 'rockwall', 'johnson', 'parker'],
    'San Antonio': ['bexar', 'guadalupe', 'comal'],
    'Austin': ['travis', 'williamson', 'hays'],
  }

  const result: Record<string, TexasCountyTaxRate[]> = {}

  for (const [metro, countyIds] of Object.entries(metros)) {
    result[metro] = countyIds
      .map((id) => taxDatabase.counties[id])
      .filter((c): c is TexasCountyTaxRate => c !== undefined)
  }

  return result
}
