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

    /**
     * Detect pool strategy based on token pair
     * Returns: 'progressive_buy', 'progressive_sell', 'balanced', 'stablecoin_pair'
     */
    detectPoolStrategy(baseToken, quoteToken) {
        const stablecoins = ['USDC', 'USDT', 'DAI', 'BUSD', 'UST', 'FRAX', 'USDD', 'TUSD', 'USDP'];
        const baseIsStable = stablecoins.includes(baseToken.symbol.toUpperCase());
        const quoteIsStable = stablecoins.includes(quoteToken.symbol.toUpperCase());

        if (baseIsStable && !quoteIsStable) {
            return 'progressive_buy'; // USDC/SOL = buying SOL progressively
        } else if (!baseIsStable && quoteIsStable) {
            return 'progressive_sell'; // SOL/USDC = selling SOL progressively
        } else if (baseIsStable && quoteIsStable) {
            return 'stablecoin_pair'; // USDC/USDT = arbitrage
        } else {
            return 'balanced'; // SOL/RAY = balanced exposure
        }
    }

    /**
     * Generate objectives based on strategy
     */
    generateObjectives(strategy, baseToken, quoteToken, currentLang = 'pt') {
        const objectives = {
            progressive_buy: {
                pt: [
                    `Entrar 100% em ${baseToken.symbol} e acumular ${quoteToken.symbol} gradualmente à medida que o preço oscila dentro do range.`,
                    `Beneficiar-se de um DCA automático, comprando ${quoteToken.symbol} a preços variados sem monitorar o mercado constantemente.`,
                    `Proteger-se de uma alta muito rápida do ${quoteToken.symbol}, garantindo exposição gradual ao ativo.`
                ],
                en: [
                    `Enter 100% in ${baseToken.symbol} and gradually accumulate ${quoteToken.symbol} as price oscillates within range.`,
                    `Benefit from automatic DCA, buying ${quoteToken.symbol} at varied prices without constant market monitoring.`,
                    `Protect against rapid ${quoteToken.symbol} surge, ensuring gradual asset exposure.`
                ]
            },
            progressive_sell: {
                pt: [
                    `Entrar 100% em ${baseToken.symbol} e realizar lucros em ${quoteToken.symbol} gradualmente conforme preço sobe.`,
                    `Venda automática de ${baseToken.symbol} em alta sem necessidade de timing de mercado perfeito.`,
                    `Acumular stablecoin mantendo exposição parcial ao ativo em caso de continuidade da alta.`
                ],
                en: [
                    `Enter 100% in ${baseToken.symbol} and take profits in ${quoteToken.symbol} gradually as price rises.`,
                    `Automatic ${baseToken.symbol} selling on rallies without perfect market timing needed.`,
                    `Accumulate stablecoin while maintaining partial asset exposure for continued upside.`
                ]
            },
            balanced: {
                pt: [
                    `Manter exposição balanceada entre ${baseToken.symbol} e ${quoteToken.symbol}.`,
                    `Capturar taxas da volatilidade relativa entre os dois ativos.`,
                    `Rebalanceamento automático conforme oscilações de preço entre os pares.`
                ],
                en: [
                    `Maintain balanced exposure between ${baseToken.symbol} and ${quoteToken.symbol}.`,
                    `Capture fees from relative volatility between both assets.`,
                    `Automatic rebalancing as price oscillates between pairs.`
                ]
            },
            stablecoin_pair: {
                pt: [
                    `Aproveitar pequenas diferenças de preço entre stablecoins (arbitragem).`,
                    `Baixíssimo risco de perda impermanente devido à correlação 1:1.`,
                    `Ganhos consistentes através de taxas de swap com capital protegido.`
                ],
                en: [
                    `Leverage small price differences between stablecoins (arbitrage).`,
                    `Very low impermanent loss risk due to 1:1 correlation.`,
                    `Consistent earnings through swap fees with protected capital.`
                ]
            }
        };

        return objectives[strategy][currentLang];
    }

    /**
     * Generate range observations based on strategy and current price
     */
    generateRangeObservations(strategy, ranges, currentPrice, currentLang = 'pt') {
        const observations = {
            short: {
                progressive_buy: {
                    pt: `Ideal para capturar taxas rápidas em lateralizações curtas. Requer ajuste semanal. Melhor para traders ativos.`,
                    en: `Ideal for capturing quick fees in short sideways movements. Requires weekly adjustment. Best for active traders.`
                },
                progressive_sell: {
                    pt: `Realiza lucros rapidamente em pequenas altas. Requer monitoramento frequente para não perder range.`,
                    en: `Takes profits quickly on small rallies. Requires frequent monitoring to stay in range.`
                },
                balanced: {
                    pt: `Alta captura de taxas mas exige rebalanceamento constante. Ideal para pares com baixa volatilidade.`,
                    en: `High fee capture but requires constant rebalancing. Ideal for low volatility pairs.`
                },
                stablecoin_pair: {
                    pt: `Maximiza taxas com risco mínimo. Perfeito para este par devido à baixa volatilidade.`,
                    en: `Maximizes fees with minimal risk. Perfect for this pair due to low volatility.`
                }
            },
            moderate: {
                progressive_buy: {
                    pt: `Equilibra taxa e segurança. Cobre oscilações típicas de mercado. Recomendado para maioria dos investidores.`,
                    en: `Balances fees and security. Covers typical market swings. Recommended for most investors.`
                },
                progressive_sell: {
                    pt: `Bom equilíbrio entre realizar lucros e manter posição. Ajustes mensais geralmente suficientes.`,
                    en: `Good balance between profit-taking and position maintenance. Monthly adjustments usually sufficient.`
                },
                balanced: {
                    pt: `Abordagem equilibrada com boa captura de taxas. Ideal para quem não quer ajustar toda semana.`,
                    en: `Balanced approach with good fee capture. Ideal for those not wanting weekly adjustments.`
                },
                stablecoin_pair: {
                    pt: `Mais cobertura que necessário, mas garante sempre estar dentro do range. Conservador e eficiente.`,
                    en: `More coverage than needed, but ensures always in range. Conservative and efficient.`
                }
            },
            long: {
                progressive_buy: {
                    pt: `Maior cobertura para oscilações amplas. Menos rebalanceamento mas captura menos taxas. Para investidores passivos.`,
                    en: `Greater coverage for wide swings. Less rebalancing but captures fewer fees. For passive investors.`
                },
                progressive_sell: {
                    pt: `Cobre movimentos maiores sem perder posição. Trade-off: menos taxas mas mais tranquilidade.`,
                    en: `Covers larger moves without losing position. Trade-off: fewer fees but more peace of mind.`
                },
                balanced: {
                    pt: `Abordagem "set and forget". Mínimo rebalanceamento necessário mas menor retorno em taxas.`,
                    en: `"Set and forget" approach. Minimal rebalancing needed but lower fee returns.`
                },
                stablecoin_pair: {
                    pt: `Desnecessariamente amplo para stablecoins. Use range curto ou moderado para melhor eficiência.`,
                    en: `Unnecessarily wide for stablecoins. Use short or moderate range for better efficiency.`
                }
            }
        };

        return {
            short: observations.short[strategy][currentLang],
            moderate: observations.moderate[strategy][currentLang],
            long: observations.long[strategy][currentLang]
        };
    }

    /**
     * Generate important notice based on current price position
     */
    generateImportantNotice(currentPrice, ranges, baseToken, quoteToken, currentLang = 'pt') {
        const inShort = currentPrice >= ranges.short.min && currentPrice <= ranges.short.max;
        const inModerate = currentPrice >= ranges.moderate.min && currentPrice <= ranges.moderate.max;
        const inLong = currentPrice >= ranges.long.min && currentPrice <= ranges.long.max;

        const notices = {
            pt: {
                all: `Verifique se o preço de ${quoteToken.symbol} (atualmente ${this.formatPrice(currentPrice)}) ainda está dentro do range escolhido antes de entrar. Ajustes periódicos mantêm a eficiência da pool e protegem seu capital conforme movimentos do mercado.`,
                short_only: `⚠️ Atenção: Preço atual está APENAS no range curto. Considere range moderado para mais segurança.`,
                moderate_only: `✅ Preço atual dentro do range moderado. Boa posição para entrada com equilíbrio risco/retorno.`,
                long_only: `⚠️ Preço nas extremidades. Considere aguardar consolidação ou usar range longo para maior segurança.`,
                out_all: `🚨 ALERTA: Preço atual FORA de todos os ranges sugeridos. Aguarde correção ou ajuste ranges manualmente.`
            },
            en: {
                all: `Verify that ${quoteToken.symbol} price (currently ${this.formatPrice(currentPrice)}) is still within your chosen range before entering. Periodic adjustments maintain pool efficiency and protect your capital through market movements.`,
                short_only: `⚠️ Warning: Current price is ONLY in short range. Consider moderate range for more safety.`,
                moderate_only: `✅ Current price within moderate range. Good entry position with risk/return balance.`,
                long_only: `⚠️ Price at extremes. Consider waiting for consolidation or use long range for more safety.`,
                out_all: `🚨 ALERT: Current price OUTSIDE all suggested ranges. Wait for correction or manually adjust ranges.`
            }
        };

        if (!inLong) {
            return notices[currentLang].out_all;
        } else if (inShort && inModerate && inLong) {
            return notices[currentLang].all;
        } else if (inShort && !inModerate) {
            return notices[currentLang].short_only;
        } else if (inModerate && !inShort) {
            return notices[currentLang].moderate_only;
        } else if (inLong && !inModerate) {
            return notices[currentLang].long_only;
        }

        return notices[currentLang].all;
    }

    /**
     * Helper to format price
     */
    formatPrice(price) {
        if (price >= 1) {
            return '$' + price.toFixed(2);
        } else if (price >= 0.01) {
            return '$' + price.toFixed(4);
        } else if (price >= 0.0001) {
            return '$' + price.toFixed(6);
        } else {
            return '$' + price.toExponential(2);
        }
    }

    /**
     * Get strategy display name
     */
    getStrategyName(strategy, currentLang = 'pt') {
        const names = {
            progressive_buy: { pt: 'Compra Progressiva', en: 'Progressive Buy' },
            progressive_sell: { pt: 'Venda Progressiva', en: 'Progressive Sell' },
            balanced: { pt: 'Balanceada', en: 'Balanced' },
            stablecoin_pair: { pt: 'Par Stablecoin', en: 'Stablecoin Pair' }
        };
        return names[strategy][currentLang];
    }

    /**
     * Fetch historical price data from CoinGecko
     * Falls back to current price if token not found
     */
    async fetchHistoricalPrices(coinSymbol, days = 7) {
        try {
            // Try to find coin ID by symbol
            const searchUrl = `https://api.coingecko.com/api/v3/search?query=${coinSymbol}`;
            const searchResponse = await fetch(searchUrl);
            const searchData = await searchResponse.json();

            if (!searchData.coins || searchData.coins.length === 0) {
                console.log(`Token ${coinSymbol} not found on CoinGecko`);
                return null;
            }

            const coinId = searchData.coins[0].id;

            // Fetch market chart
            const chartUrl = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=daily`;
            const chartResponse = await fetch(chartUrl);

            if (!chartResponse.ok) {
                throw new Error('Failed to fetch chart data');
            }

            const chartData = await chartResponse.json();

            // Format data: array of {timestamp, price}
            return chartData.prices.map(([timestamp, price]) => ({
                timestamp: timestamp,
                date: new Date(timestamp),
                price: price
            }));

        } catch (error) {
            console.error('Error fetching historical prices:', error);
            return null;
        }
    }

    /**
     * Analyze price position relative to ranges
     * Returns alert level and message
     */
    analyzePricePosition(currentPrice, ranges) {
        const inShort = currentPrice >= ranges.short.min && currentPrice <= ranges.short.max;
        const inModerate = currentPrice >= ranges.moderate.min && currentPrice <= ranges.moderate.max;
        const inLong = currentPrice >= ranges.long.min && currentPrice <= ranges.long.max;

        // Calculate distance from ranges
        const distanceFromShortMin = ((currentPrice - ranges.short.min) / ranges.short.min) * 100;
        const distanceFromShortMax = ((ranges.short.max - currentPrice) / ranges.short.max) * 100;
        const distanceFromLongMin = ((currentPrice - ranges.long.min) / ranges.long.min) * 100;
        const distanceFromLongMax = ((ranges.long.max - currentPrice) / ranges.long.max) * 100;

        if (!inLong) {
            return {
                level: 'danger',
                icon: '🚨',
                message: {
                    pt: `ALERTA: Preço fora de todos os ranges! Aguarde correção ou ajuste manualmente.`,
                    en: `ALERT: Price outside all ranges! Wait for correction or adjust manually.`
                }
            };
        }

        if (!inModerate && inLong) {
            const nearEdge = Math.min(Math.abs(distanceFromLongMin), Math.abs(distanceFromLongMax)) < 5;
            if (nearEdge) {
                return {
                    level: 'warning',
                    icon: '⚠️',
                    message: {
                        pt: `Atenção: Preço próximo aos limites do range longo. Monitore para possível ajuste.`,
                        en: `Warning: Price near long range limits. Monitor for possible adjustment.`
                    }
                };
            }
        }

        if (!inShort && inModerate) {
            return {
                level: 'caution',
                icon: '⚠️',
                message: {
                    pt: `Preço saiu do range curto mas está no moderado. Considere rebalancear se busca máxima eficiência.`,
                    en: `Price exited short range but within moderate. Consider rebalancing for maximum efficiency.`
                }
            };
        }

        if (inShort) {
            return {
                level: 'safe',
                icon: '✅',
                message: {
                    pt: `Preço seguro dentro de todos os ranges. Ótimo momento para entrar ou manter posição.`,
                    en: `Price safely within all ranges. Good time to enter or maintain position.`
                }
            };
        }

        return {
            level: 'info',
            icon: '📊',
            message: {
                pt: `Preço dentro do range moderado. Boa posição para maioria das estratégias.`,
                en: `Price within moderate range. Good position for most strategies.`
            }
        };
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
