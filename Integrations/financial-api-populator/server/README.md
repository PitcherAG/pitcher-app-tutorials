# Real-time Financial Data API

Express server that provides authenticated access to real-time financial data via Finnhub API.

## Features

- **Dual Authentication Support**:
  - **SharedLink JWT**: Validates JWT tokens from DSR shared_link_auth cookie by calling Pitcher validation endpoint (for shared link access)
  - **Bearer JWT**: Validates bearer tokens against Pitcher API (for admin/rep usage)
- **Smart Caching**:
  - Financial data: 20-minute cache
  - JWT validation: Cached until token expiry (based on `exp` claim)
- **Security Hardening**: CORS restrictions, rate limiting (60 req/min), input validation
- **Organization Support**: Extracts organization from host/headers or defaults to 'dev'

## Local Development

### Prerequisites
- Node.js 18+
- Finnhub API key (get free key at https://finnhub.io/register)

### Setup

```bash
# Install dependencies
npm install

# Set environment variables
export FINNHUB_API_KEY=your_finnhub_api_key

# Run development server
npm run dev
```

The server will start on `http://localhost:3000`

### Testing Locally

```bash
# Health check
curl http://localhost:3000/health

# Get financial data (DSR context - using SharedLink JWT)
curl -H "Authorization: SharedLink YOUR_SHARED_LINK_JWT" \
     http://localhost:3000/api/financial-data

# Get financial data (admin/rep context - using Pitcher bearer token)
curl -H "Authorization: Bearer YOUR_PITCHER_TOKEN" \
     http://localhost:3000/api/financial-data

# Get financial data with custom tickers
curl -H "Authorization: SharedLink YOUR_SHARED_LINK_JWT" \
     "http://localhost:3000/api/financial-data?tickers=TSLA,NVDA,META"

# Get current user info (development mode only)
curl -H "Authorization: Bearer YOUR_PITCHER_TOKEN" \
     http://localhost:3000/api/me
```

## Deployment to Fly.io

### Prerequisites
- Fly.io account (https://fly.io/signup)
- Fly CLI installed (`brew install flyctl` on macOS)

### Deploy

```bash
# Login to Fly.io
fly auth login

# Launch the app (first time only)
fly launch

# Set Finnhub API key as secret
fly secrets set FINNHUB_API_KEY=your_finnhub_api_key

# Deploy
fly deploy

# Check status
fly status

# View logs
fly logs

# Open in browser
fly open
```

### Environment Variables

Set secrets using Fly CLI:
```bash
fly secrets set FINNHUB_API_KEY=your_key_here
fly secrets set NODE_ENV=production
```

## API Endpoints

### `GET /health`
Health check endpoint (no authentication required)

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-10T12:00:00.000Z"
}
```

### `GET /api/financial-data`
Get real-time financial data (authentication required)

**Headers:**
- `Authorization: SharedLink <jwt>` (for DSR shared link access) OR
- `Authorization: Bearer <pitcher_token>` (for admin/rep access)
- `X-Pitcher-Organization: <org_name>` (optional, for Bearer auth)

**Query Parameters:**
- `tickers`: Comma-separated list of stock symbols (default: AAPL,MSFT,GOOGL,AMZN, max 10, validated: 1-5 uppercase letters)

**Response:**
```json
{
  "stock_quotes": [
    {
      "symbol": "AAPL",
      "price": 178.45,
      "change": 2.34,
      "changePercent": 1.33,
      "high": 179.12,
      "low": 176.89,
      "open": 177.00,
      "previousClose": 176.11,
      "lastUpdated": "2024-01-10T12:00:00.000Z"
    }
  ],
  "market_overview": {
    "sp500": {
      "value": 4783.45,
      "change": 12.34,
      "changePercent": 0.26
    },
    "nasdaq": { ... },
    "dow": { ... },
    "lastUpdated": "2024-01-10T12:00:00.000Z"
  },
  "_metadata": {
    "fetched_at": "2024-01-10T12:00:00.000Z",
    "source": "finnhub_api",
    "tickers_count": 4,
    "cached": false,
    "auth_type": "shared_link",
    "shared_link_id": "abc123",
    "instance_id": "456",
    "organization": "dev",
    "note": "Real-time data from Finnhub (cached for 20 minutes)"
  }
}
```

**Note**: When using Bearer token auth, `_metadata` includes `requested_by` (user email) instead of `shared_link_id`.
```

### `GET /api/me`
Get current user information (development mode only, disabled in production)

**Response:**
```json
{
  "authType": "bearer",
  "organization": "dev",
  "user": {
    "type": "bearer",
    "email": "user@example.com"
  }
}
```

## Caching Strategy

- **JWT Validation**: Cached until token expiry (based on `exp` claim in JWT)
- **Financial Data**: 20 minutes
- Cache keys based on: token prefix for validation, tickers for financial data

## Security

- **Authentication**: All endpoints (except `/health`) require authentication
- **Dual Auth Support**:
  1. SharedLink JWT (from DSR shared_link_auth cookie) - validated by calling Pitcher platform
  2. Bearer JWT (for admin/rep usage) - validated against Pitcher API
- **CORS**: Restricted to `*.my.pitcher.com` domains only
- **Rate Limiting**: 60 requests per minute per user/token
- **Input Validation**: Ticker symbols validated (1-5 uppercase letters, max 10 tickers)
- **Payload Size Limit**: 10KB max request body
- **Production Hardening**: Debug endpoints disabled, generic error messages
- **Token Caching**: Smart caching based on JWT expiry for efficiency

## License

MIT




