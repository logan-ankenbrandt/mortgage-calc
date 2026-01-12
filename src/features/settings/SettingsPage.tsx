import { useState, useMemo } from 'react'
import { useCalculator } from '@/hooks/useCalculator'
import { useTheme } from '@/components/layout/theme-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Download,
  Link2,
  Printer,
  Copy,
  Check,
  Moon,
  Sun,
  Monitor,
  FileSpreadsheet,
  Share2,
  RefreshCw,
} from 'lucide-react'
import {
  generateAmortizationSchedule,
  getYearlySummary,
} from '@/utils/calculations'
import {
  generateAmortizationCSV,
  generateYearlySummaryCSV,
  downloadCSV,
  generateShareableURL,
  copyToClipboard,
  printPage,
} from '@/utils/export'

export function SettingsPage() {
  const { state, dispatch } = useCalculator()
  const { theme, setTheme } = useTheme()
  const [shareURL, setShareURL] = useState('')
  const [copied, setCopied] = useState(false)
  const [exportType, setExportType] = useState<'monthly' | 'yearly'>('yearly')

  // Calculate amortization for export
  const downPayment = state.savings.current
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

  // Generate share URL
  const handleGenerateShareURL = () => {
    const url = generateShareableURL(state)
    setShareURL(url)
    setCopied(false)
  }

  // Copy URL to clipboard
  const handleCopyURL = async () => {
    if (!shareURL) return
    const success = await copyToClipboard(shareURL)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Export CSV
  const handleExportCSV = () => {
    if (!schedule) return

    const filename = `mortgage-calculator-${exportType}-${new Date().toISOString().split('T')[0]}.csv`

    if (exportType === 'monthly') {
      const csv = generateAmortizationCSV(schedule)
      downloadCSV(csv, filename)
    } else {
      const csv = generateYearlySummaryCSV(yearlySummary)
      downloadCSV(csv, filename)
    }
  }

  // Reset to defaults
  const handleResetDefaults = () => {
    if (confirm('Are you sure you want to reset all calculator inputs to default values?')) {
      dispatch({ type: 'RESET' })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings & Export</h1>
        <p className="text-muted-foreground">
          Configure preferences and export your data
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize the look and feel of the calculator
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Theme</Label>
                <p className="text-sm text-muted-foreground">
                  Select your preferred color scheme
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('light')}
                >
                  <Sun className="h-4 w-4 mr-1" />
                  Light
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('dark')}
                >
                  <Moon className="h-4 w-4 mr-1" />
                  Dark
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('system')}
                >
                  <Monitor className="h-4 w-4 mr-1" />
                  System
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Print */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Print
            </CardTitle>
            <CardDescription>
              Print a summary of your mortgage calculations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              The print layout will include your key calculation results in a printer-friendly format.
            </p>
            <Button onClick={printPage} className="w-full">
              <Printer className="h-4 w-4 mr-2" />
              Print Calculator Summary
            </Button>
          </CardContent>
        </Card>

        {/* CSV Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Export to CSV
            </CardTitle>
            <CardDescription>
              Download your amortization schedule as a spreadsheet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {schedule ? (
              <>
                <div className="flex items-center justify-between">
                  <Label>Export Type</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={exportType === 'yearly' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setExportType('yearly')}
                    >
                      Yearly Summary
                    </Button>
                    <Button
                      variant={exportType === 'monthly' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setExportType('monthly')}
                    >
                      Monthly Detail
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {exportType === 'yearly' ? (
                    <span>{yearlySummary.length} years of data</span>
                  ) : (
                    <span>{schedule.rows.length} months of data</span>
                  )}
                </div>
                <Button onClick={handleExportCSV} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download CSV
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Configure a valid loan in the Property section to export amortization data.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Share URL */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Share Calculator
            </CardTitle>
            <CardDescription>
              Generate a shareable link with your current inputs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The shareable link preserves all your inputs so others can see the same calculations.
            </p>
            <Button onClick={handleGenerateShareURL} variant="outline" className="w-full">
              <Link2 className="h-4 w-4 mr-2" />
              Generate Share Link
            </Button>

            {shareURL && (
              <div className="space-y-2">
                <Label>Shareable URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={shareURL}
                    readOnly
                    className="text-xs"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleCopyURL}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {copied && (
                  <p className="text-xs text-green-600">Copied to clipboard!</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Manage your calculator data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Reset Calculator</p>
              <p className="text-sm text-muted-foreground">
                Clear all inputs and return to default values
              </p>
            </div>
            <Button variant="destructive" onClick={handleResetDefaults}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Configuration Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Current Configuration</CardTitle>
          <CardDescription>
            Summary of your current calculator inputs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 text-sm">
            <div className="space-y-2">
              <p className="font-medium text-muted-foreground">Income</p>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Person 1</span>
                  <span>${state.income.person1.toLocaleString()}/mo</span>
                </div>
                <div className="flex justify-between">
                  <span>Person 2 Base</span>
                  <span>${state.income.person2Base.toLocaleString()}/mo</span>
                </div>
                <div className="flex justify-between">
                  <span>Person 2 Variable</span>
                  <span>${state.income.person2Variable.toLocaleString()}/mo</span>
                </div>
                <div className="flex justify-between">
                  <span>Expenses</span>
                  <span>${state.expenses.toLocaleString()}/mo</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-medium text-muted-foreground">Property</p>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Home Price</span>
                  <span>${state.property.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Interest Rate</span>
                  <span>{state.property.currentRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Loan Term</span>
                  <span>{state.property.loanTerm} years</span>
                </div>
                <div className="flex justify-between">
                  <span>Property Tax Rate</span>
                  <span>{state.property.propertyTaxRate}%</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-medium text-muted-foreground">Savings</p>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Current Savings</span>
                  <span>${state.savings.current.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Monthly Savings</span>
                  <span>${state.savings.monthly.toLocaleString()}</span>
                </div>
              </div>

              <p className="font-medium text-muted-foreground mt-4">Exemptions</p>
              <div className="flex flex-wrap gap-1">
                {state.property.exemptions.homestead && (
                  <Badge variant="secondary">Homestead</Badge>
                )}
                {state.property.exemptions.over65 && (
                  <Badge variant="secondary">Over 65</Badge>
                )}
                {state.property.exemptions.disabled && (
                  <Badge variant="secondary">Disabled</Badge>
                )}
                {state.property.exemptions.veteranDisability > 0 && (
                  <Badge variant="secondary">Veteran {state.property.exemptions.veteranDisability}%</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
