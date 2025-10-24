// ===========================
// LIQUIDITY POOL ANALYZER
// Dexscreener API Integration
// ===========================

class PoolAnalyzerError extends Error {
    constructor(message, type) {
        super(message);
        this.type = type; // 'network', 'notFound', 'rateLimit', 'invalid'
        this.name = 'PoolAnalyzerError';
    }
}

class PoolAnalyzer {
    constructor() {
        this.dexscreenerBase = 'https://api.dexscreener.com/latest/dex';
        this.cache = new Map();
        this.cacheExpiry = 2 * 60 * 1000; // 2 minutes
    }

    /**
     * Fetch pool data from Dexscreener
     * @param {string} network - Network name (solana, ethereum, etc)
     * @param {string} pairAddress - Pool/pair address
     */
    async fetchPoolData(network, pairAddress) {
        // Check cache first
        const cacheKey = `${network}-${pairAddress}`;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        try {
            const url = `${this.dexscreenerBase}/pairs/${network}/${pairAddress}`;
            const response = await fetch(url);

            if (response.status === 404) {
                throw new PoolAnalyzerError(
                    'Pool not found. Please check the address and network.',
                    'notFound'
                );
            }

            if (response.status === 429) {
                throw new PoolAnalyzerError(
                    'Too many requests. Please wait a minute and try again.',
                    'rateLimit'
                );
            }

            if (!response.ok) {
                throw new PoolAnalyzerError(
                    'API error. Please try again later.',
                    'network'
                );
            }

            const data = await response.json();

            if (!data.pair && !data.pairs) {
                throw new PoolAnalyzerError(
                    'No pool data returned. The address may be invalid.',
                    'invalid'
                );
            }

            // Dexscreener returns either { pair: {...} } or { pairs: [{...}] }
            const pairData = data.pair || (data.pairs && data.pairs[0]);

            if (!pairData) {
                throw new PoolAnalyzerError(
                    'Invalid pool data format.',
                    'invalid'
                );
            }

            // Cache result
            this.setCache(cacheKey, pairData);

            return pairData;
        } catch (error) {
            if (error instanceof PoolAnalyzerError) {
                throw error;
            }
            console.error('Error fetching pool data:', error);
            throw new PoolAnalyzerError(
                'Network error. Please check your connection.',
                'network'
            );
        }
    }

    /**
     * Parse and structure pool data
     */
    parsePoolData(pairData) {
        return {
            // Basic info
            pairAddress: pairData.pairAddress,
            chainId: pairData.chainId,
            dexId: pairData.dexId,
            url: pairData.url,

            // Tokens
            baseToken: {
                address: pairData.baseToken.address,
                name: pairData.baseToken.name,
                symbol: pairData.baseToken.symbol
            },
            quoteToken: {
                address: pairData.quoteToken.address,
                name: pairData.quoteToken.name,
                symbol: pairData.quoteToken.symbol
            },

            // Price data
            priceNative: parseFloat(pairData.priceNative) || 0,
            priceUsd: parseFloat(pairData.priceUsd) || 0,

            // Liquidity & Volume
            liquidity: {
                usd: parseFloat(pairData.liquidity?.usd) || 0,
                base: parseFloat(pairData.liquidity?.base) || 0,
                quote: parseFloat(pairData.liquidity?.quote) || 0
            },
            volume: {
                h24: parseFloat(pairData.volume?.h24) || 0,
                h6: parseFloat(pairData.volume?.h6) || 0,
                h1: parseFloat(pairData.volume?.h1) || 0
            },

            // Price changes
            priceChange: {
                h24: parseFloat(pairData.priceChange?.h24) || 0,
                h6: parseFloat(pairData.priceChange?.h6) || 0,
                h1: parseFloat(pairData.priceChange?.h1) || 0
            },

            // Additional data
            fdv: parseFloat(pairData.fdv) || 0,
            marketCap: parseFloat(pairData.marketCap) || 0,
            pairCreatedAt: pairData.pairCreatedAt || null,

            // Transaction counts
            txns: pairData.txns || { h24: {}, h6: {}, h1: {} }
        };
    }

    /**
     * Calculate APRs based on volume and liquidity
     * Assumes fee tier (will try to detect, default 0.3%)
     */
    calculateAPRs(volume24h, liquidity, feeTier = 0.3) {
        if (!liquidity || liquidity === 0) {
            return { daily: 0, monthly: 0, annual: 0, estimated: true };
        }

        const feePerDay = volume24h * (feeTier / 100);
        const dailyAPR = (feePerDay / liquidity) * 100;
        const monthlyAPR = dailyAPR * 30;
        const annualAPR = dailyAPR * 365;

        return {
            daily: dailyAPR,
            monthly: monthlyAPR,
            annual: annualAPR,
            feeTier: feeTier,
            estimated: true
        };
    }

    /**
     * Calculate 3 strategic ranges based on current price
     * @param {number} centerPrice - Current price (base token in quote token)
     * @param {number} volatility - Optional volatility adjustment (0-100)
     */
    calculateRanges(centerPrice, volatility = 0) {
        // Adjust ranges based on volatility (if high volatility, widen ranges)
        const volatilityFactor = 1 + (Math.abs(volatility) / 200);

        const shortRange = 0.03 * volatilityFactor;   // ±3% base
        const moderateRange = 0.07 * volatilityFactor; // ±7% base
        const longRange = 0.18 * volatilityFactor;     // ±18% base

        return {
            short: {
                min: centerPrice * (1 - shortRange),
                max: centerPrice * (1 + shortRange),
                percent: shortRange * 100
            },
            moderate: {
                min: centerPrice * (1 - moderateRange),
                max: centerPrice * (1 + moderateRange),
                percent: moderateRange * 100
            },
            long: {
                min: centerPrice * (1 - longRange),
                max: centerPrice * (1 + longRange),
                percent: longRange * 100
            }
        };
    }

    /**
     * Assess risk level based on liquidity, volume, and age
     */
    assessRisk(poolData) {
        let riskScore = 0;
        let reasons = [];

        // Liquidity check
        if (poolData.liquidity.usd < 50000) {
            riskScore += 3;
            reasons.push('Very low liquidity (<$50K)');
        } else if (poolData.liquidity.usd < 500000) {
            riskScore += 2;
            reasons.push('Low liquidity (<$500K)');
        } else if (poolData.liquidity.usd < 1000000) {
            riskScore += 1;
            reasons.push('Moderate liquidity (<$1M)');
        }

        // Volume/Liquidity ratio
        const volLiqRatio = poolData.volume.h24 / poolData.liquidity.usd;
        if (volLiqRatio < 0.01) {
            riskScore += 2;
            reasons.push('Very low trading activity');
        } else if (volLiqRatio < 0.1) {
            riskScore += 1;
            reasons.push('Low trading activity');
        }

        // Age check (if available)
        if (poolData.pairCreatedAt) {
            const ageHours = (Date.now() - poolData.pairCreatedAt) / (1000 * 60 * 60);
            if (ageHours < 24) {
                riskScore += 3;
                reasons.push('Very new pool (<24h)');
            } else if (ageHours < 168) {
                riskScore += 1;
                reasons.push('New pool (<1 week)');
            }
        }

        // Price volatility
        if (Math.abs(poolData.priceChange.h24) > 50) {
            riskScore += 2;
            reasons.push('Extreme 24h volatility');
        } else if (Math.abs(poolData.priceChange.h24) > 20) {
            riskScore += 1;
            reasons.push('High 24h volatility');
        }

        // Determine risk level
        let riskLevel, riskColor;
        if (riskScore >= 6) {
            riskLevel = 'EXTREME';
            riskColor = '#ef4444';
        } else if (riskScore >= 4) {
            riskLevel = 'HIGH';
            riskColor = '#f97316';
        } else if (riskScore >= 2) {
            riskLevel = 'MEDIUM';
            riskColor = '#f59e0b';
        } else {
            riskLevel = 'LOW';
            riskColor = '#10b981';
        }

        return {
            level: riskLevel,
            score: riskScore,
            color: riskColor,
            reasons: reasons
        };
    }

    /**
     * Try to detect fee tier from DEX
     * Returns estimated fee tier percentage
     */
    estimateFeeTier(dexId, poolData) {
        const dexFees = {
            'raydium': 0.25,
            'orca': 0.3,
            'meteora': 0.25,
            'uniswap': 0.3,
            'uniswapv3': 0.05,
            'pancakeswap': 0.25,
            'sushiswap': 0.3,
            'quickswap': 0.3,
            'trader joe': 0.3,
            'spookyswap': 0.2
        };

        // Check if fee tier is in pool data
        if (poolData.fee) {
            return parseFloat(poolData.fee);
        }

        // Use DEX default
        const dexIdLower = dexId.toLowerCase();
        for (const [dex, fee] of Object.entries(dexFees)) {
            if (dexIdLower.includes(dex)) {
                return fee;
            }
        }

        // Default to 0.3%
        return 0.3;
    }

    /**
     * Complete analysis workflow
     */
    async analyzePool(network, pairAddress) {
        try {
            // 1. Fetch pool data
            const rawData = await this.fetchPoolData(network, pairAddress);
            const poolData = this.parsePoolData(rawData);

            // 2. Estimate fee tier
            const feeTier = this.estimateFeeTier(poolData.dexId, rawData);

            // 3. Calculate APRs
            const aprs = this.calculateAPRs(
                poolData.volume.h24,
                poolData.liquidity.usd,
                feeTier
            );

            // 4. Calculate ranges
            const ranges = this.calculateRanges(
                poolData.priceNative,
                poolData.priceChange.h24
            );

            // 5. Assess risk
            const risk = this.assessRisk(poolData);

            // 6. Return complete analysis
            return {
                success: true,
                timestamp: new Date().toISOString(),
                poolData: poolData,
                aprs: aprs,
                ranges: ranges,
                risk: risk,
                feeTier: feeTier
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                errorType: error.type || 'unknown',
                timestamp: new Date().toISOString()
            };
        }
    }

    // Cache helpers
    getCached(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;

        if (Date.now() - cached.timestamp > this.cacheExpiry) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PoolAnalyzer, PoolAnalyzerError };
}
