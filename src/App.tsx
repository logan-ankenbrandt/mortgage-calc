import { useState, useEffect } from 'react'
import { CalculatorProvider, useCalculatorContext } from './context/CalculatorContext'
import { useCalculator } from './hooks/useCalculator'
import { MarketDataProvider, useMortgageRates, useEconomicIndicators, useHomePriceIndex, useMarketNews } from './context/MarketDataContext'
import { formatNewsDate } from './services/data/newsService'
import { getRateHistory } from './services/data/mortgageRates'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { ThemeProvider } from './components/layout/theme-provider'
import { AppShell } from './components/layout/app-shell'
import { TooltipProvider } from './components/ui/tooltip'
import { Badge } from './components/ui/badge'
import { Button } from './components/ui/button'
import { Skeleton } from './components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './components/ui/dialog'
import type { NewsItem } from './types/market-data'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { IncomeSection } from './features/income/IncomeSection'
import { PropertySection } from './features/property/PropertySection'
import { ScenarioComparison } from './features/scenarios/ScenarioComparison'
import { SavingsTracker } from './features/savings/SavingsTracker'
import { AmortizationPage } from './features/amortization/AmortizationPage'
import { AnalysisPage } from './features/analysis/AnalysisPage'
import { SettingsPage } from './features/settings/SettingsPage'
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, Percent, Building2, PiggyBank, Newspaper, Home, ExternalLink } from 'lucide-react'
import { formatCurrency, formatPercent } from './utils/formatters'

// Dashboard with real data
function Dashboard() {
  const { state } = useCalculatorContext()
  const { computed } = useCalculator()
  const { rates, isLoading: ratesLoading } = useMortgageRates()
  const { indicators, isLoading: indicatorsLoading } = useEconomicIndicators()

  const totalIncome = state.income.person1 + state.income.person2Base + state.income.person2Variable
  const monthlySavings = state.savings.manualOverride
    ? state.savings.monthly
    : Math.max(0, totalIncome - state.expenses)
  const downPayment20 = state.property.price * 0.2
  const progressTo20 = (state.savings.current / downPayment20) * 100

  // Find best scenario (lowest cost that's affordable)
  const scenarios = [
    { key: 'earlyCurrentRate', label: 'Early @ Current', ...computed.scenarios.earlyCurrentRate },
    { key: 'delayedCurrentRate', label: 'Delayed @ Current', ...computed.scenarios.delayedCurrentRate },
    { key: 'earlyAltRate', label: 'Early @ Alt', ...computed.scenarios.earlyAltRate },
    { key: 'delayedAltRate', label: 'Delayed @ Alt', ...computed.scenarios.delayedAltRate },
  ]
  const affordableScenarios = scenarios.filter(s => s.affordabilityStatus === 'affordable')
  // Always defined: either first affordable or first scenario (scenarios always has 4 elements)
  const bestScenario = (affordableScenarios.length > 0
    ? affordableScenarios.sort((a, b) => a.totalMonthlyHousing - b.totalMonthlyHousing)[0]
    : scenarios[0])!

  // Rate comparison
  const userRate = state.property.currentRate
  const marketRate = rates?.rate30Year ?? null
  const rateVsMarket = marketRate !== null ? userRate - marketRate : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your mortgage planning journey
        </p>
      </div>

      {/* Market Rates Banner */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Current Mortgage Rates</CardTitle>
            {rates && (
              <Badge variant={rates.source === 'fred' ? 'default' : 'secondary'}>
                {rates.source === 'fred' ? 'Live Data' : 'Fallback'}
              </Badge>
            )}
          </div>
          <CardDescription>
            {rates ? `As of ${rates.asOf}` : 'Loading market data...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {ratesLoading ? (
              <>
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </>
            ) : rates ? (
              <>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">30-Year Fixed</p>
                  <p className="text-2xl font-bold">{rates.rate30Year.toFixed(2)}%</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">15-Year Fixed</p>
                  <p className="text-2xl font-bold">{rates.rate15Year.toFixed(2)}%</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Fed Funds Rate</p>
                  <p className="text-2xl font-bold">
                    {indicatorsLoading ? (
                      <Skeleton className="h-8 w-16 mx-auto" />
                    ) : (
                      `${indicators?.fedFundsRate.current.toFixed(2) ?? '--'}%`
                    )}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground col-span-3 text-center py-4">
                Unable to load market rates. Configure FRED API key for live data.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Calculator Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Target Home Price</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(state.property.price)}</div>
            <p className="text-xs text-muted-foreground">
              20% down: {formatCurrency(downPayment20)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Savings</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(state.savings.current)}</div>
            <p className="text-xs text-muted-foreground">
              {progressTo20 >= 100 ? 'Ready for 20% down!' : `${progressTo20.toFixed(0)}% of 20% down`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(monthlySavings)}</div>
            <p className="text-xs text-muted-foreground">
              Income - Expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{formatPercent(state.property.currentRate)}</span>
              {rateVsMarket !== null && (
                <span className={`text-sm flex items-center gap-1 ${rateVsMarket < 0 ? 'text-green-600 dark:text-green-400' : rateVsMarket > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                  {rateVsMarket < 0 ? <TrendingDown className="h-3 w-3" /> : rateVsMarket > 0 ? <TrendingUp className="h-3 w-3" /> : null}
                  {rateVsMarket !== 0 && `${rateVsMarket > 0 ? '+' : ''}${rateVsMarket.toFixed(2)}%`}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {state.property.loanTerm}-year term{marketRate !== null && ` · Market: ${marketRate.toFixed(2)}%`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Economic Indicators */}
      {indicators && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Economic Indicators</CardTitle>
            <CardDescription>Key metrics affecting mortgage rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Percent className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">10-Year Treasury</p>
                  <p className="font-semibold">{indicators.treasury10Year.toFixed(2)}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  {indicators.inflation.cpiAllItems > 3 ? (
                    <TrendingUp className="h-4 w-4 text-orange-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-green-500" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Inflation (CPI)</p>
                  <p className="font-semibold">{indicators.inflation.cpiAllItems.toFixed(1)}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <DollarSign className="h-4 w-4 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Unemployment</p>
                  <p className="font-semibold">{indicators.unemployment.rate.toFixed(1)}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Building2 className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fed Target</p>
                  <p className="font-semibold">
                    {indicators.fedFundsRate.target.lower.toFixed(2)}-{indicators.fedFundsRate.target.upper.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Best Scenario Summary */}
      <Card className={bestScenario.affordabilityStatus === 'affordable' ? 'border-green-500/30 bg-green-500/5' : bestScenario.affordabilityStatus === 'requires-variable' ? 'border-amber-500/30 bg-amber-500/5' : ''}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Best Scenario</CardTitle>
            <Badge variant={bestScenario.affordabilityStatus === 'affordable' ? 'success' : bestScenario.affordabilityStatus === 'requires-variable' ? 'warning' : 'destructive'}>
              {bestScenario.affordabilityStatus === 'affordable' ? 'Affordable' : bestScenario.affordabilityStatus === 'requires-variable' ? 'Needs Variable' : 'Not Affordable'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{bestScenario.label}</p>
              <p className="text-2xl font-bold">{formatCurrency(bestScenario.totalMonthlyHousing)}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Down Payment</p>
              <p className="font-semibold">{formatCurrency(bestScenario.downPayment)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Navigate to specific sections using the sidebar to configure your mortgage calculations.
      </p>
    </div>
  )
}

function MarketPage() {
  const { rates, isLoading: ratesLoading, refresh: refreshRates } = useMortgageRates()
  const { indicators, isLoading: indicatorsLoading, refresh: refreshIndicators } = useEconomicIndicators()
  const { hpi, isLoading: hpiLoading, refresh: refreshHPI } = useHomePriceIndex()
  const { news, isLoading: newsLoading, refresh: refreshNews } = useMarketNews()

  const [newsCategory, setNewsCategory] = useState<'all' | 'rates' | 'fed' | 'market' | 'general'>('all')
  const [selectedNewsItem, setSelectedNewsItem] = useState<NewsItem | null>(null)
  const [rateHistory, setRateHistory] = useState<{ date: string; rate30: number; rate15: number }[]>([])
  const [rateHistoryLoading, setRateHistoryLoading] = useState(true)
  const [rateHistoryError, setRateHistoryError] = useState(false)

  // Fetch rate history on mount
  useEffect(() => {
    let mounted = true
    async function fetchHistory() {
      setRateHistoryLoading(true)
      setRateHistoryError(false)
      try {
        const history = await getRateHistory(12)
        if (mounted) setRateHistory(history)
      } catch (e) {
        console.error('Failed to fetch rate history:', e)
        if (mounted) setRateHistoryError(true)
      } finally {
        if (mounted) setRateHistoryLoading(false)
      }
    }
    fetchHistory()
    return () => { mounted = false }
  }, [])

  const isAnyLoading = ratesLoading || indicatorsLoading || hpiLoading || newsLoading

  const handleRefresh = async () => {
    await Promise.all([refreshRates(), refreshIndicators(), refreshHPI(), refreshNews()])
    // Also refresh rate history
    setRateHistoryLoading(true)
    setRateHistoryError(false)
    try {
      const history = await getRateHistory(12)
      setRateHistory(history)
    } catch (e) {
      console.error('Failed to refresh rate history:', e)
      setRateHistoryError(true)
    } finally {
      setRateHistoryLoading(false)
    }
  }

  // Filter news by category
  const filteredNews = news?.items.filter(item =>
    newsCategory === 'all' ? true : item.category === newsCategory
  ) ?? []

  // Count items per category
  const categoryCount = {
    all: news?.items.length ?? 0,
    rates: news?.items.filter(i => i.category === 'rates').length ?? 0,
    fed: news?.items.filter(i => i.category === 'fed').length ?? 0,
    market: news?.items.filter(i => i.category === 'market').length ?? 0,
    general: news?.items.filter(i => i.category === 'general').length ?? 0,
  }

  // Format chart data
  const chartData = rateHistory.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    '30-Year': d.rate30,
    '15-Year': d.rate15,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Market Insights</h1>
          <p className="text-muted-foreground">
            Current rates, trends, and economic indicators
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isAnyLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isAnyLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Mortgage Rates */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Mortgage Rates</CardTitle>
            {rates && (
              <Badge variant={rates.source === 'fred' ? 'default' : 'secondary'}>
                {rates.source === 'fred' ? 'FRED API' : 'Fallback Data'}
              </Badge>
            )}
          </div>
          <CardDescription>
            Weekly average rates from Freddie Mac Primary Mortgage Market Survey
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ratesLoading ? (
            <div className="grid gap-4 md:grid-cols-3">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          ) : rates ? (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg border bg-card">
                <p className="text-sm text-muted-foreground mb-1">30-Year Fixed</p>
                <p className="text-3xl font-bold">{rates.rate30Year.toFixed(2)}%</p>
                <p className="text-xs text-muted-foreground mt-1">Most popular option</p>
              </div>
              <div className="p-4 rounded-lg border bg-card">
                <p className="text-sm text-muted-foreground mb-1">15-Year Fixed</p>
                <p className="text-3xl font-bold">{rates.rate15Year.toFixed(2)}%</p>
                <p className="text-xs text-muted-foreground mt-1">Lower rate, higher payment</p>
              </div>
              {rates.rate5YearArm && (
                <div className="p-4 rounded-lg border bg-card">
                  <p className="text-sm text-muted-foreground mb-1">5/1 ARM</p>
                  <p className="text-3xl font-bold">{rates.rate5YearArm.toFixed(2)}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Adjustable after 5 years</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">
              Configure VITE_FRED_API_KEY environment variable to fetch live rates.
            </p>
          )}
          {rates && (
            <p className="text-xs text-muted-foreground mt-4">
              Data as of {rates.asOf} | Last updated: {new Date(rates.lastUpdated).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Rate History Chart */}
      <Card>
        <CardHeader>
          <CardTitle>12-Month Rate Trend</CardTitle>
          <CardDescription>
            Historical mortgage rate movement
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rateHistoryLoading ? (
            <Skeleton className="h-[250px]" />
          ) : rateHistoryError ? (
            <p className="text-muted-foreground text-center py-8">
              Unable to load rate history. Check API configuration.
            </p>
          ) : chartData.length > 0 ? (
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    className="text-xs"
                    tick={{ fontSize: 11 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `${v}%`}
                    domain={['dataMin - 0.5', 'dataMax + 0.5']}
                  />
                  <Tooltip
                    formatter={(value: number | undefined) => value !== undefined ? [`${value.toFixed(2)}%`, ''] : ['', '']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="30-Year"
                    stroke="hsl(var(--chart-1))"
                    fill="hsl(var(--chart-1))"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="15-Year"
                    stroke="hsl(var(--chart-2))"
                    fill="hsl(var(--chart-2))"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No rate history data available.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Home Price Index */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Home className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Texas Home Prices</CardTitle>
            </div>
            {hpi?.texas && (
              <Badge variant={hpi.texas.source === 'fhfa' ? 'default' : 'secondary'}>
                {hpi.texas.source === 'fhfa' ? 'FHFA Data' : 'Fallback'}
              </Badge>
            )}
          </div>
          <CardDescription>
            FHFA House Price Index for Texas and major metros
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hpiLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          ) : hpi ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-4">
                {hpi.texas && (
                  <div className="p-4 rounded-lg border bg-primary/5">
                    <p className="text-sm text-muted-foreground mb-1">Texas (Statewide)</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold">{hpi.texas.current.toFixed(1)}</p>
                      <span className={`text-sm flex items-center gap-1 ${hpi.texas.yearOverYearChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {hpi.texas.yearOverYearChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        {hpi.texas.yearOverYearChange >= 0 ? '+' : ''}{hpi.texas.yearOverYearChange.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Year-over-year change</p>
                  </div>
                )}
                {hpi.national && (
                  <div className="p-4 rounded-lg border">
                    <p className="text-sm text-muted-foreground mb-1">National</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold">{hpi.national.current.toFixed(1)}</p>
                      <span className={`text-sm flex items-center gap-1 ${hpi.national.yearOverYearChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {hpi.national.yearOverYearChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        {hpi.national.yearOverYearChange >= 0 ? '+' : ''}{hpi.national.yearOverYearChange.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Year-over-year change</p>
                  </div>
                )}
              </div>

              {/* Metro Areas */}
              {hpi.metro && Object.keys(hpi.metro).length > 0 && (
                <>
                  <p className="text-sm font-medium mb-3">Texas Metro Areas</p>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    {hpi.metro.houston && (
                      <div className="p-3 rounded-lg border">
                        <p className="text-sm text-muted-foreground">Houston</p>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-semibold">{hpi.metro.houston.current.toFixed(1)}</p>
                          <span className={`text-xs ${hpi.metro.houston.yearOverYearChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {hpi.metro.houston.yearOverYearChange >= 0 ? '+' : ''}{hpi.metro.houston.yearOverYearChange.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    )}
                    {hpi.metro.dallas && (
                      <div className="p-3 rounded-lg border">
                        <p className="text-sm text-muted-foreground">Dallas-Fort Worth</p>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-semibold">{hpi.metro.dallas.current.toFixed(1)}</p>
                          <span className={`text-xs ${hpi.metro.dallas.yearOverYearChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {hpi.metro.dallas.yearOverYearChange >= 0 ? '+' : ''}{hpi.metro.dallas.yearOverYearChange.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    )}
                    {hpi.metro.austin && (
                      <div className="p-3 rounded-lg border">
                        <p className="text-sm text-muted-foreground">Austin</p>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-semibold">{hpi.metro.austin.current.toFixed(1)}</p>
                          <span className={`text-xs ${hpi.metro.austin.yearOverYearChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {hpi.metro.austin.yearOverYearChange >= 0 ? '+' : ''}{hpi.metro.austin.yearOverYearChange.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    )}
                    {hpi.metro.sanAntonio && (
                      <div className="p-3 rounded-lg border">
                        <p className="text-sm text-muted-foreground">San Antonio</p>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-semibold">{hpi.metro.sanAntonio.current.toFixed(1)}</p>
                          <span className={`text-xs ${hpi.metro.sanAntonio.yearOverYearChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {hpi.metro.sanAntonio.yearOverYearChange >= 0 ? '+' : ''}{hpi.metro.sanAntonio.yearOverYearChange.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">
              Configure VITE_FRED_API_KEY to fetch home price index data.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Economic Indicators */}
      <Card>
        <CardHeader>
          <CardTitle>Economic Indicators</CardTitle>
          <CardDescription>
            Key metrics that influence mortgage rates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {indicatorsLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          ) : indicators ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground">Federal Funds Rate</p>
                <p className="text-2xl font-bold">{indicators.fedFundsRate.current.toFixed(2)}%</p>
                <p className="text-xs text-muted-foreground">
                  Target: {indicators.fedFundsRate.target.lower}-{indicators.fedFundsRate.target.upper}%
                </p>
              </div>
              <div className="p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground">10-Year Treasury</p>
                <p className="text-2xl font-bold">{indicators.treasury10Year.toFixed(2)}%</p>
                <p className="text-xs text-muted-foreground">Key rate benchmark</p>
              </div>
              <div className="p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground">Inflation (CPI)</p>
                <p className="text-2xl font-bold">{indicators.inflation.cpiAllItems.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">
                  Core: {indicators.inflation.cpiCore.toFixed(1)}%
                </p>
              </div>
              <div className="p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground">Unemployment Rate</p>
                <p className="text-2xl font-bold">{indicators.unemployment.rate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">
                  As of {indicators.unemployment.asOf}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">
              Configure VITE_FRED_API_KEY to fetch economic indicators.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Market News */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Market News</CardTitle>
            </div>
            {news && news.sources.length > 0 && (
              <Badge variant="outline">
                {news.sources.length} sources
              </Badge>
            )}
          </div>
          <CardDescription>
            Latest mortgage and housing market news
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Category filter tabs */}
          {news && news.items.length > 0 && (
            <div className="flex gap-2 mb-4 flex-wrap">
              {(['all', 'rates', 'fed', 'market', 'general'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setNewsCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    newsCategory === cat
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {cat === 'all' ? 'All' : cat === 'fed' ? 'Fed' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  {categoryCount[cat] > 0 && (
                    <span className="ml-1 opacity-70">({categoryCount[cat]})</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {newsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          ) : filteredNews.length > 0 ? (
            <div className="space-y-4">
              {filteredNews.slice(0, 10).map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedNewsItem(item)}
                  className="block p-4 rounded-lg border hover:border-primary/50 hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs shrink-0">
                          {item.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {item.source}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          • {formatNewsDate(item.pubDate)}
                        </span>
                      </div>
                      <p className="font-medium text-sm line-clamp-2">{item.title}</p>
                      {item.summary && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {item.summary}
                        </p>
                      )}
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                </div>
              ))}
              {filteredNews.length > 10 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  Showing 10 of {filteredNews.length} articles
                </p>
              )}
            </div>
          ) : news && news.items.length > 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No articles in this category.
            </p>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No news articles available. News feeds will be fetched automatically when a CORS proxy is configured.
            </p>
          )}
        </CardContent>
      </Card>

      {/* News Article Dialog */}
      <Dialog open={!!selectedNewsItem} onOpenChange={(open) => !open && setSelectedNewsItem(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedNewsItem && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">
                    {selectedNewsItem.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {selectedNewsItem.source}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    • {formatNewsDate(selectedNewsItem.pubDate)}
                  </span>
                </div>
                <DialogTitle className="text-lg leading-tight">
                  {selectedNewsItem.title}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Article from {selectedNewsItem.source}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {selectedNewsItem.fullDescription || selectedNewsItem.summary}
                </p>
                <div className="pt-4 border-t">
                  <a
                    href={selectedNewsItem.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    Read full article at {selectedNewsItem.source}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function App() {
  const [activeSection, setActiveSection] = useState('dashboard')

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />
      case 'income':
        return <IncomeSection />
      case 'property':
        return <PropertySection />
      case 'savings':
        return <SavingsTracker />
      case 'scenarios':
        return <ScenarioComparison />
      case 'amortization':
        return <AmortizationPage />
      case 'analysis':
        return <AnalysisPage />
      case 'market':
        return <MarketPage />
      case 'settings':
        return <SettingsPage />
      default:
        return <Dashboard />
    }
  }

  return (
    <ThemeProvider defaultTheme="system">
      <TooltipProvider>
        <MarketDataProvider>
          <CalculatorProvider>
            <AppShell
              activeSection={activeSection}
              onSectionChange={setActiveSection}
            >
              {renderSection()}
            </AppShell>
          </CalculatorProvider>
        </MarketDataProvider>
      </TooltipProvider>
    </ThemeProvider>
  )
}
