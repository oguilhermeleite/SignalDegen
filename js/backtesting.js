// ===========================
// BACKTESTING ENGINE
// Real historical data simulation
// ===========================

class BacktestSimulator {
    constructor(config) {
        this.pair = config.pair;
        this.initialCapital = config.capital;
        this.strategy = config.strategy;
        this.currentCapital = config.capital;
        this.position = null; // { entryPrice, amount, entryDate, signal }
        this.trades = [];
        this.portfolioHistory = [];
    }

    simulate(historicalData) {
        // Loop through each data point
        for (let i = 1; i < historicalData.length; i++) {
            const current = historicalData[i];
            const signal = current.signal;

            // Check if should enter position
            if (!this.position && this.shouldBuy(signal, current.score)) {
                this.enterPosition(current);
            }

            // Check if should exit position
            if (this.position && this.shouldSell(signal, current.score)) {
                this.exitPosition(current);
            }

            // Record portfolio value
            this.recordPortfolioValue(current);
        }

        // Close any open position at end
        if (this.position) {
            this.exitPosition(historicalData[historicalData.length - 1]);
        }

        return this.getResults();
    }

    shouldBuy(signal, score) {
        switch(this.strategy) {
            case 'all-signals':
                return signal === 'BUY' || signal === 'STRONG BUY';
            case 'strong-buy-only':
                return signal === 'STRONG BUY' && score >= 80;
            case 'aggressive':
                return signal !== 'SELL' && signal !== 'STRONG SELL';
            case 'conservative':
                return signal === 'STRONG BUY' && score >= 85;
            default:
                return false;
        }
    }

    shouldSell(signal, score) {
        switch(this.strategy) {
            case 'all-signals':
                return signal === 'SELL' || signal === 'STRONG SELL';
            case 'strong-buy-only':
                return signal !== 'STRONG BUY' || score < 80;
            case 'aggressive':
                return signal === 'SELL' || signal === 'STRONG SELL';
            case 'conservative':
                return signal === 'HOLD' || signal === 'SELL' || signal === 'STRONG SELL';
            default:
                return false;
        }
    }

    enterPosition(data) {
        const fee = 0.001; // 0.1% trading fee
        const amount = this.currentCapital * (1 - fee);
        const coins = amount / data.price;

        this.position = {
            entryPrice: data.price,
            entryDate: data.date,
            amount: coins,
            signal: data.signal,
            score: data.score
        };

        this.currentCapital = 0; // All capital in position
    }

    exitPosition(data) {
        const fee = 0.001; // 0.1% trading fee
        const exitValue = this.position.amount * data.price;
        const finalValue = exitValue * (1 - fee);
        const initialValue = this.position.amount * this.position.entryPrice;
        const profit = finalValue - initialValue;
        const profitPercent = (profit / initialValue) * 100;

        this.trades.push({
            entryDate: this.position.entryDate,
            exitDate: data.date,
            entryPrice: this.position.entryPrice,
            exitPrice: data.price,
            amount: this.position.amount,
            profit: profit,
            profitPercent: profitPercent,
            result: profit > 0 ? 'WIN' : 'LOSS',
            entrySignal: this.position.signal,
            exitSignal: data.signal
        });

        this.currentCapital = finalValue;
        this.position = null;
    }

    recordPortfolioValue(data) {
        let value = this.currentCapital;
        if (this.position) {
            value = this.position.amount * data.price;
        }

        this.portfolioHistory.push({
            date: data.date,
            value: value
        });
    }

    getResults() {
        const finalValue = this.currentCapital;
        const totalProfit = finalValue - this.initialCapital;
        const totalProfitPercent = (totalProfit / this.initialCapital) * 100;

        const wins = this.trades.filter(t => t.result === 'WIN').length;
        const losses = this.trades.filter(t => t.result === 'LOSS').length;
        const winRate = this.trades.length > 0 ? (wins / this.trades.length) * 100 : 0;

        const bestTrade = this.trades.length > 0
            ? Math.max(...this.trades.map(t => t.profit))
            : 0;
        const worstTrade = this.trades.length > 0
            ? Math.min(...this.trades.map(t => t.profit))
            : 0;

        const avgWin = wins > 0
            ? this.trades.filter(t => t.result === 'WIN').reduce((sum, t) => sum + t.profit, 0) / wins
            : 0;
        const avgLoss = losses > 0
            ? this.trades.filter(t => t.result === 'LOSS').reduce((sum, t) => sum + t.profit, 0) / losses
            : 0;

        return {
            initialCapital: this.initialCapital,
            finalCapital: finalValue,
            totalProfit: totalProfit,
            totalProfitPercent: totalProfitPercent,
            totalTrades: this.trades.length,
            wins: wins,
            losses: losses,
            winRate: winRate,
            bestTrade: bestTrade,
            worstTrade: worstTrade,
            avgWin: avgWin,
            avgLoss: avgLoss,
            trades: this.trades,
            portfolioHistory: this.portfolioHistory
        };
    }
}

// ===========================
// TECHNICAL INDICATORS
// ===========================

function calculateRSI(prices, period = 14) {
    const rsiData = [];

    for (let i = period; i < prices.length; i++) {
        const slice = prices.slice(i - period, i + 1);

        let gains = 0;
        let losses = 0;

        for (let j = 1; j < slice.length; j++) {
            const change = slice[j] - slice[j - 1];
            if (change > 0) {
                gains += change;
            } else {
                losses += Math.abs(change);
            }
        }

        const avgGain = gains / period;
        const avgLoss = losses / period;

        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));

        rsiData.push(rsi);
    }

    return rsiData;
}

function getSignalFromRSI(rsi) {
    if (rsi < 30) return { signal: 'STRONG BUY', score: 90 };
    if (rsi < 40) return { signal: 'BUY', score: 75 };
    if (rsi < 60) return { signal: 'HOLD', score: 50 };
    if (rsi < 70) return { signal: 'SELL', score: 30 };
    return { signal: 'STRONG SELL', score: 10 };
}

// ===========================
// DATA FETCHING
// ===========================

async function fetchHistoricalPrices(coinId, days) {
    try {
        const response = await fetch(
            `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=daily`
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Format: [[timestamp, price], ...]
        return data.prices.map(([timestamp, price]) => ({
            date: timestamp,
            price: price
        }));
    } catch (error) {
        console.error('Error fetching historical prices:', error);
        throw new Error('Unable to fetch historical data. Please try again.');
    }
}

function processHistoricalData(priceData) {
    const prices = priceData.map(d => d.price);
    const rsiValues = calculateRSI(prices, 14);

    // Combine price data with RSI (skip first 14 points where RSI isn't available)
    const processedData = [];

    for (let i = 14; i < priceData.length; i++) {
        const rsi = rsiValues[i - 14];
        const signalData = getSignalFromRSI(rsi);

        processedData.push({
            date: priceData[i].date,
            price: priceData[i].price,
            rsi: rsi,
            signal: signalData.signal,
            score: signalData.score
        });
    }

    return processedData;
}

// ===========================
// COIN ID MAPPING
// ===========================

const COIN_ID_MAP = {
    'BTC/USDT': 'bitcoin',
    'ETH/USDT': 'ethereum',
    'SOL/USDT': 'solana',
    'BNB/USDT': 'binancecoin',
    'XRP/USDT': 'ripple',
    'ADA/USDT': 'cardano'
};

function getCoinId(pair) {
    return COIN_ID_MAP[pair] || 'bitcoin';
}

// ===========================
// MAIN BACKTEST FUNCTION
// ===========================

async function runBacktest(config) {
    // Validate config
    if (!config.pair || !config.days || !config.capital || !config.strategy) {
        throw new Error('Invalid configuration');
    }

    // Get coin ID
    const coinId = getCoinId(config.pair);

    // Fetch historical data
    const priceData = await fetchHistoricalPrices(coinId, config.days);

    if (!priceData || priceData.length === 0) {
        throw new Error('No historical data available for this period');
    }

    // Process data (calculate RSI and signals)
    const historicalData = processHistoricalData(priceData);

    if (historicalData.length === 0) {
        throw new Error('Insufficient data for backtesting');
    }

    // Run simulation
    const simulator = new BacktestSimulator(config);
    const results = simulator.simulate(historicalData);

    // Check if any trades were executed
    if (results.totalTrades === 0) {
        throw new Error('No trades executed with these settings. Try a different strategy.');
    }

    return results;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runBacktest,
        BacktestSimulator,
        calculateRSI,
        getSignalFromRSI
    };
}
