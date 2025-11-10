# Financial Data Integration - Secure Real-Time Financial Data

**Enterprise-grade** Pitcher integration that fetches real-time financial data through a secure integration server, supporting both DSR (shared links) and Impact (rep) contexts.

## Architecture

```
┌─────────────────┐      ┌──────────────────────┐      ┌─────────────────┐
│  Pitcher App    │─────▶│  Integration Server  │─────▶│  Finnhub API    │
│  (populator.html)│      │  (Your hosting)      │      │  (Financial)    │
└─────────────────┘      └──────────────────────┘      └─────────────────┘
   ↓ SharedLink JWT           ↓ Validates with Pitcher
   ↓ or Bearer Token          │ Caches 20min
   │                          ↓ Returns Data
   └──────────────────────────┘
```

## Key Features

✅ **Dual Context Support**: Works in both DSR (client shared links) and Impact (rep usage)
✅ **Zero Database Persistence**: `no_persist: true` ensures no PII storage
✅ **Enterprise Security**: CORS restrictions, rate limiting, input validation
✅ **Token Validation**: All requests validated against Pitcher platform
✅ **Deployment Flexible**: Deploy to AWS, Azure, GCP, Fly.io, or self-hosted
✅ **No Credential Exposure**: API keys never sent to client browser

## Components

### 1. Frontend (`app/populator.html`)
- Pitcher embedded app
- Fetches financial data from backend integration server
- Uses Pitcher access token for authentication
- Populates canvas context with financial data
- API key agnostic frontend

### 2. Integration Server (`server/`)
- Express.js API server
- Validates SharedLink JWTs and Bearer tokens
- Fetches data from Finnhub API
- Caches responses for 20 minutes
- Deploy anywhere (AWS Lambda, Azure Functions, GCP, Fly.io, self-hosted)

## Security Features

✅ **Dual Authentication**: SharedLink JWT (DSR) + Bearer token (Impact)
✅ **CORS Restrictions**: Only `*.my.pitcher.com` domains allowed
✅ **Rate Limiting**: 60 requests/minute per user
✅ **Input Validation**: Ticker symbols validated (1-5 letters, max 10 tickers)
✅ **No Sensitive Logging**: API key status never exposed
✅ **Production Hardening**: Debug endpoints disabled in production

See [SECURITY.md](SECURITY.md) for complete security documentation.  

## Quick Start

### 1. Deploy Integration Server

See [AUTH_FLOW.md](AUTH_FLOW.md) for detailed deployment options:

- **AWS Lambda**: Serverless, pay-per-request
- **Azure Functions**: Serverless with Azure ecosystem
- **Google Cloud Run**: Containerized serverless
- **Fly.io**: Simple PaaS deployment
- **Self-Hosted**: Docker on your infrastructure

Example (Fly.io):
```bash
cd server
cp .env.example .env
# Edit .env with your FINNHUB_API_KEY

fly launch
fly secrets set FINNHUB_API_KEY=your_key_here
fly deploy
```

### 2. Configure Frontend

Update `app/populator.html` line 17:
```javascript
const API_BASE_URL = "https://your-integration-server.example.com";
```

Then deploy as a Pitcher embedded app using the Pitcher CLI:
```bash
cd app
pit app publish --api-url https://yourinstance.my.pitcher.com/api/v1
```

## API Endpoints

### `GET /health`
Health check (no auth required)

### `GET /api/financial-data`
Get real-time stock data (auth required)

**Query Parameters**:
- `tickers`: Comma-separated stock symbols (default: AAPL,MSFT,GOOGL,AMZN)
- `organization`: Pitcher organization (optional)

**Headers**:
- `Authorization: SharedLink <jwt>` (DSR context)
- `Authorization: Bearer <token>` (Impact context)

**Response**:
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
    "sp500": { "value": 4783.45, "change": 12.34, "changePercent": 0.26 },
    "nasdaq": { "value": 15235.71, "change": -23.45, "changePercent": -0.15 },
    "dow": { "value": 37440.34, "change": 45.67, "changePercent": 0.12 },
    "lastUpdated": "2024-01-10T12:00:00.000Z"
  },
  "_metadata": {
    "fetched_at": "2024-01-10T12:00:00.000Z",
    "source": "finnhub_api",
    "tickers_count": 4,
    "cached": false,
    "requested_by": "user@example.com",
    "organization": "dev",
    "note": "Real-time data from Finnhub (cached for 20 minutes)"
  }
}
```

### `GET /api/me`
Get current authenticated user info (development only)

## How It Works

1. **User Opens Canvas**: Pitcher embedded app loads
2. **Get Access Token**: App retrieves `window.env.pitcher.access_token`
3. **Call Backend API**: Sends request with bearer token
4. **Validate Token**: Server validates token (cached until JWT expiry or 20min)
5. **Fetch Financial Data**: Server fetches from Finnhub (cached 20min)
6. **Return Data**: Financial data returned to frontend
7. **Populate Context**: Canvas context updated with `no_persist: true`

## Security
- ✅ Dual authentication (SharedLink JWT + Bearer token)
- ✅ Token validation via Pitcher platform
- ✅ CORS restricted to `*.my.pitcher.com`
- ✅ Rate limiting (60 req/min per user)
- ✅ Input validation on all parameters
- ✅ API keys stored server-side only
- ✅ `no_persist` flag prevents database storage
- ✅ Production hardening (no debug endpoints)

## Development

### Local Backend Testing

```bash
cd server
npm install
export FINNHUB_API_KEY=your_key_here
npm run dev
```

Server runs on `http://localhost:3000`

### Test API Locally

```bash
# Health check
curl http://localhost:3000/health

# Get financial data (need valid Pitcher token)
curl -H "Authorization: Bearer YOUR_PITCHER_TOKEN" \
     http://localhost:3000/api/financial-data

# Custom tickers
curl -H "Authorization: Bearer YOUR_PITCHER_TOKEN" \
     "http://localhost:3000/api/financial-data?tickers=TSLA,NVDA,META"
```

## Deployment Options
- Any Nodejs hosting platform (AWS ECS, Azure Functions, Google Cloud Run, Fly.io, Render.com, etc)

### Environment Variables

Required:
```bash
FINNHUB_API_KEY=your_key_here
NODE_ENV=production
```

Optional:
```bash
PORT=3000
```

## Monitoring

Implementation depends on your hosting platform:

- **AWS**: CloudWatch Logs
- **Azure**: Application Insights
- **GCP**: Cloud Logging
- **Fly.io**: `fly logs`
- **Self-hosted**: Configure your logging solution

**Finnhub API**: Free tier
- 60 API calls/minute
- Real-time US stock data
- No credit card required

## Troubleshooting

### "Authentication failed"
- Check that token is valid (SharedLink JWT or Bearer token)
- Verify organization name is correct
- Check integration server logs

### "No data available"
- Verify Finnhub API key is set correctly
- Check if market is open (US market hours)
- View integration server logs for API errors

### "Failed to fetch financial data"
- Check network connectivity
- Verify integration server is running
- Check server health: `curl https://your-integration-server.com/health`
- Verify CORS allows your Pitcher domain

## Files Structure

```
financial-api-populator/
├── app/
│   ├── populator.html          # Pitcher embedded app
│   ├── app.json               # App metadata
│   └── README.md              # App-specific docs
├── server/
│   ├── server.js              # Express integration server
│   ├── package.json           # Dependencies
│   ├── .env.example           # Environment variable template
│   └── README.md              # Server docs
├── .gitignore                 # Git ignore rules
├── SECURITY.md                # Security documentation
├── AUTH_FLOW.md               # Authentication flow diagram
└── README.md                  # This file
```
