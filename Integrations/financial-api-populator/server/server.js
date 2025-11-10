const express = require('express');
const cors = require('cors');
const NodeCache = require('node-cache');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting configuration
const requestCounts = new Map();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60; // 60 requests per minute

function rateLimitMiddleware(req, res, next) {
  const identifier = req.headers.authorization || req.ip;
  const now = Date.now();

  if (!requestCounts.has(identifier)) {
    requestCounts.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  const userData = requestCounts.get(identifier);

  if (now > userData.resetTime) {
    userData.count = 1;
    userData.resetTime = now + RATE_LIMIT_WINDOW_MS;
    return next();
  }

  if (userData.count >= MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.ceil((userData.resetTime - now) / 1000)
    });
  }

  userData.count++;
  next();
}

// Clean up old rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestCounts.entries()) {
    if (now > value.resetTime) {
      requestCounts.delete(key);
    }
  }
}, 300000);

// Finnhub API Configuration
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

// Cache configuration
// Financial data cache: 20 minutes (1200 seconds) TTL
// Token validation: Cache until token expiry (based on JWT exp claim)
const cache = new NodeCache({ stdTTL: 1200, checkperiod: 300 });

/**
 * Extract Pitcher host from request headers
 * @param {object} req - Express request object
 * @returns {string} Pitcher host (e.g., 'dev.my.pitcher.com')
 */
function getPitcherHostFromRequest(req) {
  // Try to extract from Referer header first
  const referer = req.headers.referer || req.headers.referrer;
  if (referer) {
    try {
      const url = new URL(referer);
      if (url.hostname.includes('.my.pitcher.com')) {
        return url.hostname;
      }
    } catch (e) {
      // Invalid URL, continue to next attempt
    }
  }

  // Try to extract from Origin header
  const origin = req.headers.origin;
  if (origin) {
    try {
      const url = new URL(origin);
      if (url.hostname.includes('.my.pitcher.com')) {
        return url.hostname;
      }
    } catch (e) {
      // Invalid URL, continue to next attempt
    }
  }

  // Fallback to dev.my.pitcher.com
  return 'dev.my.pitcher.com';
}

// Middleware
// CORS configuration - restrict to Pitcher domains only
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow Pitcher domains
    if (origin.match(/\.my\.pitcher\.com$/)) {
      return callback(null, true);
    }

    // Reject all other origins
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' })); // Limit payload size

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Validate SharedLink JWT token by calling Pitcher platform
 * @param {string} token - JWT token from shared_link_auth cookie
 * @param {string} pitcherHost - Pitcher host (e.g., 'dev.my.pitcher.com')
 * @returns {Promise<object>} Decoded JWT payload if valid
 */
async function validateSharedLinkToken(token, pitcherHost) {
  const cacheKey = `jwt_${token.substring(0, 20)}`;

  // Check cache first
  const cachedPayload = cache.get(cacheKey);
  if (cachedPayload) {
    console.log('SharedLink JWT validation cache hit');
    return cachedPayload;
  }

  try {
    // Call Pitcher platform to validate the JWT
    const validationUrl = `https://${pitcherHost}/sharing/api/validate-sharing-jwt`;
    const response = await fetch(validationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token })
    });

    if (!response.ok) {
      throw new Error(`Validation endpoint returned ${response.status}`);
    }

    const result = await response.json();

    if (!result.valid) {
      throw new Error(result.error || 'Token validation failed');
    }

    const payload = result.payload;

    // Validate required fields
    if (!payload.shared_link_id || !payload.instance_id || !payload.org_id) {
      throw new Error('Invalid JWT payload structure');
    }

    // Calculate TTL based on token expiry (exp claim)
    let cacheTTL = 600; // Default 10 minutes
    if (payload.exp) {
      const expiryTime = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      const timeUntilExpiry = Math.floor((expiryTime - now) / 1000); // Convert to seconds

      if (timeUntilExpiry > 0) {
        cacheTTL = timeUntilExpiry;
        console.log(`Caching JWT validation for ${timeUntilExpiry}s (until token expiry)`);
      } else {
        throw new Error('Token has expired');
      }
    }

    // Cache the validated payload until token expiry
    cache.set(cacheKey, payload, cacheTTL);
    console.log('SharedLink JWT validated:', {
      shared_link_id: payload.shared_link_id,
      instance_id: payload.instance_id,
      org_name: payload.org_name
    });

    return payload;
  } catch (error) {
    console.error('SharedLink JWT validation error:', error.message);
    throw new Error('Invalid or expired shared link token');
  }
}

/**
 * Decode JWT without verification (to extract exp claim)
 * @param {string} token - JWT token
 * @returns {object|null} Decoded payload or null if invalid
 */
function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Validate bearer token against Pitcher API
 * @param {string} token - Bearer token (JWT)
 * @param {string} organization - Organization subdomain
 * @returns {Promise<object>} User object if valid
 */
async function validatePitcherToken(token, organization = 'dev') {
  const cacheKey = `bearer_${token.substring(0, 20)}`;

  // Check cache first
  const cachedUser = cache.get(cacheKey);
  if (cachedUser) {
    console.log('Bearer token validation cache hit');
    return cachedUser;
  }

  const pitcherUrl = `https://${organization}.my.pitcher.com/api/v1/users/me/`;

  try {
    const response = await fetch(pitcherUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status}`);
    }

    const user = await response.json();

    // Calculate TTL based on JWT expiry (exp claim)
    let cacheTTL = 1200; // Default 20 minutes
    const payload = decodeJWT(token);
    if (payload && payload.exp) {
      const expiryTime = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      const timeUntilExpiry = Math.floor((expiryTime - now) / 1000); // Convert to seconds

      if (timeUntilExpiry > 0) {
        cacheTTL = timeUntilExpiry;
        console.log(`Caching Bearer token validation for ${timeUntilExpiry}s (until token expiry)`);
      } else {
        throw new Error('Token has expired');
      }
    }

    // Cache the user data until token expiry
    cache.set(cacheKey, user, cacheTTL);
    console.log('Bearer token validated and cached:', user.email);

    return user;
  } catch (error) {
    console.error('Pitcher API validation error:', error.message);
    throw new Error('Invalid or expired token');
  }
}

/**
 * Authentication middleware
 * Supports two auth methods:
 * 1. "SharedLink <jwt>" - JWT from DSR shared_link_auth cookie
 * 2. "Bearer <token>" - Pitcher API access token (for admin/rep usage)
 */
async function authenticateRequest(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  // Extract Pitcher host from request headers
  const pitcherHost = getPitcherHostFromRequest(req);
  console.log(`Using Pitcher host: ${pitcherHost}`);

  try {
    // Check for SharedLink JWT (DSR context)
    if (authHeader.startsWith('SharedLink ')) {
      const token = authHeader.substring(11); // Remove 'SharedLink ' prefix
      const payload = await validateSharedLinkToken(token, pitcherHost);

      req.authType = 'shared_link';
      req.sharedLinkPayload = payload;
      req.organization = payload.org_name;
      req.user = {
        type: 'shared_link',
        shared_link_id: payload.shared_link_id,
        instance_id: payload.instance_id,
        org_id: payload.org_id
      };

      console.log('Request authenticated via SharedLink JWT');
      return next();
    }

    // Check for Bearer token (Pitcher API token)
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Extract organization subdomain from Pitcher host
      const organization = pitcherHost.split('.')[0];

      const user = await validatePitcherToken(token, organization);

      req.authType = 'bearer';
      req.user = user;
      req.organization = organization;

      console.log('Request authenticated via Bearer token');
      return next();
    }

    return res.status(401).json({ error: 'Invalid Authorization header format. Use "SharedLink <jwt>" or "Bearer <token>"' });
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }
}

/**
 * Fetch financial data from Finnhub
 */
async function fetchFinancialData(tickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN']) {
  // Check cache first
  const cacheKey = `financial_data_${tickers.join('_')}`;
  const cachedData = cache.get(cacheKey);
  
  if (cachedData) {
    console.log('Financial data cache hit');
    return cachedData;
  }

  console.log('Fetching fresh financial data from Finnhub...');

  // Market index symbols
  const indexSymbols = {
    sp500: '^GSPC',
    nasdaq: '^IXIC',
    dow: '^DJI'
  };

  try {
    // Fetch all stock quotes in parallel
    const [stockQuotes, marketOverview] = await Promise.all([
      // Fetch stock quotes
      Promise.all(
        tickers.map(async (ticker) => {
          try {
            const response = await fetch(
              `${FINNHUB_BASE_URL}/quote?symbol=${ticker}&token=${FINNHUB_API_KEY}`
            );
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Check if we got valid data
            if (data.c === 0 && data.h === 0 && data.l === 0) {
              console.warn(`No data available for ${ticker}`);
              return null;
            }

            return {
              symbol: ticker,
              price: data.c,
              change: data.d,
              changePercent: data.dp,
              high: data.h,
              low: data.l,
              open: data.o,
              previousClose: data.pc,
              lastUpdated: new Date(data.t * 1000).toISOString()
            };
          } catch (err) {
            console.warn(`Failed to fetch quote for ${ticker}:`, err);
            return null;
          }
        })
      ).then(quotes => quotes.filter(q => q !== null)),

      // Fetch market indices
      (async () => {
        const overview = {};
        const indexPromises = Object.entries(indexSymbols).map(async ([indexName, symbol]) => {
          try {
            const response = await fetch(
              `${FINNHUB_BASE_URL}/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
            );
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.c !== 0) {
              overview[indexName] = {
                value: data.c,
                change: data.d,
                changePercent: data.dp
              };
            }
          } catch (err) {
            console.warn(`Failed to fetch ${indexName} data:`, err);
          }
        });

        await Promise.all(indexPromises);
        overview.lastUpdated = new Date().toISOString();
        return overview;
      })()
    ]);

    const result = {
      stock_quotes: stockQuotes,
      market_overview: Object.keys(marketOverview).length > 1 ? marketOverview : null,
      _metadata: {
        fetched_at: new Date().toISOString(),
        source: 'finnhub_api',
        tickers_count: stockQuotes.length,
        cached: false,
        note: 'Real-time data from Finnhub (cached for 20 minutes)'
      }
    };

    // Cache the result for 20 minutes
    cache.set(cacheKey, result);
    console.log('Financial data cached');

    return result;
  } catch (error) {
    console.error('Error fetching financial data:', error);
    throw error;
  }
}

/**
 * Validate ticker symbols
 */
function validateTickers(tickers) {
  const validTickers = [];
  const tickerRegex = /^[A-Z]{1,5}$/; // 1-5 uppercase letters

  for (const ticker of tickers) {
    if (tickerRegex.test(ticker)) {
      validTickers.push(ticker);
    }
  }

  // Limit to maximum 10 tickers per request
  return validTickers.slice(0, 10);
}

/**
 * Main endpoint: Get financial data
 * Requires valid Pitcher bearer token
 */
app.get('/api/financial-data', rateLimitMiddleware, authenticateRequest, async (req, res) => {
  try {
    // Parse tickers from query params (comma-separated)
    const tickersParam = req.query.tickers || 'AAPL,MSFT,GOOGL,AMZN';
    const tickersRaw = tickersParam.split(',').map(t => t.trim().toUpperCase());
    const tickers = validateTickers(tickersRaw);

    if (tickers.length === 0) {
      return res.status(400).json({
        error: 'Invalid ticker symbols',
        note: 'Tickers must be 1-5 uppercase letters (e.g., AAPL, MSFT)'
      });
    }

    const financialData = await fetchFinancialData(tickers);

    // Add user context to metadata based on auth type
    if (req.authType === 'shared_link') {
      financialData._metadata.auth_type = 'shared_link';
      financialData._metadata.shared_link_id = req.user.shared_link_id;
      financialData._metadata.instance_id = req.user.instance_id;
    } else {
      financialData._metadata.auth_type = 'bearer';
      financialData._metadata.requested_by = req.user.email;
    }
    financialData._metadata.organization = req.organization;

    res.json(financialData);
  } catch (error) {
    console.error('Error in /api/financial-data:', error);
    res.status(500).json({
      error: 'Failed to fetch financial data',
      message: error.message
    });
  }
});

/**
 * Debug endpoint: Get current user info (disabled in production)
 */
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/me', authenticateRequest, (req, res) => {
    res.json({
      authType: req.authType,
      organization: req.organization,
      user: {
        type: req.user.type,
        ...(req.user.email && { email: req.user.email })
      }
    });
  });
}

// 404 handler
app.use((req, res) => {
 return res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  // CORS error
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Generic error response - don't leak details in production
  res.status(500).json({
    error: 'Internal server error'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Financial Data Integration Server running on port ${PORT}`);
  console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Financial data cache: 20 minutes`);
  console.log(`🔐 JWT validation cache: Until token expiry (based on exp claim)`);
  console.log(`⚡ Rate limit: ${MAX_REQUESTS_PER_WINDOW} requests per minute`);
  console.log(`🔗 CORS: Restricted to *.my.pitcher.com domains`);

  // Validate required environment variables
  if (!FINNHUB_API_KEY || FINNHUB_API_KEY === 'YOUR_API_KEY_HERE') {
    console.error('❌ ERROR: FINNHUB_API_KEY environment variable not configured');
    console.error('   Set FINNHUB_API_KEY before starting the server');
    process.exit(1);
  }
});

