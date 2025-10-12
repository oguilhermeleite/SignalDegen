// ===========================
// SignalDegen - CoinGecko API Integration
// Real-time cryptocurrency data with RSI calculation
// ===========================

// ===========================
// Configuration
// ===========================
const API_BASE = 'https://api.coingecko.com/api/v3';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const UPDATE_INTERVAL = 30 * 1000; // 30 seconds
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 2000; // 2 seconds

// Coin IDs mapping (CoinGecko IDs)
const COINS = {
    'BTC/USDT': 'bitcoin',
    'ETH/USDT': 'ethereum',
    'SOL/USDT': 'solana',
    'BNB/USDT': 'binancecoin',
    'XRP/USDT': 'ripple',
    'ADA/USDT': 'cardano'
};

// ===========================
// Cache Management
// ===========================
class DataCache {
    constructor() {
        this.cache = new Map();
    }

    set(key, value) {
        this.cache.set(key, {
            data: value,
            timestamp: Date.now()
        });

        // Save to localStorage
        try {
            localStorage.setItem(`signaldegen_cache_${key}`, JSON.stringify({
                data: value,
                timestamp: Date.now()
            }));
        } catch (e) {
            console.warn('Failed to save to localStorage:', e);
        }
    }

    get(key) {
        // Try memory cache first
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.data;
        }

        // Try localStorage
        try {
            const stored = localStorage.getItem(`signaldegen_cache_${key}`);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Date.now() - parsed.timestamp < CACHE_DURATION) {
                    this.cache.set(key, parsed.data);
                    return parsed.data;
                }
            }
        } catch (e) {
            console.warn('Failed to read from localStorage:', e);
        }

        return null;
    }

    clear(key) {
        this.cache.delete(key);
        try {
            localStorage.removeItem(`signaldegen_cache_${key}`);
        } catch (e) {
            console.warn('Failed to clear localStorage:', e);
        }
    }

    isStale(key) {
        const cached = this.cache.get(key);
        if (!cached) return true;
        return Date.now() - cached.timestamp >= CACHE_DURATION;
    }
}

const cache = new DataCache();

// ===========================
// API Functions
// ===========================
async function fetchWithRetry(url, retries = RETRY_ATTEMPTS) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.warn(`Fetch attempt ${i + 1} failed:`, error.message);

            if (i === retries - 1) {
                throw error;
            }

            // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, i)));
        }
    }
}

// Fetch current prices for all coins
async function fetchPrices() {
    const cacheKey = 'prices';
    const cached = cache.get(cacheKey);

    if (cached) {
        return cached;
    }

    try {
        const coinIds = Object.values(COINS).join(',');
        const url = `${API_BASE}/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`;

        const data = await fetchWithRetry(url);
        cache.set(cacheKey, data);

        return data;
    } catch (error) {
        console.error('Failed to fetch prices:', error);

        // Return cached data even if stale
        const staleData = cache.get(cacheKey);
        if (staleData) {
            console.warn('Using stale cached data');
            return staleData;
        }

        throw error;
    }
}

// Fetch historical data for RSI calculation
async function fetchHistoricalData(coinId, days = 14) {
    const cacheKey = `history_${coinId}_${days}`;
    const cached = cache.get(cacheKey);

    if (cached) {
        return cached;
    }

    try {
        const url = `${API_BASE}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=hourly`;
        const data = await fetchWithRetry(url);

        // Extract prices array
        const prices = data.prices.map(p => p[1]);
        cache.set(cacheKey, prices);

        return prices;
    } catch (error) {
        console.error(`Failed to fetch historical data for ${coinId}:`, error);

        // Return cached data even if stale
        const staleData = cache.get(cacheKey);
        if (staleData) {
            console.warn('Using stale cached historical data');
            return staleData;
        }

        throw error;
    }
}

// ===========================
// RSI Calculation
// ===========================
function calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) {
        console.warn('Not enough data for RSI calculation');
        return 50; // Default neutral value
    }

    // Calculate price changes
    const changes = [];
    for (let i = 1; i < prices.length; i++) {
        changes.push(prices[i] - prices[i - 1]);
    }

    // Separate gains and losses
    const gains = changes.map(c => c > 0 ? c : 0);
    const losses = changes.map(c => c < 0 ? Math.abs(c) : 0);

    // Calculate average gain and loss
    const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;

    if (avgLoss === 0) {
        return 100; // No losses = maximum RSI
    }

    // Calculate RSI
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    return Math.round(rsi);
}

// Determine signal based on RSI
function getSignalFromRSI(rsi) {
    if (rsi >= 70) {
        return { type: 'hold', score: Math.min(rsi, 100) };
    } else if (rsi >= 60) {
        return { type: 'buy', score: rsi };
    } else if (rsi >= 50) {
        return { type: 'strong-buy', score: rsi };
    } else if (rsi >= 30) {
        return { type: 'strong-buy', score: Math.max(rsi, 40) };
    } else {
        return { type: 'strong-buy', score: Math.max(100 - rsi, 60) };
    }
}

// ===========================
// Update Signal Cards
// ===========================
async function updateSignalCards() {
    const cards = document.querySelectorAll('.signal-card');

    try {
        // Fetch current prices
        const pricesData = await fetchPrices();

        // Update each card
        for (const card of cards) {
            const pairElement = card.querySelector('.pair');
            if (!pairElement) continue;

            const pair = pairElement.textContent.trim();
            const coinId = COINS[pair];

            if (!coinId || !pricesData[coinId]) continue;

            const coinData = pricesData[coinId];
            const price = coinData.usd;
            const change24h = coinData.usd_24h_change || 0;

            // Update price
            const priceElement = card.querySelector('.price');
            if (priceElement) {
                priceElement.textContent = formatPrice(price);

                // Add pulse animation
                priceElement.style.animation = 'pulse 0.5s ease';
                setTimeout(() => {
                    priceElement.style.animation = '';
                }, 500);
            }

            // Update change percentage
            const changeElement = card.querySelector('.change');
            if (changeElement) {
                const formattedChange = change24h >= 0 ? `+${change24h.toFixed(1)}%` : `${change24h.toFixed(1)}%`;
                changeElement.textContent = formattedChange;
                changeElement.classList.remove('positive', 'negative');
                changeElement.classList.add(change24h >= 0 ? 'positive' : 'negative');
            }

            // Fetch historical data and calculate RSI
            try {
                const historicalPrices = await fetchHistoricalData(coinId);
                const rsi = calculateRSI(historicalPrices);

                // Update RSI value
                const rsiElement = card.querySelector('.indicator-value.mono');
                if (rsiElement) {
                    rsiElement.textContent = rsi;
                }

                // Update signal and score based on RSI
                const signal = getSignalFromRSI(rsi);

                const signalTypeElement = card.querySelector('.signal-type');
                if (signalTypeElement) {
                    signalTypeElement.className = `signal-type ${signal.type}`;

                    // Update text based on current language
                    const lang = document.documentElement.lang === 'pt-BR' ? 'pt' : 'en';
                    const signalTexts = {
                        'strong-buy': lang === 'pt' ? 'COMPRA FORTE' : 'STRONG BUY',
                        'buy': lang === 'pt' ? 'COMPRA' : 'BUY',
                        'hold': lang === 'pt' ? 'AGUARDAR' : 'HOLD',
                        'sell': lang === 'pt' ? 'VENDA' : 'SELL'
                    };
                    signalTypeElement.textContent = signalTexts[signal.type] || signalTypeElement.textContent;
                }

                const scoreValueElement = card.querySelector('.score-value');
                if (scoreValueElement) {
                    scoreValueElement.textContent = signal.score;
                }
            } catch (error) {
                console.warn(`Failed to update RSI for ${pair}:`, error);
            }

            // Update timestamp
            updateTimestamp(card);
        }

        // Update last updated indicator
        updateLiveIndicator(true);

    } catch (error) {
        console.error('Failed to update signal cards:', error);
        updateLiveIndicator(false, error.message);

        // Show warning banner if no cached data
        showWarningBanner();
    }
}

// Format price with proper decimals
function formatPrice(price) {
    if (price >= 1000) {
        return `$${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    } else if (price >= 1) {
        return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (price >= 0.01) {
        return `$${price.toFixed(4)}`;
    } else {
        return `$${price.toFixed(6)}`;
    }
}

// Update timestamp on card
function updateTimestamp(card) {
    const timestampElement = card.querySelector('.updated');
    if (timestampElement) {
        const lang = document.documentElement.lang === 'pt-BR' ? 'pt' : 'en';
        const text = lang === 'pt' ? 'Atualizado agora' : 'Updated now';
        timestampElement.textContent = text;
    }
}

// ===========================
// Live Indicator
// ===========================
function updateLiveIndicator(isLive, errorMessage = '') {
    let indicator = document.getElementById('live-indicator');

    if (!indicator) {
        // Create indicator
        indicator = document.createElement('div');
        indicator.id = 'live-indicator';
        indicator.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            font-weight: 600;
            padding: 8px 16px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            margin-left: 20px;
        `;

        const headerRight = document.querySelector('.header-right');
        if (headerRight) {
            headerRight.insertBefore(indicator, headerRight.firstChild);
        }
    }

    if (isLive) {
        indicator.innerHTML = `
            <span style="width: 8px; height: 8px; background: #10b981; border-radius: 50%; animation: pulse 2s ease-in-out infinite;"></span>
            <span>Live</span>
        `;
        indicator.style.color = 'white';
        indicator.title = 'Real-time data updates every 30 seconds';
    } else {
        indicator.innerHTML = `
            <span style="width: 8px; height: 8px; background: #ef4444; border-radius: 50%;"></span>
            <span>Offline</span>
        `;
        indicator.style.color = '#ef4444';
        indicator.title = errorMessage || 'Connection error';
    }
}

function showWarningBanner() {
    let banner = document.getElementById('data-warning-banner');

    if (banner) return; // Already showing

    banner = document.createElement('div');
    banner.id = 'data-warning-banner';
    banner.style.cssText = `
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(239, 68, 68, 0.9);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: 600;
        z-index: 9999;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;

    const lang = document.documentElement.lang === 'pt-BR' ? 'pt' : 'en';
    banner.textContent = lang === 'pt'
        ? '⚠️ Usando dados em cache - Não foi possível conectar à API'
        : '⚠️ Using cached data - Unable to connect to API';

    document.body.appendChild(banner);

    // Auto remove after 5 seconds
    setTimeout(() => {
        banner.remove();
    }, 5000);
}

// ===========================
// Auto-Update System
// ===========================
let updateIntervalId = null;
let isPageVisible = true;

function startAutoUpdate() {
    // Initial update
    updateSignalCards();

    // Set interval for updates
    updateIntervalId = setInterval(() => {
        if (isPageVisible) {
            updateSignalCards();
        }
    }, UPDATE_INTERVAL);

    console.log('Auto-update started (every 30 seconds)');
}

function stopAutoUpdate() {
    if (updateIntervalId) {
        clearInterval(updateIntervalId);
        updateIntervalId = null;
        console.log('Auto-update stopped');
    }
}

// Page Visibility API - pause updates when tab is not visible
document.addEventListener('visibilitychange', () => {
    isPageVisible = !document.hidden;

    if (isPageVisible) {
        console.log('Page visible - resuming updates');
        updateSignalCards(); // Update immediately
    } else {
        console.log('Page hidden - updates will pause');
    }
});

// ===========================
// Manual Refresh Button
// ===========================
function addRefreshButton() {
    const safeSignalsSection = document.querySelector('.safe-signals .section-header');
    if (!safeSignalsSection) return;

    const refreshBtn = document.createElement('button');
    refreshBtn.id = 'manual-refresh-btn';
    refreshBtn.innerHTML = '🔄 Refresh';
    refreshBtn.style.cssText = `
        padding: 10px 20px;
        background: linear-gradient(135deg, #8b5cf6, #a78bfa);
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        margin-top: 16px;
        transition: all 0.3s ease;
    `;

    refreshBtn.addEventListener('click', async () => {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '⏳ Updating...';

        try {
            // Clear cache to force fresh data
            Object.values(COINS).forEach(coinId => {
                cache.clear(`history_${coinId}_14`);
            });
            cache.clear('prices');

            await updateSignalCards();

            refreshBtn.innerHTML = '✓ Updated!';
            setTimeout(() => {
                refreshBtn.innerHTML = '🔄 Refresh';
                refreshBtn.disabled = false;
            }, 2000);
        } catch (error) {
            refreshBtn.innerHTML = '✗ Failed';
            setTimeout(() => {
                refreshBtn.innerHTML = '🔄 Refresh';
                refreshBtn.disabled = false;
            }, 2000);
        }
    });

    safeSignalsSection.appendChild(refreshBtn);
}

// ===========================
// Initialize
// ===========================
function initAPI() {
    console.log('Initializing SignalDegen API...');

    // Start auto-updates
    startAutoUpdate();

    // Add manual refresh button
    addRefreshButton();

    console.log('API initialization complete');
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAPI);
} else {
    initAPI();
}

// Export functions for external use
window.SignalDegenAPI = {
    fetchPrices,
    fetchHistoricalData,
    calculateRSI,
    updateSignalCards,
    startAutoUpdate,
    stopAutoUpdate
};
