import { useTranslation } from 'react-i18next'
import { PitcherProvider, usePitcher } from '@/components/providers/PitcherProvider'
import { useSalesSummary } from '@/lib/hooks/useSalesData'
import { useIframeHeight } from '@/lib/hooks/useIframeHeight'
import { SalesCounterGrid } from '@/components/reports/SalesCounter'
import { SalesChart } from '@/components/reports/SalesChart'
import { ProductSalesTable } from '@/components/reports/ProductSalesTable'

function Dashboard() {
  const { t } = useTranslation()
  const { accountId, isLoading: isPitcherLoading, env } = usePitcher()

  // Dynamically update iframe height to match content
  useIframeHeight({ enabled: !!env })

  const {
    isLoading: isSalesLoading,
    isError,
    error,
    totals,
    byProduct,
    chartData,
    currency,
  } = useSalesSummary(accountId)

  const isLoading = isPitcherLoading || isSalesLoading

  // No account selected
  if (!accountId && !isPitcherLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">{t('dashboard.noAccount')}</h2>
          <p className="text-gray-500">Please select an account to view sales data</p>
        </div>
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-red-600 mb-2">{t('dashboard.error')}</h2>
          <p className="text-gray-500">{error?.message || 'An unexpected error occurred'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>
        </div>

        {/* Counters */}
        <SalesCounterGrid totals={totals} currency={currency} isLoading={isLoading} />

        {/* Chart */}
        <SalesChart data={chartData} currency={currency} isLoading={isLoading} />

        {/* Product Table */}
        <ProductSalesTable data={byProduct} currency={currency} isLoading={isLoading} />
      </div>
    </div>
  )
}

function App() {
  return (
    <PitcherProvider>
      <Dashboard />
    </PitcherProvider>
  )
}

export default App
