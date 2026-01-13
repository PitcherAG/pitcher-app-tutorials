import { useTranslation } from 'react-i18next'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatCurrency, formatPercent, getCurrencySymbol } from '@/lib/services/salesService'

interface SalesCounterProps {
  ytdAmount: number
  lytdAmount: number
  yoyChange: number
  currency?: string
  isLoading?: boolean
}

export function SalesCounter({
  ytdAmount,
  lytdAmount,
  yoyChange,
  currency = 'USD',
  isLoading = false,
}: SalesCounterProps) {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <div className="card animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
        <div className="h-8 bg-gray-200 rounded w-32 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-20" />
      </div>
    )
  }

  const trend = yoyChange > 0 ? 'up' : yoyChange < 0 ? 'down' : 'neutral'
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-danger' : 'text-gray-500'

  return (
    <div className="card">
      <div className="text-sm text-gray-500 mb-1">{t('counter.ytdSales')}</div>
      <div className="text-3xl font-bold text-gray-900 mb-2">
        {formatCurrency(ytdAmount, currency)}
      </div>
      <div className={`flex items-center gap-1.5 text-sm ${trendColor}`}>
        <TrendIcon className="w-4 h-4" />
        <span className="font-semibold">{formatPercent(yoyChange)}</span>
        <span className="text-gray-500">{t('counter.fromLastYear')}</span>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">{t('lytd')}</span>
          <span className="text-gray-700">{formatCurrency(lytdAmount, currency)}</span>
        </div>
      </div>
    </div>
  )
}

interface SalesCounterGridProps {
  totals: {
    ytdAmount: number
    lytdAmount: number
    yoyAmountChange: number
    ytdQuantity: number
    lytdQuantity: number
    yoyQuantityChange: number
  } | null
  currency?: string
  isLoading?: boolean
}

export function SalesCounterGrid({ totals, currency = 'USD', isLoading = false }: SalesCounterGridProps) {
  const { t } = useTranslation()

  if (isLoading || !totals) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SalesCounter ytdAmount={0} lytdAmount={0} yoyChange={0} isLoading />
        <SalesCounter ytdAmount={0} lytdAmount={0} yoyChange={0} isLoading />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="card">
        <div className="text-sm text-gray-500 mb-1">{t('counter.ytdSales')} ({getCurrencySymbol(currency)})</div>
        <div className="text-3xl font-bold text-gray-900 mb-2">
          {formatCurrency(totals.ytdAmount, currency)}
        </div>
        <TrendBadge value={totals.yoyAmountChange} label={t('counter.fromLastYear')} />
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{t('lytd')}</span>
            <span className="text-gray-700">{formatCurrency(totals.lytdAmount, currency)}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="text-sm text-gray-500 mb-1">{t('counter.yoyGrowth')}</div>
        <div className={`text-3xl font-bold mb-2 ${totals.yoyAmountChange >= 0 ? 'text-success' : 'text-danger'}`}>
          {formatPercent(totals.yoyAmountChange)}
        </div>
        <div className="text-sm text-gray-500">
          {t('counter.fromLastYear')}
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Quantity Change</span>
            <span className={totals.yoyQuantityChange >= 0 ? 'text-success' : 'text-danger'}>
              {formatPercent(totals.yoyQuantityChange)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function TrendBadge({ value, label }: { value: number; label: string }) {
  const trend = value > 0 ? 'up' : value < 0 ? 'down' : 'neutral'
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-danger' : 'text-gray-500'

  return (
    <div className={`flex items-center gap-1.5 text-sm ${trendColor}`}>
      <TrendIcon className="w-4 h-4" />
      <span className="font-semibold">{formatPercent(value)}</span>
      <span className="text-gray-500">{label}</span>
    </div>
  )
}
