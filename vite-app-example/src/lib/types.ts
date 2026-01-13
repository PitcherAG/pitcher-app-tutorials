// Pitcher Environment types
export interface PitcherUser {
  id: string
  first_name: string
  last_name: string
  email: string
}

export interface PitcherInstance {
  id: string
  color: string
}

export interface PitcherOrganization {
  name: string
}

export interface PitcherEnv {
  pitcher: {
    user: PitcherUser
    instance: PitcherInstance
    organization: PitcherOrganization
    access_token: string
    token_claims?: {
      'https://pitcher.com/claims/urls'?: {
        custom_domain?: string
      }
    }
  }
  client_type?: 'admin' | 'ui'
}

// Canvas data structure - flexible to accommodate various Pitcher contexts
export interface CanvasData {
  is_edit_mode?: boolean
  canvas?: {
    id: string
    context?: Record<string, unknown>
    account?: {
      id: string
      name?: string
    }
  }
  // Allow additional top-level properties for flexibility
  context?: Record<string, unknown>
  account_id?: string
  accountId?: string
  [key: string]: unknown
}

// Sales data types (mapping from Veeva ELA_Sales_Product_Summary__c)
export interface SalesProductSummary {
  id: string
  product_id: string
  product_name: string
  parent_product_id?: string
  parent_product_name?: string
  therapeutic_area?: string
  therapeutic_class?: string
  account_id: string
  currency: string
  // YTD/LYTD amounts
  ytd_amount: number
  lytd_amount: number
  ly_amount: number
  ytd_quantity: number
  lytd_quantity: number
  ly_quantity: number
  // Monthly amounts (CY = Current Year, LY = Last Year, LY2 = 2 Years Ago)
  monthly_amounts: MonthlyAmounts
}

export interface MonthlyAmounts {
  cy: number[] // 12 months current year
  ly: number[] // 12 months last year
  ly2: number[] // 12 months 2 years ago
  cy_qty: number[] // quantities
  ly_qty: number[]
  ly2_qty: number[]
}

// Aggregated records for display
export interface AggregatedSalesRecord {
  key: string
  label: string
  ytd_amount: number
  lytd_amount: number
  yoy_change: number
  records: SalesProductSummary[]
}

// Chart data structure
export interface SalesChartData {
  labels: string[]
  currentYear: number[]
  lastYear: number[]
}

// Counter data
export interface SalesCounterData {
  title: string
  value: string | number
  highlight: string
  trend: 'up' | 'down' | 'neutral'
  trendLabel?: string
}

// CRM Query result types
export interface CrmQueryResult<T = Record<string, unknown>> {
  records: T[]
  totalSize: number
  done: boolean
}

// Salesforce object for sales summary (maps to ELA_Sales_Product_Summary__c)
export interface SfSalesProductSummary {
  Id: string
  Name: string
  ELA_Product__c: string
  'ELA_Product__r.Name'?: string
  'ELA_Product__r.Parent_Product_vod__c'?: string
  'ELA_Product__r.Parent_Product_vod__r.Name'?: string
  'ELA_Product__r.Therapeutic_Area_vod__c'?: string
  'ELA_Product__r.Therapeutic_Class_vod__c'?: string
  ELA_Account__c: string
  ELA_Currency__c: string
  ELA_YTD_Amt__c: number
  ELA_LYTD_Amt__c: number
  ELA_LY_Amt__c: number
  ELA_YTD_Qty__c: number
  ELA_LYTD_Qty__c: number
  ELA_LY_Qty__c: number
  // Monthly fields (ELA_CY_M_01__c through ELA_CY_M_12__c, etc.)
  [key: string]: string | number | undefined
}
