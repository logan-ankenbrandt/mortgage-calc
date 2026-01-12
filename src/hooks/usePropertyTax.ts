import { useState, useMemo, useCallback } from 'react'
import type { TexasCountyTaxRate, PropertyTaxLookupResult } from '@/types/market-data'
import {
  getAllCounties,
  lookupCountyTaxRate,
  searchCounties,
  getMetroCounties,
  getAverageTaxRate,
} from '@/services/data/propertyTax'

export function usePropertyTax() {
  const [selectedCountyId, setSelectedCountyId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Get all counties
  const counties = useMemo(() => getAllCounties(), [])

  // Get metro area groupings
  const metroCounties = useMemo(() => getMetroCounties(), [])

  // Get average tax rate
  const averageRate = useMemo(() => getAverageTaxRate(), [])

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery) return counties
    return searchCounties(searchQuery)
  }, [searchQuery, counties])

  // Lookup function
  const lookup = useCallback((countyId: string): PropertyTaxLookupResult => {
    return lookupCountyTaxRate(countyId)
  }, [])

  // Currently selected county
  const selectedCounty = useMemo<TexasCountyTaxRate | null>(() => {
    if (!selectedCountyId) return null
    const result = lookup(selectedCountyId)
    return result.county
  }, [selectedCountyId, lookup])

  // Select a county
  const selectCounty = useCallback((countyId: string | null) => {
    setSelectedCountyId(countyId)
  }, [])

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedCountyId(null)
    setSearchQuery('')
  }, [])

  return {
    // Data
    counties,
    metroCounties,
    averageRate,
    searchResults,
    selectedCounty,
    selectedCountyId,

    // Search
    searchQuery,
    setSearchQuery,

    // Actions
    lookup,
    selectCounty,
    clearSelection,
  }
}
