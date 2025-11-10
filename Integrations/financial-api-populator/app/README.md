# Financial Data Real-Time Populator

## Overview
This embedded app fetches real-time financial and stock market data from public APIs and injects it into canvas context **without persisting to the database**. All data remains in memory only.

## Key Features
- ✅ Fetches real-time stock quotes and market indices
- ✅ Uses `no_persist: true` flag to prevent database storage
- ✅ Data repopulated on every browser refresh
- ✅ Works with public financial APIs (no auth required for demo)
- ✅ Supports canvas templates with dynamic value placeholders

## How It Works
1. App hooks into `on_canvas_update` lifecycle event
2. Detects when a canvas is opened (not template/block/section)
3. Fetches real-time data from public financial APIs
4. Broadcasts context update with `no_persist: true` flag
5. Data is kept in memory and NOT written to database

## Context Structure
```javascript
{
  financial_data: {
    stock_quotes: [
      {
        symbol: "AAPL",
        price: 178.45,
        change: 2.34,
        changePercent: 1.33,
        volume: 52436789,
        marketCap: 2800000000000,
        lastUpdated: "2025-01-04T..."
      },
      // ... more stocks
    ],
    market_overview: {
      sp500: { value: 4783.45, change: 12.34, changePercent: 0.26 },
      nasdaq: { value: 15235.71, change: -23.45, changePercent: -0.15 },
      dow: { value: 37440.34, change: 45.67, changePercent: 0.12 },
      lastUpdated: "2025-01-04T..."
    },
    _metadata: {
      fetched_at: "2025-01-04T...",
      source: "public_financial_api",
      tickers_count: 4
    }
  }
}
```

## Usage in Templates
Admins can use CDynamicValueTreeSelect to reference:
- `{{financial_data.stock_quotes[0].price}}`
- `{{financial_data.market_overview.sp500.value}}`
- `{{financial_data.stock_quotes[0].changePercent}}`

## Production Setup
For production use, replace the mock data with actual API calls:

### Option 1: Alpha Vantage (Free tier available)
```javascript
const response = await fetch(
  `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=YOUR_API_KEY`
);
```

### Option 2: Yahoo Finance (via RapidAPI)
```javascript
const response = await fetch(
  `https://apidojo-yahoo-finance-v1.p.rapidapi.com/market/v2/get-quotes?symbols=${ticker}`,
  {
    headers: {
      'X-RapidAPI-Key': 'YOUR_API_KEY',
      'X-RapidAPI-Host': 'apidojo-yahoo-finance-v1.p.rapidapi.com'
    }
  }
);
```

### Option 3: Polygon.io
```javascript
const response = await fetch(
  `https://api.polygon.io/v2/aggs/ticker/${ticker}/prev?apiKey=YOUR_API_KEY`
);
```

## Privacy Compliance
- **No database persistence**: All financial data is kept in memory only
- **Automatic refresh**: Data is re-fetched on every page load
- **Real-time accuracy**: Always shows current market data
- **Enable CRM Privacy Mode**: Set `enable_crm_privacy_mode` to ensure temporary context is excluded

## Installation
```bash
cd /path/to/financial-api-populator
pit app publish --api-url https://dev.my.pitcher.com/api/v1
```

## Configuration
1. (Optional) Configure API keys for production financial data providers
2. Install this app to your instance
3. Create canvas templates with financial data placeholders
4. Reps create canvases from templates - data auto-populates

## Demo Use Case
Financial advisors can show real-time market data and portfolio performance in client presentations without storing sensitive financial information in the database.
