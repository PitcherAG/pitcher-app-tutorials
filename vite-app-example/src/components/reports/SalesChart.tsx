import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  BarController,
  LineController,
  Title,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import { Chart } from 'react-chartjs-2'
import type { SalesChartData } from '@/lib/types'
import { formatCurrency, getCurrencySymbol } from '@/lib/services/salesService'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  BarController,
  LineController,
  Title,
  Tooltip,
  Legend
)

interface SalesChartProps {
  data: SalesChartData | null
  currency?: string
  isLoading?: boolean
  onViewChange?: (view: 'currency' | 'quantity') => void
}

export function SalesChart({ data, currency = 'USD', isLoading = false, onViewChange }: SalesChartProps) {
  const { t } = useTranslation()
  const [view, setView] = useState<'currency' | 'quantity'>('currency')

  const handleViewChange = (newView: 'currency' | 'quantity') => {
    setView(newView)
    onViewChange?.(newView)
  }

  if (isLoading) {
    return (
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
          <div className="h-8 bg-gray-200 rounded w-40 animate-pulse" />
        </div>
        <div className="h-64 bg-gray-100 rounded animate-pulse" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="card">
        <div className="h-64 flex items-center justify-center text-gray-500">
          No chart data available
        </div>
      </div>
    )
  }

  const chartData: ChartData<'bar' | 'line', number[], string> = {
    labels: data.labels,
    datasets: [
      {
        type: 'bar',
        label: t('chart.currentYear'),
        data: data.currentYear,
        backgroundColor: '#34A2EB',
        borderRadius: 4,
        order: 2,
      },
      {
        type: 'line',
        label: t('chart.lastYear'),
        data: data.lastYear,
        borderColor: '#F4A321',
        backgroundColor: '#F4A321',
        borderWidth: 2,
        borderDash: [5, 5],
        tension: 0,
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: false,
        order: 1,
      },
    ],
  }

  const chartOptions: ChartOptions<'bar' | 'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const value = context.parsed.y ?? 0
            const label = context.dataset.label || ''
            return `${label}: ${view === 'currency' ? formatCurrency(value, currency) : value.toLocaleString()}`
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            if (typeof value === 'number') {
              return view === 'currency' ? `${getCurrencySymbol(currency)}${(value / 1000).toFixed(0)}K` : value.toLocaleString()
            }
            return value
          },
        },
      },
    },
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{t('chart.title')}</h3>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => handleViewChange('currency')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              view === 'currency'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t('chart.viewCurrency')}
          </button>
          <button
            onClick={() => handleViewChange('quantity')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              view === 'quantity'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t('chart.viewQuantity')}
          </button>
        </div>
      </div>
      <div className="h-64">
        <Chart type="bar" data={chartData} options={chartOptions} />
      </div>
    </div>
  )
}
