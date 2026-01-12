import { useState, useMemo } from 'react'
import { useCalculator } from '@/hooks/useCalculator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Calculator,
  Shield,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts'
import {
  calculateDTI,
  stressTestScenario,
  calculateSavingsGoal,
  estimateClosingCosts,
  type DebtObligations,
} from '@/utils/calculations'
import { formatCurrency } from '@/utils/formatters'

export function AnalysisPage() {
  const { state, computed } = useCalculator()

  // Debt obligations state (could be moved to context later)
  const [debtObligations, setDebtObligations] = useState<DebtObligations>({
    carPayments: 0,
    studentLoans: 0,
    creditCards: 0,
    otherDebt: 0,
    childSupport: 0,
  })

  // Use the early scenario for analysis
  const downPayment = computed.earlySavings
  const loanAmount = state.property.price - downPayment
  const totalMonthlyHousing = computed.scenarios.earlyCurrentRate.totalMonthlyHousing
  const grossMonthlyIncome = computed.fullIncome

  // DTI Calculation
  const dtiResult = useMemo(() => {
    return calculateDTI(grossMonthlyIncome, totalMonthlyHousing, debtObligations)
  }, [grossMonthlyIncome, totalMonthlyHousing, debtObligations])

  // Stress Test
  const stressTestResults = useMemo(() => {
    if (loanAmount <= 0) return []
    return stressTestScenario(
      loanAmount,
      state.property.currentRate,
      state.property.loanTerm,
      computed.taxResult.annualTax,
      state.property.insurance,
      state.property.utilities,
      grossMonthlyIncome,
      debtObligations,
      [0, 1, 2, 3, 4]
    )
  }, [loanAmount, state.property, computed.taxResult.annualTax, grossMonthlyIncome, debtObligations])

  // Closing Costs
  const closingCosts = useMemo(() => {
    return estimateClosingCosts(
      state.property.price,
      loanAmount,
      computed.taxResult.annualTax,
      state.property.insurance,
      state.property.currentRate
    )
  }, [state.property.price, loanAmount, computed.taxResult.annualTax, state.property.insurance, state.property.currentRate])

  // Savings Goal
  const savingsGoal = useMemo(() => {
    return calculateSavingsGoal(
      state.property.price,
      20,
      closingCosts.total,
      3,
      totalMonthlyHousing,
      state.savings.current,
      computed.monthlySavings
    )
  }, [state.property.price, closingCosts.total, totalMonthlyHousing, state.savings.current, computed.monthlySavings])

  // DTI Chart Data
  const dtiChartData = [
    {
      name: 'Front-End (Housing)',
      value: dtiResult.frontEndRatio,
      target: 28,
      max: 31,
      fill: dtiResult.frontEndRatio <= 28 ? 'hsl(var(--chart-1))' : dtiResult.frontEndRatio <= 31 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))',
    },
    {
      name: 'Back-End (Total Debt)',
      value: dtiResult.backEndRatio,
      target: 36,
      max: 43,
      fill: dtiResult.backEndRatio <= 36 ? 'hsl(var(--chart-1))' : dtiResult.backEndRatio <= 43 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))',
    },
  ]

  // Stress Test Chart Data
  const stressTestChartData = stressTestResults.map((result) => ({
    rate: `${result.rate.toFixed(1)}%`,
    monthlyPayment: result.monthlyPayment,
    totalHousing: result.totalMonthlyHousing,
    frontEnd: result.dtiResult.frontEndRatio,
    status: result.affordabilityStatus,
  }))

  // Closing Costs Breakdown
  const closingCostsData = [
    { name: 'Loan Origination', value: closingCosts.loanOrigination },
    { name: 'Appraisal', value: closingCosts.appraisal },
    { name: 'Inspection', value: closingCosts.inspection },
    { name: 'Title Insurance', value: closingCosts.titleInsurance },
    { name: 'Escrow Deposit', value: closingCosts.escrowDeposit },
    { name: 'Recording Fees', value: closingCosts.recordingFees },
    { name: 'Attorney Fees', value: closingCosts.attorneyFees },
    { name: 'Prepaid Interest', value: closingCosts.prepaidInterest },
  ]

  const handleDebtChange = (field: keyof DebtObligations, value: string) => {
    const numValue = parseFloat(value) || 0
    setDebtObligations((prev) => ({ ...prev, [field]: numValue }))
  }

  const getStatusIcon = (status: 'qualified' | 'marginal' | 'not-qualified') => {
    switch (status) {
      case 'qualified':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'marginal':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'not-qualified':
        return <XCircle className="h-5 w-5 text-red-500" />
    }
  }

  const getStatusBadge = (status: 'qualified' | 'marginal' | 'not-qualified') => {
    switch (status) {
      case 'qualified':
        return <Badge variant="success">Qualified</Badge>
      case 'marginal':
        return <Badge variant="warning">Marginal</Badge>
      case 'not-qualified':
        return <Badge variant="destructive">Not Qualified</Badge>
    }
  }

  const tooltipFormatter = (value: number | undefined) => {
    if (value === undefined) return formatCurrency(0)
    return formatCurrency(value)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financial Analysis</h1>
        <p className="text-muted-foreground">
          DTI ratios, stress testing, and qualification analysis
        </p>
      </div>

      <Tabs defaultValue="dti" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dti">DTI Analysis</TabsTrigger>
          <TabsTrigger value="stress">Stress Testing</TabsTrigger>
          <TabsTrigger value="closing">Closing Costs</TabsTrigger>
          <TabsTrigger value="savings">Savings Goal</TabsTrigger>
        </TabsList>

        {/* DTI Analysis Tab */}
        <TabsContent value="dti" className="space-y-6">
          {/* Qualification Status */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Mortgage Qualification Status
                </CardTitle>
                {getStatusBadge(dtiResult.qualificationStatus)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Front-End Ratio (Housing)</span>
                    <span className={`text-lg font-bold ${dtiResult.frontEndStatus === 'good' ? 'text-green-600' : dtiResult.frontEndStatus === 'acceptable' ? 'text-yellow-600' : 'text-red-600'}`}>
                      {dtiResult.frontEndRatio.toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    value={Math.min(dtiResult.frontEndRatio, 50)}
                    max={50}
                    className="h-3"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Target: ≤28%</span>
                    <span>Max: 31%</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Back-End Ratio (Total Debt)</span>
                    <span className={`text-lg font-bold ${dtiResult.backEndStatus === 'good' ? 'text-green-600' : dtiResult.backEndStatus === 'acceptable' ? 'text-yellow-600' : 'text-red-600'}`}>
                      {dtiResult.backEndRatio.toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    value={Math.min(dtiResult.backEndRatio, 60)}
                    max={60}
                    className="h-3"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Target: ≤36%</span>
                    <span>Max: 43%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Debt Input */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Monthly Debt Obligations</CardTitle>
                <CardDescription>
                  Enter your monthly debt payments to calculate total DTI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="carPayments">Car Payments</Label>
                    <Input
                      id="carPayments"
                      type="number"
                      value={debtObligations.carPayments || ''}
                      onChange={(e) => handleDebtChange('carPayments', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="studentLoans">Student Loans</Label>
                    <Input
                      id="studentLoans"
                      type="number"
                      value={debtObligations.studentLoans || ''}
                      onChange={(e) => handleDebtChange('studentLoans', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="creditCards">Credit Card Minimums</Label>
                    <Input
                      id="creditCards"
                      type="number"
                      value={debtObligations.creditCards || ''}
                      onChange={(e) => handleDebtChange('creditCards', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="otherDebt">Other Debt</Label>
                    <Input
                      id="otherDebt"
                      type="number"
                      value={debtObligations.otherDebt || ''}
                      onChange={(e) => handleDebtChange('otherDebt', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* DTI Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">DTI Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Gross Monthly Income</span>
                    <span className="font-medium">{formatCurrency(grossMonthlyIncome)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Housing Costs</span>
                    <span className="font-medium">{formatCurrency(totalMonthlyHousing)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Other Debt</span>
                    <span className="font-medium">
                      {formatCurrency(
                        debtObligations.carPayments +
                        debtObligations.studentLoans +
                        debtObligations.creditCards +
                        debtObligations.otherDebt +
                        debtObligations.childSupport
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Total Monthly Debt</span>
                    <span className="font-bold">{formatCurrency(dtiResult.totalMonthlyDebt)}</span>
                  </div>
                  <div className="pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Max Housing @ 28%</span>
                      <span className="font-medium">{formatCurrency(dtiResult.maxHousingPayment28)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Max Total Debt @ 36%</span>
                      <span className="font-medium">{formatCurrency(dtiResult.maxTotalDebt36)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* DTI Chart */}
          <Card>
            <CardHeader>
              <CardTitle>DTI Ratio Visualization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dtiChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" domain={[0, 50]} tickFormatter={(v) => `${v}%`} />
                    <YAxis type="category" dataKey="name" width={150} />
                    <Tooltip formatter={(v: number | undefined) => v !== undefined ? `${v.toFixed(1)}%` : '0%'} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {dtiChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stress Testing Tab */}
        <TabsContent value="stress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Interest Rate Stress Test
              </CardTitle>
              <CardDescription>
                See how your affordability changes if interest rates increase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stressTestChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="rate" />
                    <YAxis
                      yAxisId="left"
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tickFormatter={(v) => `${v}%`}
                      domain={[0, 50]}
                    />
                    <Tooltip
                      formatter={(value: number | undefined, name: string | undefined) => {
                        if (value === undefined) return '0'
                        if (name === 'Front-End DTI') return `${value.toFixed(1)}%`
                        return formatCurrency(value)
                      }}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                      }}
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="totalHousing"
                      name="Total Monthly Housing"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="frontEnd"
                      name="Front-End DTI"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Stress Test Results Table */}
          <Card>
            <CardHeader>
              <CardTitle>Scenario Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Interest Rate</th>
                      <th className="text-right p-3 font-medium">Monthly P&I</th>
                      <th className="text-right p-3 font-medium">Total Housing</th>
                      <th className="text-right p-3 font-medium">Front-End DTI</th>
                      <th className="text-right p-3 font-medium">Back-End DTI</th>
                      <th className="text-center p-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stressTestResults.map((result, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-3">
                          {result.rate.toFixed(2)}%
                          {result.rateIncrease > 0 && (
                            <span className="text-muted-foreground text-sm ml-1">
                              (+{result.rateIncrease}%)
                            </span>
                          )}
                        </td>
                        <td className="text-right p-3">{formatCurrency(result.monthlyPayment)}</td>
                        <td className="text-right p-3">{formatCurrency(result.totalMonthlyHousing)}</td>
                        <td className="text-right p-3">{result.dtiResult.frontEndRatio.toFixed(1)}%</td>
                        <td className="text-right p-3">{result.dtiResult.backEndRatio.toFixed(1)}%</td>
                        <td className="text-center p-3">
                          {getStatusIcon(result.dtiResult.qualificationStatus)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Closing Costs Tab */}
        <TabsContent value="closing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Estimated Closing Costs
              </CardTitle>
              <CardDescription>
                Based on a {formatCurrency(state.property.price)} home with {formatCurrency(loanAmount)} loan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={closingCostsData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="name" width={120} className="text-xs" />
                      <Tooltip formatter={tooltipFormatter} />
                      <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {closingCostsData.map((item) => (
                    <div key={item.name} className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">{item.name}</span>
                      <span className="font-medium">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-4">
                    <span className="font-bold">Total Closing Costs</span>
                    <span className="font-bold text-lg">{formatCurrency(closingCosts.total)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    This is an estimate. Actual closing costs may vary based on lender, location, and other factors.
                    Typical range is 2-5% of the home price.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Savings Goal Tab */}
        <TabsContent value="savings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Savings Goal Analysis</CardTitle>
              <CardDescription>
                What you need for 20% down payment, closing costs, and 3-month reserves
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Progress to Goal</span>
                      <span className="text-sm font-medium">{savingsGoal.progressPercentage.toFixed(0)}%</span>
                    </div>
                    <Progress value={savingsGoal.progressPercentage} className="h-4" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{formatCurrency(savingsGoal.currentProgress)}</span>
                      <span>{formatCurrency(savingsGoal.targetAmount)}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Down Payment (20%)</span>
                      <span className="font-medium">{formatCurrency(savingsGoal.downPaymentTarget)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Closing Costs</span>
                      <span className="font-medium">{formatCurrency(savingsGoal.closingCostsTarget)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">3-Month Reserves</span>
                      <span className="font-medium">{formatCurrency(savingsGoal.reservesTarget)}</span>
                    </div>
                    <div className="flex justify-between pt-2">
                      <span className="font-bold">Total Needed</span>
                      <span className="font-bold">{formatCurrency(savingsGoal.targetAmount)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Card className="bg-muted/50">
                    <CardContent className="pt-6">
                      <div className="text-center space-y-2">
                        <p className="text-sm text-muted-foreground">Current Savings</p>
                        <p className="text-3xl font-bold">{formatCurrency(state.savings.current)}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-muted/50">
                    <CardContent className="pt-6">
                      <div className="text-center space-y-2">
                        <p className="text-sm text-muted-foreground">Still Needed</p>
                        <p className="text-3xl font-bold text-primary">
                          {formatCurrency(savingsGoal.remainingNeeded)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {savingsGoal.monthsToGoal !== null && (
                    <Card className="bg-primary/10 border-primary/20">
                      <CardContent className="pt-6">
                        <div className="text-center space-y-2">
                          <p className="text-sm text-muted-foreground">Months to Goal</p>
                          <p className="text-3xl font-bold">
                            {savingsGoal.monthsToGoal}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            At {formatCurrency(computed.monthlySavings)}/month
                          </p>
                          {savingsGoal.targetDate && (
                            <p className="text-sm">
                              Target: {savingsGoal.targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
