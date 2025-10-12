# Degen Zone - Real-Time Top Movers Update

## Overview
The Degen Zone section has been completely redesigned to show **real cryptocurrency market movers** using live CoinGecko API data.

## ✅ What's New

### 1. Four Dynamic Tabs

**Tab 1: Top Gainers 🚀** (Default)
- Shows 6 biggest 24h gainers
- Green theme (border + positive indicators)
- Sorted by highest percentage gain

**Tab 2: Top Losers 📉**
- Shows 6 biggest 24h losers
- Red theme (border + negative indicators)
- Sorted by lowest percentage change

**Tab 3: High Volume 🔥**
- Shows 6 highest trading volume coins
- Purple theme (brand colors)
- Sorted by 24h volume (USD)

**Tab 4: New Listings ⭐**
- Placeholder for future feature
- Keeps existing mock data

### 2. Real-Time Data (CoinGecko API)

**Endpoint Used:**
```
GET /coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&price_change_percentage=24h
```

**Filters Applied:**
- Market cap > $1,000,000 (avoid extreme shitcoins)
- 24h volume > $100,000 (ensure liquidity)
- Valid price data required

**Update Frequency:**
- Auto-refresh: Every **2 minutes**
- Manual refresh: Click tab again or wait for auto-update
- Pauses when tab hidden (Page Visibility API)

### 3. Enhanced Card Display

Each card now shows:

**Header:**
- Dynamic tag (ALTA/GAINER, QUEDA/LOSER, VOLUME)
- Color-coded by type (green/red/purple)
- Trend emoji (📈/📉)

**Coin Info:**
- Symbol/Pair (e.g., BTC/USD)
- Full name (e.g., Bitcoin)
- Current price (formatted)
- 24h change % (large, color-coded)

**Metrics (4 metrics):**
- **Market Cap**: $1.5B, $250M, $50K format
- **Volume 24h**: Trading volume in USD
- **Rank**: CoinGecko market cap rank (#1, #2, etc.)
- **ATH**: All-time high price

**Dynamic Warnings** (conditional):
- ⚠️ "Extreme volatility - High risk" (if change > 50%)
- ⚠️ "Low liquidity - Difficult to exit" (if volume < $500K)
- ⚠️ "Micro cap - Very high risk" (if market cap < $5M)

**Risk Badge** (auto-calculated):
- **EXTREME** (red): Market cap < $10M OR change > 100%
- **VERY HIGH** (orange): Market cap $10M-$50M OR change 50-100%
- **HIGH** (yellow): Market cap $50M-$500M OR change 20-50%
- **MEDIUM** (purple): Market cap > $500M AND change 10-20%
- **LOW** (green): Market cap > $1B AND change < 10%

**Action Button:**
- "View on CoinGecko →" link
- Opens coin page in new tab
- Direct link: `https://www.coingecko.com/en/coins/{id}`

### 4. Visual Enhancements

**Gainers Cards:**
- Border-top: 3px solid #10b981 (green)
- Large green percentage display
- Upward trend emoji 📈

**Losers Cards:**
- Border-top: 3px solid #ef4444 (red)
- Large red percentage display
- Downward trend emoji 📉

**High Volume Cards:**
- Border-top: 3px solid #8b5cf6 (purple)
- Volume metrics highlighted
- Fire emoji 🔥

**Loading State:**
- Smooth loading animation
- "⏳ Loading..." message
- Grid skeleton during fetch

**Error State:**
- "⚠️ Failed to load data"
- "Try Again" button to retry
- Graceful fallback

### 5. Localization Support

**Portuguese (pt-BR):**
- Tab labels: "Maiores Altas 🚀", "Maiores Quedas 📉", "Alto Volume 🔥"
- Warnings: "Volatilidade extrema - Alto risco"
- Button: "Ver no CoinGecko"
- Risk levels: "EXTREMO", "MUITO ALTO", "ALTO", "MÉDIO", "BAIXO"

**English (en):**
- Tab labels: "Top Gainers 🚀", "Top Losers 📉", "High Volume 🔥"
- Warnings: "Extreme volatility - High risk"
- Button: "View on CoinGecko"
- Risk levels: "EXTREME", "VERY HIGH", "HIGH", "MEDIUM", "LOW"

## 🔧 Technical Implementation

### New Functions in [js/api.js](js/api.js)

```javascript
// Fetch all top movers (cached 2 min)
async function fetchTopMovers()

// Get top 6 gainers
async function fetchTopGainers(limit = 6)

// Get top 6 losers
async function fetchTopLosers(limit = 6)

// Get top 6 by volume
async function fetchHighVolume(limit = 6)

// Calculate risk level based on metrics
function calculateRiskLevel(marketCap, priceChange, volume)

// Format market cap ($1.5B, $250M)
function formatMarketCap(number)

// Format volume ($1.5B, $250M)
function formatVolume(number)

// Get dynamic warnings
function getDynamicWarnings(coin, lang)

// Create degen card HTML
function createDegenCard(coin, type)

// Update degen zone tab content
async function updateDegenZone(tabType)

// Start auto-updates (2 min interval)
function startDegenAutoUpdate()
```

### Updated Files

**[index.html](index.html)**
- Updated tab buttons with new data-tab values
- Added 3 new tab-content sections (gainers, losers, high-volume)
- Kept new-listings tab with mock data

**[styles.css](styles.css)**
- Added `.degen-name` style (coin full name)
- Added `.degen-warnings` styles (warning boxes)
- Added `.warning-item` styles (individual warnings)
- Added `.btn-coingecko` styles (CoinGecko link button)
- Added `.risk-badge.high` style (yellow risk badge)

**[script.js](script.js)**
- Updated Portuguese translations for new tabs
- Updated English translations for new tabs
- Modified `setupTabs()` to trigger `updateDegenZone()` on tab click

## 📊 Data Flow

```
User clicks "Top Gainers" tab
  ↓
setupTabs() triggers updateDegenZone('gainers')
  ↓
fetchTopMovers() - Get 100 coins from CoinGecko
  ↓
fetchTopGainers(6) - Sort by change %, get top 6
  ↓
For each coin:
  - calculateRiskLevel() → Risk badge
  - getDynamicWarnings() → Warning messages
  - createDegenCard() → Generate HTML
  ↓
Update DOM with cards
  ↓
Auto-refresh every 2 minutes
```

## 🎯 Example Output

**Top Gainer Card:**
```
┌─────────────────────────────────────┐
│ [ALTA]                         📈   │
│ PEPE/USD                            │
│ Pepe                                │
│                                     │
│ $0.0000012  +145.3%                 │
│                                     │
│ Market Cap: $5.2M                   │
│ Volume 24h: $850K                   │
│ Rank: #458                          │
│ ATH: $0.0000028                     │
│                                     │
│ ⚠️ Extreme volatility - High risk   │
│ ⚠️ Micro cap - Very high risk       │
│                                     │
│ [Risk: EXTREME] (red)               │
│                                     │
│ [View on CoinGecko →]               │
└─────────────────────────────────────┘
```

## ⚡ Performance Optimizations

1. **Caching Strategy:**
   - 2-minute cache for top movers data
   - Shared cache across all tabs (gainers/losers/volume)
   - localStorage + memory cache

2. **Efficient Sorting:**
   - Fetch once, sort multiple times
   - No redundant API calls per tab

3. **Lazy Loading:**
   - Only loads data when tab is clicked
   - Auto-refresh only for active tab

4. **Pause on Hide:**
   - Page Visibility API stops updates when tab hidden
   - Saves API calls and battery

## 🧪 Testing

### Manual Test Steps

1. **Start Local Server:**
   ```bash
   cd c:\Users\Guilherme\Trae.ai\SignallDegen
   npx http-server -p 8000 -o
   ```

2. **Open Browser:**
   - Navigate to http://localhost:8000
   - Scroll to Degen Zone section

3. **Test Gainers Tab:**
   - Should load automatically on page load
   - Verify 6 cards with green theme
   - Check that all have positive percentages
   - Verify "View on CoinGecko" link works

4. **Test Losers Tab:**
   - Click "Top Losers 📉" tab
   - Should show loading state
   - Verify 6 cards with red theme
   - Check that all have negative percentages

5. **Test High Volume Tab:**
   - Click "High Volume 🔥" tab
   - Verify purple theme
   - Check volume values are sorted (highest first)

6. **Test New Listings Tab:**
   - Click "New Listings ⭐" tab
   - Should show mock data (not API-driven)

7. **Test Auto-Refresh:**
   - Wait 2 minutes on any tab
   - Should see subtle loading indicator
   - Cards should update with new data

8. **Test Browser Console:**
   ```javascript
   // Manual API calls
   window.SignalDegenAPI.fetchTopGainers(6)
   window.SignalDegenAPI.fetchTopLosers(6)
   window.SignalDegenAPI.updateDegenZone('gainers')
   ```

### Expected Console Output

```
Initializing SignalDegen API...
Auto-update started (every 30 seconds)
Degen Zone auto-update started (every 2 minutes)
API initialization complete
```

## 🚨 Error Handling

**API Failure:**
- Shows cached data if available
- Displays error message with retry button
- Logs error to console

**Empty Results:**
- Shows "No data available" message
- Suggests trying again later

**Invalid Coin Data:**
- Filters out coins with missing fields
- Requires valid price, market cap, volume

## 🔮 Future Enhancements

**Phase 2:**
- [ ] Add filters: Market cap range, volume range
- [ ] Add search/filter by symbol
- [ ] Show 7-day performance chart per card
- [ ] Add "favorite" coins feature

**Phase 3:**
- [ ] Real-time WebSocket updates (< 1s)
- [ ] Push notifications for new top gainers
- [ ] Historical top movers (yesterday, last week)
- [ ] Export data to CSV

## 📝 API Rate Limits

**CoinGecko Free Tier:**
- 50 calls/minute
- Update interval: 2 minutes = ~0.5 calls/minute
- Well within limits ✅

**Current Usage:**
- 1 call per 2 minutes (top movers)
- Shared cache across 3 tabs
- ~30 calls/hour total

## 🎨 Design Notes

**Color Palette:**
- Gainers: #10b981 (emerald green)
- Losers: #ef4444 (red)
- High Volume: #8b5cf6 (purple, brand color)
- Warnings: #ef4444 (red)
- Risk badges: Color-coded by severity

**Typography:**
- Coin symbols: JetBrains Mono (monospace)
- Percentages: JetBrains Mono, 20px, bold
- Body text: Inter, 14px

**Spacing:**
- Card padding: 24px
- Grid gap: 30px
- Responsive: 1 column on mobile, 2-3 on desktop

## 🔗 External Links

All "View on CoinGecko" links open in new tab with:
- `target="_blank"`
- `rel="noopener noreferrer"` (security)

Format: `https://www.coingecko.com/en/coins/{id}`

Example:
- Bitcoin: https://www.coingecko.com/en/coins/bitcoin
- Ethereum: https://www.coingecko.com/en/coins/ethereum

---

**Last Updated**: October 12, 2025
**Version**: 2.0.0
**Status**: ✅ Production Ready

## Summary

The Degen Zone now provides **real-time, data-driven insights** into crypto market movers with:
- ✅ Live top gainers/losers/volume data
- ✅ Auto-refresh every 2 minutes
- ✅ Smart risk calculation
- ✅ Dynamic warnings based on metrics
- ✅ Direct CoinGecko links
- ✅ Bilingual support (PT/EN)
- ✅ Loading states & error handling
- ✅ Responsive design

**Ready to deploy!** 🚀
