import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: {
    translation: {
      // Dashboard
      'dashboard.title': 'Sales Dashboard',
      'dashboard.loading': 'Loading sales data...',
      'dashboard.noAccount': 'No account selected',
      'dashboard.error': 'Failed to load sales data',

      // Counter labels
      'counter.ytdSales': 'YTD Sales',
      'counter.yoyGrowth': 'YoY Growth',
      'counter.fromLastYear': 'from last year',

      // Chart labels
      'chart.title': 'Monthly Sales',
      'chart.currentYear': 'Current Year',
      'chart.lastYear': 'Last Year',
      'chart.viewCurrency': 'Currency',
      'chart.viewQuantity': 'Quantity',

      // Table labels
      'table.title': 'Sales by Product',
      'table.product': 'Product',
      'table.ytd': 'YTD',
      'table.lytd': 'LYTD',
      'table.ly': 'LY',
      'table.yoyChange': 'YoY %',
      'table.total': 'Total',
      'table.noData': 'No sales data available',
      'table.showing': 'Showing',
      'table.of': 'of',

      // Modal
      'modal.monthlyBreakdown': 'Monthly Breakdown',
      'modal.close': 'Close',

      // General
      'year': 'Year',
      'ytd': 'YTD',
      'lytd': 'LYTD',
      'total': 'Total',
      'other': 'Other',
    },
  },
}

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
