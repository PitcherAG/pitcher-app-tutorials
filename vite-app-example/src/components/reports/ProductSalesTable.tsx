import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { X, ChevronUp, ChevronDown, Minus, ChevronLeft, ChevronRight } from 'lucide-react'
import type { AggregatedSalesRecord, SalesProductSummary } from '@/lib/types'
import { formatCurrency, formatPercent, getCurrencySymbol } from '@/lib/services/salesService'

const PAGE_SIZE = 10

interface ProductSalesTableProps {
  data: AggregatedSalesRecord[]
  currency?: string
  isLoading?: boolean
}

export function ProductSalesTable({ data, currency = 'USD', isLoading = false }: ProductSalesTableProps) {
  const { t } = useTranslation()
  const [selectedProduct, setSelectedProduct] = useState<AggregatedSalesRecord | null>(null)
  const [sortField, setSortField] = useState<'label' | 'ytd_amount' | 'yoy_change'>('ytd_amount')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)

  // Calculate totals - must be before early returns to maintain hook order
  const totals = useMemo(() => {
    return data.reduce(
      (acc, item) => ({
        ytd_amount: acc.ytd_amount + item.ytd_amount,
        lytd_amount: acc.lytd_amount + item.lytd_amount,
      }),
      { ytd_amount: 0, lytd_amount: 0 }
    )
  }, [data])

  const totalYoyChange = totals.lytd_amount > 0
    ? ((totals.ytd_amount - totals.lytd_amount) / totals.lytd_amount) * 100
    : 0

  // Sort data - must be before early returns to maintain hook order
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const multiplier = sortDirection === 'asc' ? 1 : -1
      if (sortField === 'label') {
        return a.label.localeCompare(b.label) * multiplier
      }
      return ((a[sortField] || 0) - (b[sortField] || 0)) * multiplier
    })
  }, [data, sortField, sortDirection])

  // Pagination - must be before early returns to maintain hook order
  const totalPages = Math.ceil(sortedData.length / PAGE_SIZE)
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return sortedData.slice(start, start + PAGE_SIZE)
  }, [sortedData, currentPage])

  if (isLoading) {
    return (
      <div className="card">
        <div className="h-6 bg-gray-200 rounded w-40 mb-4 animate-pulse" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('table.title')}</h3>
        <div className="py-8 text-center text-gray-500">{t('table.noData')}</div>
      </div>
    )
  }

  const handleSort = (field: 'label' | 'ytd_amount' | 'yoy_change') => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
    setCurrentPage(1) // Reset to first page on sort
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 inline ml-1" />
    )
  }

  const currencySymbol = getCurrencySymbol(currency)

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('table.title')}</h3>

      <div className="overflow-x-auto">
        <table className="data-table w-full">
          <colgroup>
            <col className="w-[40%]" />
            <col className="w-[20%]" />
            <col className="w-[20%]" />
            <col className="w-[20%]" />
          </colgroup>
          <thead>
            {/* Totals row */}
            <tr className="bg-gray-100">
              <th className="text-left font-bold">{t('table.total')}</th>
              <th className="text-right font-bold">{formatCurrency(totals.ytd_amount, currency)}</th>
              <th className="text-right font-bold">{formatCurrency(totals.lytd_amount, currency)}</th>
              <th className="text-right">
                <YoYBadge value={totalYoyChange} />
              </th>
            </tr>
            {/* Header row */}
            <tr>
              <th
                className="text-left cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('label')}
              >
                {t('table.product')}
                <SortIcon field="label" />
              </th>
              <th
                className="text-right cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('ytd_amount')}
              >
                {t('table.ytd')} ({currencySymbol})
                <SortIcon field="ytd_amount" />
              </th>
              <th className="text-right">
                {t('table.lytd')} ({currencySymbol})
              </th>
              <th
                className="text-right cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('yoy_change')}
              >
                {t('table.yoyChange')}
                <SortIcon field="yoy_change" />
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map(item => (
              <tr
                key={item.key}
                className="cursor-pointer hover:bg-blue-50"
                onClick={() => setSelectedProduct(item)}
              >
                <td className="text-left font-medium text-primary">{item.label}</td>
                <td className="text-right">{formatCurrency(item.ytd_amount, currency)}</td>
                <td className="text-right text-gray-500">{formatCurrency(item.lytd_amount, currency)}</td>
                <td className="text-right">
                  <YoYBadge value={item.yoy_change} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <span className="text-sm text-gray-500">
            {t('table.showing')} {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, sortedData.length)} {t('table.of')} {sortedData.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-700 px-2">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          currency={currency}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  )
}

function YoYBadge({ value }: { value: number }) {
  const isPositive = value > 0
  const isNegative = value < 0
  const Icon = isPositive ? ChevronUp : isNegative ? ChevronDown : Minus
  const colorClass = isPositive ? 'text-success' : isNegative ? 'text-danger' : 'text-gray-500'

  return (
    <span className={`inline-flex items-center ${colorClass}`}>
      <Icon className="w-4 h-4" />
      {formatPercent(value)}
    </span>
  )
}

interface ProductDetailModalProps {
  product: AggregatedSalesRecord
  currency: string
  onClose: () => void
}

function ProductDetailModal({ product, currency, onClose }: ProductDetailModalProps) {
  const { t } = useTranslation()
  const currentYear = new Date().getFullYear()
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  // Get monthly breakdown from records
  const monthlyData = product.records.length > 0
    ? getMonthlyBreakdown(product.records)
    : null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {product.label} - {t('modal.monthlyBreakdown')}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 overflow-auto max-h-[70vh]">
          {monthlyData ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('year')}</th>
                  {months.map(month => (
                    <th key={month} className="text-right">{month}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-medium">{currentYear}</td>
                  {monthlyData.cy.map((val, i) => (
                    <td key={i} className="text-right">{formatCurrency(val, currency)}</td>
                  ))}
                </tr>
                <tr className="bg-gray-50">
                  <td className="font-medium">{currentYear - 1}</td>
                  {monthlyData.ly.map((val, i) => (
                    <td key={i} className="text-right text-gray-600">{formatCurrency(val, currency)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="font-medium">{currentYear - 2}</td>
                  {monthlyData.ly2.map((val, i) => (
                    <td key={i} className="text-right text-gray-500">{formatCurrency(val, currency)}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          ) : (
            <div className="py-8 text-center text-gray-500">
              No monthly data available
            </div>
          )}

          {/* Individual product records */}
          {product.records.length > 1 && (
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Products in this group</h4>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th className="text-right">{t('table.ytd')}</th>
                    <th className="text-right">{t('table.lytd')}</th>
                    <th className="text-right">{t('table.yoyChange')}</th>
                  </tr>
                </thead>
                <tbody>
                  {product.records.map(record => {
                    const yoy = record.lytd_amount > 0
                      ? ((record.ytd_amount - record.lytd_amount) / record.lytd_amount) * 100
                      : 0
                    return (
                      <tr key={record.id}>
                        <td>{record.product_name}</td>
                        <td className="text-right">{formatCurrency(record.ytd_amount, currency)}</td>
                        <td className="text-right text-gray-500">{formatCurrency(record.lytd_amount, currency)}</td>
                        <td className="text-right"><YoYBadge value={yoy} /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-end p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
          >
            {t('modal.close')}
          </button>
        </div>
      </div>
    </div>
  )
}

function getMonthlyBreakdown(records: SalesProductSummary[]) {
  // Aggregate monthly values across all records
  const cy = new Array(12).fill(0)
  const ly = new Array(12).fill(0)
  const ly2 = new Array(12).fill(0)

  records.forEach(record => {
    record.monthly_amounts.cy.forEach((val, i) => { cy[i] += val })
    record.monthly_amounts.ly.forEach((val, i) => { ly[i] += val })
    record.monthly_amounts.ly2.forEach((val, i) => { ly2[i] += val })
  })

  return { cy, ly, ly2 }
}
