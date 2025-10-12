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
// Degen Zone - Top Movers API
// ===========================
const DEGEN_UPDATE_INTERVAL = 2 * 60 * 1000; // 2 minutes
const DEGEN_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes
let degenUpdateIntervalId = null;

// Fetch top movers (gainers/losers/volume)
async function fetchTopMovers() {
    const cacheKey = 'top_movers';
    const cached = cache.get(cacheKey);

    if (cached) {
        return cached;
    }

    try {
        const url = `${API_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&price_change_percentage=24h&sparkline=false`;
        const data = await fetchWithRetry(url);

        // Filter out invalid coins
        const validCoins = data.filter(coin =>
            coin.market_cap > 1000000 && // Market cap > $1M
            coin.total_volume > 100000 && // Volume > $100K
            coin.current_price &&
            coin.price_change_percentage_24h !== null
        );

        cache.set(cacheKey, validCoins);
        return validCoins;
    } catch (error) {
        console.error('Failed to fetch top movers:', error);

        // Return stale cache if available
        const staleData = cache.get(cacheKey);
        if (staleData) {
            console.warn('Using stale top movers data');
            return staleData;
        }

        throw error;
    }
}

// Get top gainers
async function fetchTopGainers(limit = 6) {
    const movers = await fetchTopMovers();
    return movers
        .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)
        .slice(0, limit);
}

// Get top losers
async function fetchTopLosers(limit = 6) {
    const movers = await fetchTopMovers();
    return movers
        .sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h)
        .slice(0, limit);
}

// Get high volume coins
async function fetchHighVolume(limit = 6) {
    const movers = await fetchTopMovers();
    return movers
        .sort((a, b) => b.total_volume - a.total_volume)
        .slice(0, limit);
}

// Calculate risk level
function calculateRiskLevel(marketCap, priceChange, volume) {
    const absChange = Math.abs(priceChange);

    // EXTREME: Micro cap OR extreme volatility
    if (marketCap < 10000000 || absChange > 100) {
        return { level: 'extreme', color: '#ef4444', label: 'EXTREME' };
    }

    // VERY HIGH: Small cap OR very high volatility
    if (marketCap < 50000000 || absChange > 50) {
        return { level: 'very-high', color: '#f97316', label: 'VERY HIGH' };
    }

    // HIGH: Mid cap OR high volatility
    if (marketCap < 500000000 || absChange > 20) {
        return { level: 'high', color: '#f59e0b', label: 'HIGH' };
    }

    // MEDIUM: Large cap with moderate volatility
    if (marketCap > 500000000 && absChange > 10) {
        return { level: 'medium', color: '#a78bfa', label: 'MEDIUM' };
    }

    // LOW: Large cap with low volatility
    return { level: 'low', color: '#10b981', label: 'LOW' };
}

// Format market cap
function formatMarketCap(number) {
    if (number >= 1000000000) {
        return `$${(number / 1000000000).toFixed(2)}B`;
    } else if (number >= 1000000) {
        return `$${(number / 1000000).toFixed(1)}M`;
    } else if (number >= 1000) {
        return `$${(number / 1000).toFixed(0)}K`;
    }
    return `$${number.toFixed(0)}`;
}

// Format volume
function formatVolume(number) {
    if (number >= 1000000000) {
        return `$${(number / 1000000000).toFixed(2)}B`;
    } else if (number >= 1000000) {
        return `$${(number / 1000000).toFixed(0)}M`;
    } else if (number >= 1000) {
        return `$${(number / 1000).toFixed(0)}K`;
    }
    return `$${number.toFixed(0)}`;
}

// Get dynamic warnings for a coin
function getDynamicWarnings(coin, lang = 'en') {
    const warnings = [];
    const absChange = Math.abs(coin.price_change_percentage_24h);

    if (absChange > 50) {
        warnings.push({
            icon: '⚠️',
            text: lang === 'pt' ? 'Volatilidade extrema - Alto risco' : 'Extreme volatility - High risk'
        });
    }

    if (coin.total_volume < 500000) {
        warnings.push({
            icon: '⚠️',
            text: lang === 'pt' ? 'Baixa liquidez - Difícil sair' : 'Low liquidity - Difficult to exit'
        });
    }

    if (coin.market_cap < 5000000) {
        warnings.push({
            icon: '⚠️',
            text: lang === 'pt' ? 'Micro cap - Risco muito alto' : 'Micro cap - Very high risk'
        });
    }

    return warnings;
}

// Create degen card HTML
function createDegenCard(coin, type = 'gainer') {
    const lang = document.documentElement.lang === 'pt-BR' ? 'pt' : 'en';
    const risk = calculateRiskLevel(coin.market_cap, coin.price_change_percentage_24h, coin.total_volume);
    const warnings = getDynamicWarnings(coin, lang);

    const borderColor = type === 'gainer' ? '#10b981' : type === 'loser' ? '#ef4444' : '#8b5cf6';
    const changeColor = coin.price_change_percentage_24h >= 0 ? '#10b981' : '#ef4444';
    const changeIcon = coin.price_change_percentage_24h >= 0 ? '📈' : '📉';

    const riskLabels = {
        'EXTREME': lang === 'pt' ? 'EXTREMO' : 'EXTREME',
        'VERY HIGH': lang === 'pt' ? 'MUITO ALTO' : 'VERY HIGH',
        'HIGH': lang === 'pt' ? 'ALTO' : 'HIGH',
        'MEDIUM': lang === 'pt' ? 'MÉDIO' : 'MEDIUM',
        'LOW': lang === 'pt' ? 'BAIXO' : 'LOW'
    };

    return `
        <div class="degen-card" style="border-top-color: ${borderColor}">
            <div class="degen-header">
                <div class="degen-tag" style="background: ${borderColor};">
                    ${type === 'gainer' ? (lang === 'pt' ? 'ALTA' : 'GAINER') :
                      type === 'loser' ? (lang === 'pt' ? 'QUEDA' : 'LOSER') :
                      (lang === 'pt' ? 'VOLUME' : 'VOLUME')}
                </div>
                <span class="degen-icon">${changeIcon}</span>
            </div>

            <h3 class="degen-pair">${coin.symbol.toUpperCase()}/USD</h3>

            <div class="degen-name">${coin.name}</div>

            <div class="degen-info">
                <div class="price-info">
                    <span class="price mono">${formatPrice(coin.current_price)}</span>
                    <span class="change-extreme ${coin.price_change_percentage_24h >= 0 ? 'positive' : 'negative'} mono"
                          style="color: ${changeColor}; font-size: 20px;">
                        ${coin.price_change_percentage_24h >= 0 ? '+' : ''}${coin.price_change_percentage_24h.toFixed(1)}%
                    </span>
                </div>
            </div>

            <div class="degen-metrics">
                <div class="metric">
                    <span class="metric-label">${lang === 'pt' ? 'Market Cap' : 'Market Cap'}:</span>
                    <span class="metric-value mono">${formatMarketCap(coin.market_cap)}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">${lang === 'pt' ? 'Volume 24h' : 'Volume 24h'}:</span>
                    <span class="metric-value mono">${formatVolume(coin.total_volume)}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">${lang === 'pt' ? 'Rank' : 'Rank'}:</span>
                    <span class="metric-value mono">#${coin.market_cap_rank || 'N/A'}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">${lang === 'pt' ? 'ATH' : 'ATH'}:</span>
                    <span class="metric-value mono">${formatPrice(coin.ath)}</span>
                </div>
            </div>

            ${warnings.length > 0 ? `
                <div class="degen-warnings">
                    ${warnings.map(w => `
                        <div class="warning-item">
                            <span>${w.icon}</span>
                            <span>${w.text}</span>
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            <div class="risk-badge ${risk.level}" style="border-color: ${risk.color}; color: ${risk.color};">
                ${lang === 'pt' ? 'Risco' : 'Risk'}: ${riskLabels[risk.label]}
            </div>

            <a href="https://www.coingecko.com/en/coins/${coin.id}"
               target="_blank"
               rel="noopener noreferrer"
               class="btn-coingecko">
                ${lang === 'pt' ? 'Ver no CoinGecko' : 'View on CoinGecko'} →
            </a>
        </div>
    `;
}

// Update Degen Zone cards
async function updateDegenZone(tabType = 'gainers') {
    const tabContent = document.getElementById(tabType);
    if (!tabContent) return;

    const grid = tabContent.querySelector('.degen-grid');
    if (!grid) return;

    try {
        // Show loading state
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
                <div style="font-size: 48px; margin-bottom: 16px;">⏳</div>
                <div>${document.documentElement.lang === 'pt-BR' ? 'Carregando...' : 'Loading...'}</div>
            </div>
        `;

        let coins;
        let cardType;

        if (tabType === 'gainers') {
            coins = await fetchTopGainers(6);
            cardType = 'gainer';
        } else if (tabType === 'losers') {
            coins = await fetchTopLosers(6);
            cardType = 'loser';
        } else if (tabType === 'high-volume') {
            coins = await fetchHighVolume(6);
            cardType = 'volume';
        } else {
            return; // New listings - keep mock data
        }

        // Generate cards
        grid.innerHTML = coins.map(coin => createDegenCard(coin, cardType)).join('');

        // Update timestamp
        updateDegenTimestamp(tabType);

    } catch (error) {
        console.error(`Failed to update ${tabType}:`, error);
        const lang = document.documentElement.lang === 'pt-BR' ? 'pt' : 'en';
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--color-sell);">
                <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
                <div>${lang === 'pt' ? 'Erro ao carregar dados' : 'Failed to load data'}</div>
                <button onclick="window.SignalDegenAPI.updateDegenZone('${tabType}')"
                        style="margin-top: 16px; padding: 10px 20px; background: var(--gradient-purple);
                               color: white; border: none; border-radius: 8px; cursor: pointer;">
                    ${lang === 'pt' ? 'Tentar Novamente' : 'Try Again'}
                </button>
            </div>
        `;
    }
}

// Update timestamp for degen zone
function updateDegenTimestamp(tabType) {
    const timestamp = document.getElementById(`${tabType}-timestamp`);
    if (timestamp) {
        const lang = document.documentElement.lang === 'pt-BR' ? 'pt' : 'en';
        const text = lang === 'pt' ? 'Atualizado agora' : 'Updated now';
        timestamp.textContent = text;
    }
}

// Start degen zone auto-updates
function startDegenAutoUpdate() {
    // Initial update for active tab
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab) {
        const tabType = activeTab.getAttribute('data-tab');
        if (tabType !== 'new-listings') {
            updateDegenZone(tabType);
        }
    }

    // Set interval for updates
    degenUpdateIntervalId = setInterval(() => {
        if (isPageVisible) {
            const activeTab = document.querySelector('.tab-btn.active');
            if (activeTab) {
                const tabType = activeTab.getAttribute('data-tab');
                if (tabType !== 'new-listings') {
                    updateDegenZone(tabType);
                }
            }
        }
    }, DEGEN_UPDATE_INTERVAL);

    console.log('Degen Zone auto-update started (every 2 minutes)');
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

    // Start degen zone updates
    startDegenAutoUpdate();

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
    stopAutoUpdate,
    fetchTopGainers,
    fetchTopLosers,
    fetchHighVolume,
    updateDegenZone,
    calculateRiskLevel
};
