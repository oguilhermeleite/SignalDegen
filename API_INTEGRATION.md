# SignalDegen - API Integration Documentation

## Overview
SignalDegen now integrates with **CoinGecko API** (free tier) to provide real-time cryptocurrency price data and technical analysis signals.

## Features Implemented

### 1. CoinGecko API Integration
- ✅ Real-time price fetching for 6 cryptocurrencies: BTC, ETH, SOL, BNB, XRP, ADA
- ✅ 24-hour price change percentage
- ✅ 24-hour trading volume
- ✅ No API key required (free tier)
- ✅ Rate limiting with retry logic (3 attempts with exponential backoff)

### 2. Real-Time Price Updates
- ✅ Automatic updates every **30 seconds**
- ✅ Visual pulse animation on price changes
- ✅ Formatted prices based on value range:
  - `$43,250` for prices ≥ $1000
  - `$2,340.00` for prices ≥ $1
  - `$0.0005` for smaller values
- ✅ Positive/negative change indicators (green/red)
- ✅ "Updated now" timestamp

### 3. RSI Calculation & Signals
- ✅ Fetches 14-day historical data (hourly intervals)
- ✅ Calculates RSI (14-period Relative Strength Index)
- ✅ Auto-generates trading signals based on RSI:
  - **RSI ≥ 70**: HOLD (overbought)
  - **RSI 60-69**: BUY
  - **RSI 50-59**: STRONG BUY
  - **RSI 30-49**: STRONG BUY
  - **RSI < 30**: STRONG BUY (oversold opportunity)
- ✅ Dynamic score badges (0-100)

### 4. Auto-Refresh System
- ✅ Updates every 30 seconds automatically
- ✅ **Live indicator** in header: 🟢 Live / 🔴 Offline
- ✅ Manual refresh button in Safe Signals section
- ✅ Pauses updates when tab is hidden (Page Visibility API)
- ✅ Loading skeleton animation during updates

### 5. Error Handling & Caching
- ✅ 5-minute cache (localStorage + memory)
- ✅ Displays cached data if API fails
- ✅ Warning banner: "⚠️ Using cached data"
- ✅ Retry logic: 3 attempts with 2s exponential backoff
- ✅ Graceful degradation (keeps old data on error)

## File Structure
```
SignallDegen/
├── index.html          # Updated with <script src="js/api.js">
├── script.js           # Main app logic (language, animations)
├── styles.css          # Styling + loading animations
└── js/
    └── api.js          # CoinGecko API integration (NEW)
```

## API Endpoints Used

### 1. Current Prices
```
GET https://api.coingecko.com/api/v3/simple/price
?ids=bitcoin,ethereum,solana,binancecoin,ripple,cardano
&vs_currencies=usd
&include_24hr_change=true
&include_24hr_vol=true
```

**Response:**
```json
{
  "bitcoin": {
    "usd": 43250,
    "usd_24h_change": 3.5,
    "usd_24h_vol": 28000000000
  },
  ...
}
```

### 2. Historical Data (for RSI)
```
GET https://api.coingecko.com/api/v3/coins/{id}/market_chart
?vs_currency=usd
&days=14
&interval=hourly
```

**Response:**
```json
{
  "prices": [
    [1697040000000, 42150.5],
    [1697043600000, 42300.2],
    ...
  ]
}
```

## How It Works

### Initialization Flow
1. **DOM Ready** → `initAPI()` called
2. **First Update** → Fetches prices & historical data
3. **Calculate RSI** → 14-period RSI for each coin
4. **Update UI** → Prices, signals, scores, timestamps
5. **Start Interval** → Repeat every 30 seconds

### Update Process
```
Every 30 seconds:
  ├── Check if page visible (skip if hidden)
  ├── Fetch current prices (with cache check)
  ├── Update price + 24h change
  ├── Fetch historical data (14 days)
  ├── Calculate RSI
  ├── Update signal type (STRONG BUY/BUY/HOLD/SELL)
  ├── Update score badge
  └── Update "Updated now" timestamp
```

### Caching Strategy
- **Memory Cache**: Fast in-memory Map()
- **localStorage**: Persistent across refreshes
- **5-minute TTL**: Data refreshes after 5 minutes
- **Stale Data**: Used only if API fails

## Configuration (in `js/api.js`)

```javascript
const API_BASE = 'https://api.coingecko.com/api/v3';
const CACHE_DURATION = 5 * 60 * 1000;  // 5 minutes
const UPDATE_INTERVAL = 30 * 1000;     // 30 seconds
const RETRY_ATTEMPTS = 3;               // Max retries
const RETRY_DELAY = 2000;               // 2 seconds

// Add more coins here:
const COINS = {
    'BTC/USDT': 'bitcoin',
    'ETH/USDT': 'ethereum',
    // ... add new pairs
};
```

## Testing

### Manual Test
1. Open [http://localhost:8000](http://localhost:8000)
2. Check browser console for logs:
   - "Initializing SignalDegen API..."
   - "Auto-update started (every 30 seconds)"
3. Verify live indicator: 🟢 Live
4. Watch prices update (pulse animation)
5. Click "🔄 Refresh" button (should show "✓ Updated!")

### Disconnect Test
1. Disable network in browser DevTools
2. Wait 30 seconds
3. Should show: 🔴 Offline + warning banner
4. Cached data remains visible

### Cache Test
1. Load page → Wait for update
2. Refresh page (F5)
3. Should load instantly with cached data
4. After 5 minutes, fresh API call

## API Rate Limits (CoinGecko Free Tier)
- **50 calls/minute** (no API key)
- **Recommended**: Keep `UPDATE_INTERVAL` ≥ 30s
- **Current usage**: ~12 calls/minute (6 coins × 2 endpoints)

## Browser Console Commands

```javascript
// Manual update
window.SignalDegenAPI.updateSignalCards();

// Stop auto-updates
window.SignalDegenAPI.stopAutoUpdate();

// Restart auto-updates
window.SignalDegenAPI.startAutoUpdate();

// Fetch prices directly
window.SignalDegenAPI.fetchPrices().then(console.log);

// Calculate RSI manually
const prices = [100, 102, 101, 103, 105, 104, ...];
window.SignalDegenAPI.calculateRSI(prices, 14);
```

## Troubleshooting

### Issue: Prices not updating
- **Check console**: Look for error messages
- **Check network**: Verify internet connection
- **Check cache**: Clear localStorage (`localStorage.clear()`)
- **Check API**: Visit https://api.coingecko.com/api/v3/ping

### Issue: Wrong signals
- **Check RSI calculation**: Console.log RSI values
- **Check historical data**: Verify 14 days of data available
- **Check logic**: Review `getSignalFromRSI()` thresholds

### Issue: CORS errors
- **Solution**: Must run from HTTP server (not file://)
- **Use**: `npx http-server` or `python -m http.server`

## Future Enhancements

### Phase 2 (Planned)
- [ ] WebSocket connection for real-time updates (< 1s latency)
- [ ] More indicators: MACD, Bollinger Bands, Volume analysis
- [ ] Historical price charts (Chart.js integration)
- [ ] Alert system: Price alerts, signal notifications
- [ ] User preferences: Update frequency, signal sensitivity

### Phase 3 (Planned)
- [ ] Multiple exchanges (Binance, Coinbase, Kraken)
- [ ] Arbitrage opportunities
- [ ] Whale tracking (large transactions)
- [ ] Social sentiment analysis
- [ ] Premium API tier (faster updates)

## Credits
- **API**: [CoinGecko](https://www.coingecko.com/)
- **Font**: Inter, JetBrains Mono
- **Colors**: Purple/Black theme (#8b5cf6)

---

**Last Updated**: October 12, 2025
**Version**: 1.0.0
**Status**: ✅ Production Ready
