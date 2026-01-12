import { useState, useMemo } from 'react'
import { useCalculator } from '@/hooks/useCalculator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Calendar,
  DollarSign,
  TrendingUp,
  PiggyBank,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
} from 'recharts'
import {
  generateAmortizationSchedule,
  getYearlySummary,
  calculatePMI,
} from '@/utils/calculations'
import { formatCurrency } from '@/utils/formatters'

export function AmortizationPage() {
  const { state, computed } = useCalculator()
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set())

  // Use the early scenario's down payment (projected savings at early purchase date)
  const downPayment = computed.earlySavings
  const loanAmount = state.property.price - downPayment

  const schedule = useMemo(() => {
    if (loanAmount <= 0) return null
    return generateAmortizationSchedule(
      loanAmount,
      state.property.currentRate,
      state.property.loanTerm
    )
  }, [loanAmount, state.property.currentRate, state.property.loanTerm])

  const yearlySummary = useMemo(() => {
    if (!schedule) return []
    return getYearlySummary(schedule)
  }, [schedule])

  // PMI calculation
  const pmiResult = useMemo(() => {
    if (!schedule) return null
    return calculatePMI(loanAmount, state.property.price, 0.5, schedule)
  }, [loanAmount, state.property.price, schedule])

  // Chart data - yearly breakdown
  const chartData = useMemo(() => {
    return yearlySummary.map((year) => ({
      year: `Year ${year.year}`,
      principal: year.totalPrincipal,
      interest: year.totalInterest,
      balance: year.endingBalance,
    }))
  }, [yearlySummary])

  // Monthly chart data (first 5 years for detail)
  const monthlyChartData = useMemo(() => {
    if (!schedule) return []
    return schedule.rows.slice(0, 60).map((row) => ({
      month: row.month,
      principal: row.principal,
      interest: row.interest,
      balance: row.balance,
    }))
  }, [schedule])

  const toggleYear = (year: number) => {
    const newExpanded = new Set(expandedYears)
    if (newExpanded.has(year)) {
      newExpanded.delete(year)
    } else {
      newExpanded.add(year)
    }
    setExpandedYears(newExpanded)
  }

  // Tooltip formatter that handles optional values
  const tooltipFormatter = (value: number | undefined) => {
    if (value === undefined) return formatCurrency(0)
    return formatCurrency(value)
  }

  if (!schedule || loanAmount <= 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Amortization Schedule</h1>
          <p className="text-muted-foreground">
            View your detailed loan payment breakdown
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center py-8">
              Configure a valid loan amount in the Property section to see your amortization schedule.
              Your projected down payment ({formatCurrency(downPayment)}) currently exceeds the home price.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const downPaymentPercent = (downPayment / state.property.price) * 100

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Amortization Schedule</h1>
        <p className="text-muted-foreground">
          Detailed breakdown of your {state.property.loanTerm}-year mortgage
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Payment</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(schedule.monthlyPayment)}</div>
            <p className="text-xs text-muted-foreground">Principal & Interest only</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Interest</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(schedule.totalInterest)}</div>
            <p className="text-xs text-muted-foreground">
              {((schedule.totalInterest / schedule.totalPrincipal) * 100).toFixed(0)}% of principal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(schedule.totalPayments)}</div>
            <p className="text-xs text-muted-foreground">
              {schedule.rows.length} payments over {state.property.loanTerm} years
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payoff Date</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {schedule.payoffDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </div>
            <p className="text-xs text-muted-foreground">
              Based on {state.property.currentRate.toFixed(2)}% rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* PMI Info */}
      {pmiResult && pmiResult.required && (
        <Card className="border-warning/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Private Mortgage Insurance (PMI)</CardTitle>
              <Badge variant="warning">Required</Badge>
            </div>
            <CardDescription>
              PMI is required because your down payment is less than 20%
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Monthly PMI</p>
                <p className="text-xl font-semibold">{formatCurrency(pmiResult.monthlyPMI)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current LTV</p>
                <p className="text-xl font-semibold">{pmiResult.ltv.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Months Until Removal</p>
                <p className="text-xl font-semibold">
                  {pmiResult.monthsUntilRemoval ?? 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total PMI Cost</p>
                <p className="text-xl font-semibold">{formatCurrency(pmiResult.totalPMICost)}</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Progress to 80% LTV</span>
                <span>{Math.max(0, 100 - pmiResult.ltv + 20).toFixed(1)}%</span>
              </div>
              <Progress value={Math.max(0, 100 - pmiResult.ltv + 20)} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loan Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Loan Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Home Price</span>
                <span className="font-medium">{formatCurrency(state.property.price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Down Payment</span>
                <span className="font-medium">
                  {formatCurrency(downPayment)} ({downPaymentPercent.toFixed(0)}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Loan Amount</span>
                <span className="font-medium">{formatCurrency(loanAmount)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Interest Rate</span>
                <span className="font-medium">{state.property.currentRate.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Loan Term</span>
                <span className="font-medium">{state.property.loanTerm} years</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Payments</span>
                <span className="font-medium">{schedule.rows.length}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Principal</span>
                <span className="font-medium">{formatCurrency(schedule.totalPrincipal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Interest</span>
                <span className="font-medium">{formatCurrency(schedule.totalInterest)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-medium">Total Cost</span>
                <span className="font-bold">{formatCurrency(schedule.totalPayments)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <Tabs defaultValue="yearly" className="space-y-4">
        <TabsList>
          <TabsTrigger value="yearly">Yearly Breakdown</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Detail (First 5 Years)</TabsTrigger>
          <TabsTrigger value="balance">Balance Over Time</TabsTrigger>
        </TabsList>

        <TabsContent value="yearly">
          <Card>
            <CardHeader>
              <CardTitle>Principal vs Interest by Year</CardTitle>
              <CardDescription>
                See how your payments shift from interest to principal over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="year" className="text-xs" />
                    <YAxis
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      className="text-xs"
                    />
                    <Tooltip
                      formatter={tooltipFormatter}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="principal" name="Principal" fill="hsl(var(--chart-1))" stackId="a" />
                    <Bar dataKey="interest" name="Interest" fill="hsl(var(--chart-2))" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Payment Breakdown</CardTitle>
              <CardDescription>
                First 60 months showing principal vs interest allocation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="month"
                      className="text-xs"
                      tickFormatter={(m) => `Mo ${m}`}
                    />
                    <YAxis
                      tickFormatter={(value) => `$${value.toFixed(0)}`}
                      className="text-xs"
                    />
                    <Tooltip
                      formatter={tooltipFormatter}
                      labelFormatter={(label) => `Month ${label}`}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="principal"
                      name="Principal"
                      stackId="1"
                      fill="hsl(var(--chart-1))"
                      stroke="hsl(var(--chart-1))"
                    />
                    <Area
                      type="monotone"
                      dataKey="interest"
                      name="Interest"
                      stackId="1"
                      fill="hsl(var(--chart-2))"
                      stroke="hsl(var(--chart-2))"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance">
          <Card>
            <CardHeader>
              <CardTitle>Remaining Balance Over Time</CardTitle>
              <CardDescription>
                Watch your loan balance decrease year by year
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="year" className="text-xs" />
                    <YAxis
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      className="text-xs"
                    />
                    <Tooltip
                      formatter={tooltipFormatter}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="balance"
                      name="Remaining Balance"
                      fill="hsl(var(--chart-3))"
                      stroke="hsl(var(--chart-3))"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Yearly Schedule Table */}
      <Card>
        <CardHeader>
          <CardTitle>Yearly Schedule</CardTitle>
          <CardDescription>
            Click on a year to see monthly details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {yearlySummary.map((year) => (
                <div key={year.year} className="border rounded-lg">
                  <button
                    onClick={() => toggleYear(year.year)}
                    className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-semibold">Year {year.year}</span>
                      <div className="flex gap-6 text-sm">
                        <span className="text-muted-foreground">
                          Principal: <span className="text-foreground">{formatCurrency(year.totalPrincipal)}</span>
                        </span>
                        <span className="text-muted-foreground">
                          Interest: <span className="text-foreground">{formatCurrency(year.totalInterest)}</span>
                        </span>
                        <span className="text-muted-foreground">
                          Balance: <span className="text-foreground">{formatCurrency(year.endingBalance)}</span>
                        </span>
                      </div>
                    </div>
                    {expandedYears.has(year.year) ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>

                  {expandedYears.has(year.year) && (
                    <div className="border-t">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-2 font-medium">Month</th>
                            <th className="text-right p-2 font-medium">Payment</th>
                            <th className="text-right p-2 font-medium">Principal</th>
                            <th className="text-right p-2 font-medium">Interest</th>
                            <th className="text-right p-2 font-medium">Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {schedule.rows
                            .filter((row) => row.year === year.year)
                            .map((row) => (
                              <tr key={row.month} className="border-t">
                                <td className="p-2">{row.month}</td>
                                <td className="text-right p-2">{formatCurrency(row.payment)}</td>
                                <td className="text-right p-2">{formatCurrency(row.principal)}</td>
                                <td className="text-right p-2">{formatCurrency(row.interest)}</td>
                                <td className="text-right p-2">{formatCurrency(row.balance)}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
