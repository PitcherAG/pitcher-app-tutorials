import { groupBy, sumBy } from 'lodash-es'
import type { SalesProductSummary, SfSalesProductSummary, MonthlyAmounts, AggregatedSalesRecord, SalesChartData } from '@/lib/types'

const MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
const CURRENT_YEAR = new Date().getFullYear()

/**
 * Build the SOQL query for sales product summaries
 * Maps to Veeva ELA_Sales_Product_Summary__c object
 */
export function buildSalesQuery(accountId: string, userId?: string): string {
  const fields = [
    'Id',
    'Name',
    'ELA_Product__c',
    'ELA_Product__r.Name',
    'ELA_Product__r.Parent_Product_vod__c',
    'ELA_Product__r.Parent_Product_vod__r.Name',
    'ELA_Product__r.Therapeutic_Area_vod__c',
    'ELA_Product__r.Therapeutic_Class_vod__c',
    'ELA_Account__c',
    'ELA_Currency__c',
    'ELA_YTD_Amt__c',
    'ELA_LYTD_Amt__c',
    'ELA_LY_Amt__c',
    'ELA_YTD_Qty__c',
    'ELA_LYTD_Qty__c',
    'ELA_LY_Qty__c',
    // Monthly amount fields
    ...MONTHS.flatMap(m => [
      `ELA_CY_M_${m}__c`,
      `ELA_LY_M_${m}__c`,
      `ELA_LY2_M_${m}__c`,
      `ELA_CY_M_${m}_Q__c`,
      `ELA_LY_M_${m}_Q__c`,
      `ELA_LY2_M_${m}_Q__c`,
    ]),
  ]

  let whereClause = `ELA_Account__c = '${accountId}'`
  if (userId) {
    whereClause += ` AND ELA_Sales_Owner__c = '${userId}'`
  }

  return `SELECT ${fields.join(', ')} FROM ELA_Sales_Product_Summary__c WHERE ${whereClause}`
}

/**
 * Transform Salesforce records to internal format
 */
export function transformSalesRecords(sfRecords: SfSalesProductSummary[]): SalesProductSummary[] {
  return sfRecords.map(sf => {
    const monthlyAmounts: MonthlyAmounts = {
      cy: MONTHS.map(m => (sf[`ELA_CY_M_${m}__c`] as number) || 0),
      ly: MONTHS.map(m => (sf[`ELA_LY_M_${m}__c`] as number) || 0),
      ly2: MONTHS.map(m => (sf[`ELA_LY2_M_${m}__c`] as number) || 0),
      cy_qty: MONTHS.map(m => (sf[`ELA_CY_M_${m}_Q__c`] as number) || 0),
      ly_qty: MONTHS.map(m => (sf[`ELA_LY_M_${m}_Q__c`] as number) || 0),
      ly2_qty: MONTHS.map(m => (sf[`ELA_LY2_M_${m}_Q__c`] as number) || 0),
    }

    return {
      id: sf.Id,
      product_id: sf.ELA_Product__c,
      product_name: sf['ELA_Product__r.Name'] || sf.Name,
      parent_product_id: sf['ELA_Product__r.Parent_Product_vod__c'],
      parent_product_name: sf['ELA_Product__r.Parent_Product_vod__r.Name'],
      therapeutic_area: sf['ELA_Product__r.Therapeutic_Area_vod__c'],
      therapeutic_class: sf['ELA_Product__r.Therapeutic_Class_vod__c'],
      account_id: sf.ELA_Account__c,
      currency: sf.ELA_Currency__c || 'USD',
      ytd_amount: sf.ELA_YTD_Amt__c || 0,
      lytd_amount: sf.ELA_LYTD_Amt__c || 0,
      ly_amount: sf.ELA_LY_Amt__c || 0,
      ytd_quantity: sf.ELA_YTD_Qty__c || 0,
      lytd_quantity: sf.ELA_LYTD_Qty__c || 0,
      ly_quantity: sf.ELA_LY_Qty__c || 0,
      monthly_amounts: monthlyAmounts,
    }
  })
}

/**
 * Calculate Year-over-Year change percentage
 * Matches calculateChangePercentage_default from Veeva code
 */
export function calculateYoYChange(current: number, previous: number, decimals = 1): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0
  }
  const change = ((current - previous) / Math.abs(previous)) * 100
  const multiplier = Math.pow(10, decimals)
  return Math.round(change * multiplier) / multiplier
}

/**
 * Aggregate sales by therapeutic area
 * Translates salesSummaryByTherapeuticArea logic
 */
export function aggregateByTherapeuticArea(records: SalesProductSummary[]): AggregatedSalesRecord[] {
  const grouped = groupBy(records, r => r.therapeutic_area || 'Others')

  return Object.entries(grouped).map(([area, areaRecords]) => {
    const ytdAmount = sumBy(areaRecords, 'ytd_amount')
    const lytdAmount = sumBy(areaRecords, 'lytd_amount')

    return {
      key: area,
      label: area === 'IM' ? 'Internal Medicine' : area,
      ytd_amount: ytdAmount,
      lytd_amount: lytdAmount,
      yoy_change: calculateYoYChange(ytdAmount, lytdAmount),
      records: areaRecords,
    }
  }).sort((a, b) => {
    // Sort order matching Veeva THERAPEUTIC_AREAS
    const order = ['Parasiticides', 'Therapeutic', 'Dermatology', 'IM', 'Pain', 'Vaccines', 'Others']
    return order.indexOf(a.key) - order.indexOf(b.key)
  })
}

/**
 * Aggregate sales by parent product
 * Translates AccountSalesTable getSummaries logic
 */
export function aggregateByParentProduct(records: SalesProductSummary[]): AggregatedSalesRecord[] {
  // Separate parent and detail products
  const parentProducts = records.filter(r => !r.parent_product_id)
  const detailProducts = records.filter(r => r.parent_product_id)

  // Group detail products by parent
  const detailsByParent = groupBy(detailProducts, 'parent_product_id')

  // Build aggregated records
  const aggregated = parentProducts.map(parent => {
    const details = detailsByParent[parent.product_id] || []
    const allRecords = [parent, ...details]

    const ytdAmount = sumBy(allRecords, 'ytd_amount')
    const lytdAmount = sumBy(allRecords, 'lytd_amount')

    return {
      key: parent.product_id,
      label: parent.product_name,
      ytd_amount: ytdAmount,
      lytd_amount: lytdAmount,
      yoy_change: calculateYoYChange(ytdAmount, lytdAmount),
      records: allRecords,
    }
  })

  return aggregated.sort((a, b) => a.label.localeCompare(b.label))
}

/**
 * Get chart data for monthly sales
 * Translates salesAllProducts chart logic
 */
export function getSalesChartData(records: SalesProductSummary[], showQuantity = false): SalesChartData {
  const monthLabels = MONTHS.map((_, i) => {
    const date = new Date(CURRENT_YEAR, i, 1)
    return date.toLocaleDateString('en-US', { month: 'short' })
  })

  // Aggregate monthly totals
  const currentYear = MONTHS.map((_, i) =>
    sumBy(records, r => (showQuantity ? r.monthly_amounts.cy_qty[i] : r.monthly_amounts.cy[i]))
  )
  const lastYear = MONTHS.map((_, i) =>
    sumBy(records, r => (showQuantity ? r.monthly_amounts.ly_qty[i] : r.monthly_amounts.ly[i]))
  )

  return {
    labels: monthLabels,
    currentYear,
    lastYear,
  }
}

/**
 * Calculate totals for counter display
 */
export function calculateTotals(records: SalesProductSummary[]) {
  const ytdAmount = sumBy(records, 'ytd_amount')
  const lytdAmount = sumBy(records, 'lytd_amount')
  const ytdQuantity = sumBy(records, 'ytd_quantity')
  const lytdQuantity = sumBy(records, 'lytd_quantity')

  return {
    ytdAmount,
    lytdAmount,
    ytdQuantity,
    lytdQuantity,
    yoyAmountChange: calculateYoYChange(ytdAmount, lytdAmount),
    yoyQuantityChange: calculateYoYChange(ytdQuantity, lytdQuantity),
  }
}

/**
 * Format currency value
 */
export function formatCurrency(value: number, currency = 'USD', locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Format percentage
 */
export function formatPercent(value: number, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100)
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency = 'USD'): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    AUD: 'A$',
    CAD: 'C$',
    CHF: 'CHF',
    CNY: '¥',
    INR: '₹',
    BRL: 'R$',
    MXN: 'MX$',
  }
  return symbols[currency] || currency
}
