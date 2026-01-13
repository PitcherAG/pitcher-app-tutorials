import { useQuery } from '@tanstack/react-query'
import { usePitcher } from '@/components/providers/PitcherProvider'
import type { SfSalesProductSummary, SalesProductSummary } from '@/lib/types'
import {
  buildSalesQuery,
  transformSalesRecords,
  aggregateByTherapeuticArea,
  aggregateByParentProduct,
  getSalesChartData,
  calculateTotals,
} from '@/lib/services/salesService'

interface UseSalesDataOptions {
  accountId: string | null
  userId?: string
  enabled?: boolean
}

export function useSalesData({ accountId, userId, enabled = true }: UseSalesDataOptions) {
  const { crmQuery } = usePitcher()

  return useQuery({
    queryKey: ['sales-data', accountId, userId],
    queryFn: async (): Promise<SalesProductSummary[]> => {
      if (!accountId) {
        throw new Error('Account ID is required')
      }

      const query = buildSalesQuery(accountId, userId)
      console.log('[useSalesData] Executing CRM query:', query)

      const sfRecords = await crmQuery<SfSalesProductSummary>(query)
      console.log('[useSalesData] CRM query returned', sfRecords.length, 'records')

      return transformSalesRecords(sfRecords)
    },
    enabled: enabled && !!accountId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useSalesSummary(accountId: string | null) {
  const salesQuery = useSalesData({ accountId })

  const totals = salesQuery.data ? calculateTotals(salesQuery.data) : null
  const byTherapeuticArea = salesQuery.data ? aggregateByTherapeuticArea(salesQuery.data) : []
  const byProduct = salesQuery.data ? aggregateByParentProduct(salesQuery.data) : []
  const chartData = salesQuery.data ? getSalesChartData(salesQuery.data) : null
  const currency = salesQuery.data?.[0]?.currency || 'USD'

  return {
    ...salesQuery,
    totals,
    byTherapeuticArea,
    byProduct,
    chartData,
    currency,
  }
}
