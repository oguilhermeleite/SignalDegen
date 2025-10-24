// ===========================
// SignalDegen - Main JavaScript
// Language System + Animations + Interactions
// ===========================

// ===========================
// Language Translations
// ===========================
const translations = {
    pt: {
        nav: {
            home: 'Home',
            safe: 'Safe Signals',
            degen: 'Degen Zone',
            backtesting: 'Backtesting',
            about: 'Sobre'
        },
        hero: {
            subtitle: 'Sinais Inteligentes pra Quem Não Tem Medo',
            description: 'Análise técnica avançada + Oportunidades de alto risco em tempo real',
            btn_signals: 'Ver Sinais Agora',
            btn_learn: 'Saiba Mais',
            stat1: '500+ Sinais/Dia',
            stat2: '78% Taxa de Acerto',
            stat3: 'Tempo Real'
        },
        safe: {
            title: 'SAFE SIGNALS - Sinais Baseados em Análise Técnica Sólida'
        },
        signals: {
            strong_buy: 'COMPRA FORTE',
            buy: 'COMPRA',
            sell: 'VENDA',
            hold: 'AGUARDAR'
        },
        indicators: {
            bullish: 'Alta',
            golden_cross: 'Cruzamento Dourado',
            flat: 'Lateral',
            normal: 'Normal',
            strong_bullish: 'Alta Forte',
            bearish: 'Baixa',
            bollinger: 'Bollinger'
        },
        common: {
            score: 'Score',
            volume: 'Volume',
            updated: 'Atualizado há',
            view_analysis: 'Ver Análise',
            ago: 'atrás'
        },
        degen: {
            title: 'DEGEN ZONE - Oportunidades de Alto Risco',
            warning: 'RISCO EXTREMO - Invista apenas o que você pode perder',
            tab_gainers: 'Maiores Altas 🚀',
            tab_losers: 'Maiores Quedas 📉',
            tab_volume: 'Alto Volume 🔥',
            tab_new: 'Novas Listagens ⭐',
            new_listing: 'NOVA LISTAGEM',
            memecoin: 'MEMECOIN',
            whale: 'ALERTA DE BALEIA',
            arbitrage: 'ARBITRAGEM',
            listed: 'Listado há',
            on: 'na',
            liquidity: 'Liquidez',
            holders: 'Holders',
            contract: 'Contrato',
            verified: 'Verificado',
            honeypot: 'Honeypot',
            unknown: 'Desconhecido',
            risk_extreme: 'Risco: EXTREMO',
            mcap: 'Market Cap',
            social: 'Buzz Social',
            risk_very_high: 'Risco: MUITO ALTO',
            value: 'Valor',
            impact: 'Impacto',
            potential_selloff: 'Possível venda',
            risk_medium: 'Risco: MÉDIO',
            gap: 'Diferença',
            profit: 'Lucro Est.',
            risk_low: 'Risco: BAIXO'
        },
        backtest: {
            title: 'Simulador de Backtesting',
            subtitle: 'Teste estratégias com dados históricos reais',
            configuration: 'Configuração',
            filters: 'Filtros',
            pair: 'Par de Negociação',
            period: 'Período de Tempo',
            period_30d: 'Últimos 30 dias',
            period_90d: 'Últimos 90 dias',
            period_180d: 'Últimos 180 dias',
            period_1y: 'Último ano',
            capital: 'Capital Inicial (USD)',
            strategy: 'Estratégia',
            strategy_safe: 'Apenas Safe Signals',
            strategy_mixed: 'Misto (Safe + Degen)',
            strategy_aggressive: 'Agressivo (Apenas Degen)',
            simulate: 'Simular Backtest',
            results: 'Resultados',
            initial: 'Capital Inicial',
            final: 'Capital Final',
            profit: 'Lucro Total',
            total_trades: 'Total de Trades',
            wins: 'Ganhos',
            winrate: 'Taxa de Acerto',
            best: 'Melhor Trade',
            worst: 'Pior Trade',
            avgwin: 'Média de Ganho',
            chart_placeholder: 'Gráfico de Performance',
            disclaimer: 'Resultados passados não garantem resultados futuros'
        },
        poolAnalyzer: {
            title: 'Analisador de Pools de Liquidez',
            subtitle: 'Analise qualquer pool DeFi de qualquer DEX',
            inputLabel: 'Endereço do Pool / Par',
            inputPlaceholder: 'Ex: 8sLbNZoA1cfnvMJLPQtyqdLKZaJ5TCqxYxaWFmvYPump',
            networkLabel: 'Rede / Blockchain',
            analyzeBtn: 'Analisar Pool',
            analyzing: 'Analisando...',
            metrics: {
                price: 'Preço Atual',
                change24h: 'Mudança 24h',
                liquidity: 'Liquidez',
                volume24h: 'Volume 24h',
                marketCap: 'Market Cap',
                fdv: 'FDV'
            },
            aprs: {
                title: 'Retornos Estimados (APR)',
                daily: 'APR Diário',
                monthly: 'APR Mensal',
                annual: 'APR Anual'
            },
            ranges: {
                title: 'Ranges Estratégicos',
                subtitle: 'Sugestões de ranges de preço para provedores de liquidez',
                short: 'Curto Prazo',
                moderate: 'Moderado',
                long: 'Longo Prazo',
                min: 'Mínimo',
                max: 'Máximo'
            },
            risk: {
                label: 'Nível de Risco',
                low: 'BAIXO',
                medium: 'MÉDIO',
                high: 'ALTO',
                extreme: 'EXTREMO'
            },
            actions: {
                copy: 'Copiar Análise',
                viewDex: 'Ver no Dexscreener'
            },
            estimatedFee: 'Taxa estimada:',
            copiedToClipboard: 'Análise copiada para área de transferência!',
            errors: {
                emptyAddress: 'Por favor, insira um endereço de pool',
                notFound: 'Pool não encontrado. Verifique o endereço e a rede.',
                rateLimit: 'Muitas requisições. Aguarde um minuto e tente novamente.',
                network: 'Erro de rede. Verifique sua conexão.',
                invalid: 'Dados do pool inválidos.',
                unknown: 'Erro ao analisar o pool. Tente novamente.',
                copyFailed: 'Falha ao copiar para área de transferência'
            }
        },
        features: {
            title: 'Por Que SignalDegen?',
            realtime: 'Tempo Real',
            realtime_desc: 'Sinais instantâneos atualizados a cada segundo',
            winrate: '78% Taxa de Acerto',
            winrate_desc: 'Precisão comprovada com dados históricos',
            alerts: 'Alertas Push',
            alerts_desc: 'Seja notificado instantaneamente sobre oportunidades',
            backtesting: 'Backtesting',
            backtesting_desc: 'Teste estratégias antes de investir',
            multiexchange: 'Multi-Exchange',
            multiexchange_desc: 'Sinais de todas as principais exchanges',
            free: '100% Grátis',
            free_desc: 'Sem taxas ocultas, completamente gratuito'
        },
        disclaimer: {
            title: 'AVISO',
            text: 'SignalDegen fornece sinais educacionais. NÃO somos consultores financeiros. Trading envolve risco significativo. Nunca invista mais do que você pode perder. DYOR (Faça Sua Própria Pesquisa). Não somos responsáveis por perdas.'
        },
        footer: {
            description: 'Sinais inteligentes de cripto para traders ousados. Análise em tempo real e oportunidades de alto risco.',
            rights: 'Todos os direitos reservados.',
            navigation: 'Navegação',
            legal: 'Legal',
            terms: 'Termos de Serviço',
            privacy: 'Política de Privacidade',
            disclaimer: 'Aviso Legal',
            risk: 'Aviso de Risco',
            social: 'Social'
        },
        toast: {
            language_changed: 'Idioma alterado para Português'
        }
    },
    en: {
        nav: {
            home: 'Home',
            safe: 'Safe Signals',
            degen: 'Degen Zone',
            backtesting: 'Backtesting',
            about: 'About'
        },
        hero: {
            subtitle: 'Smart Signals for Bold Traders',
            description: 'Advanced technical analysis + High-risk opportunities in real-time',
            btn_signals: 'View Signals Now',
            btn_learn: 'Learn More',
            stat1: '500+ Signals/Day',
            stat2: '78% Win Rate',
            stat3: 'Real-Time'
        },
        safe: {
            title: 'SAFE SIGNALS - Signals Based on Solid Technical Analysis'
        },
        signals: {
            strong_buy: 'STRONG BUY',
            buy: 'BUY',
            sell: 'SELL',
            hold: 'HOLD'
        },
        indicators: {
            bullish: 'Bullish',
            golden_cross: 'Golden Cross',
            flat: 'Flat',
            normal: 'Normal',
            strong_bullish: 'Strong Bullish',
            bearish: 'Bearish',
            bollinger: 'Bollinger'
        },
        common: {
            score: 'Score',
            volume: 'Volume',
            updated: 'Updated',
            view_analysis: 'View Analysis',
            ago: 'ago'
        },
        degen: {
            title: 'DEGEN ZONE - High-Risk Opportunities',
            warning: 'EXTREME RISK - Only invest what you can afford to lose',
            tab_gainers: 'Top Gainers 🚀',
            tab_losers: 'Top Losers 📉',
            tab_volume: 'High Volume 🔥',
            tab_new: 'New Listings ⭐',
            new_listing: 'NEW LISTING',
            memecoin: 'MEMECOIN',
            whale: 'WHALE ALERT',
            arbitrage: 'ARBITRAGE',
            listed: 'Listed',
            on: 'on',
            liquidity: 'Liquidity',
            holders: 'Holders',
            contract: 'Contract',
            verified: 'Verified',
            honeypot: 'Honeypot',
            unknown: 'Unknown',
            risk_extreme: 'Risk: EXTREME',
            mcap: 'Market Cap',
            social: 'Social Buzz',
            risk_very_high: 'Risk: VERY HIGH',
            value: 'Value',
            impact: 'Impact',
            potential_selloff: 'Potential sell-off',
            risk_medium: 'Risk: MEDIUM',
            gap: 'Gap',
            profit: 'Est. Profit',
            risk_low: 'Risk: LOW'
        },
        backtest: {
            title: 'Backtesting Simulator',
            subtitle: 'Test strategies with real historical data',
            configuration: 'Configuration',
            filters: 'Filters',
            pair: 'Trading Pair',
            period: 'Time Period',
            period_30d: 'Last 30 days',
            period_90d: 'Last 90 days',
            period_180d: 'Last 180 days',
            period_1y: 'Last 1 year',
            capital: 'Initial Capital (USD)',
            strategy: 'Strategy',
            strategy_safe: 'Safe Signals Only',
            strategy_mixed: 'Mixed (Safe + Degen)',
            strategy_aggressive: 'Aggressive (Degen Only)',
            simulate: 'Simulate Backtest',
            results: 'Results',
            initial: 'Initial Capital',
            final: 'Final Capital',
            profit: 'Total Profit',
            total_trades: 'Total Trades',
            wins: 'Wins',
            winrate: 'Win Rate',
            best: 'Best Trade',
            worst: 'Worst Trade',
            avgwin: 'Avg Win',
            chart_placeholder: 'Performance Chart',
            disclaimer: 'Past performance does not guarantee future results'
        },
        poolAnalyzer: {
            title: 'Liquidity Pool Analyzer',
            subtitle: 'Analyze any DeFi pool from any DEX',
            inputLabel: 'Pool Address / Pair',
            inputPlaceholder: 'Ex: 8sLbNZoA1cfnvMJLPQtyqdLKZaJ5TCqxYxaWFmvYPump',
            networkLabel: 'Network / Blockchain',
            analyzeBtn: 'Analyze Pool',
            analyzing: 'Analyzing...',
            metrics: {
                price: 'Current Price',
                change24h: '24h Change',
                liquidity: 'Liquidity',
                volume24h: '24h Volume',
                marketCap: 'Market Cap',
                fdv: 'FDV'
            },
            aprs: {
                title: 'Estimated Returns (APR)',
                daily: 'Daily APR',
                monthly: 'Monthly APR',
                annual: 'Annual APR'
            },
            ranges: {
                title: 'Strategic Ranges',
                subtitle: 'Suggested price ranges for liquidity providers',
                short: 'Short Term',
                moderate: 'Moderate',
                long: 'Long Term',
                min: 'Min',
                max: 'Max'
            },
            risk: {
                label: 'Risk Level',
                low: 'LOW',
                medium: 'MEDIUM',
                high: 'HIGH',
                extreme: 'EXTREME'
            },
            actions: {
                copy: 'Copy Analysis',
                viewDex: 'View on Dexscreener'
            },
            estimatedFee: 'Estimated fee:',
            copiedToClipboard: 'Analysis copied to clipboard!',
            errors: {
                emptyAddress: 'Please enter a pool address',
                notFound: 'Pool not found. Check the address and network.',
                rateLimit: 'Too many requests. Wait a minute and try again.',
                network: 'Network error. Check your connection.',
                invalid: 'Invalid pool data.',
                unknown: 'Error analyzing pool. Try again.',
                copyFailed: 'Failed to copy to clipboard'
            }
        },
        features: {
            title: 'Why SignalDegen?',
            realtime: 'Real-Time',
            realtime_desc: 'Instant signals updated every second',
            winrate: '78% Win Rate',
            winrate_desc: 'Proven accuracy with historical data',
            alerts: 'Push Alerts',
            alerts_desc: 'Get notified instantly on opportunities',
            backtesting: 'Backtesting',
            backtesting_desc: 'Test strategies before investing',
            multiexchange: 'Multi-Exchange',
            multiexchange_desc: 'Signals from all major exchanges',
            free: '100% Free',
            free_desc: 'No hidden fees, completely free'
        },
        disclaimer: {
            title: 'WARNING',
            text: 'SignalDegen provides educational signals. We are NOT financial advisors. Trading involves significant risk. Never invest more than you can afford to lose. DYOR (Do Your Own Research). We are not responsible for losses.'
        },
        footer: {
            description: 'Smart crypto signals for bold traders. Real-time analysis and high-risk opportunities.',
            rights: 'All rights reserved.',
            navigation: 'Navigation',
            legal: 'Legal',
            terms: 'Terms of Service',
            privacy: 'Privacy Policy',
            disclaimer: 'Disclaimer',
            risk: 'Risk Warning',
            social: 'Social'
        },
        toast: {
            language_changed: 'Language changed to English'
        }
    }
};

// ===========================
// Language System
// ===========================
let currentLang = 'pt';

// Load saved language preference
function loadLanguagePreference() {
    const savedLang = localStorage.getItem('signaldegen_language');
    if (savedLang && (savedLang === 'pt' || savedLang === 'en')) {
        currentLang = savedLang;
    }
}

// Save language preference
function saveLanguagePreference(lang) {
    localStorage.setItem('signaldegen_language', lang);
}

// Get translation by key path (e.g., "hero.title")
function t(keyPath) {
    const keys = keyPath.split('.');
    let value = translations[currentLang];

    for (const key of keys) {
        if (value && typeof value === 'object') {
            value = value[key];
        } else {
            return keyPath; // Return key if translation not found
        }
    }

    return value || keyPath;
}

// Update all text elements with data-i18n attribute
function updateAllTexts() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = t(key);

        // Update text content
        element.textContent = translation;
    });

    // Update HTML lang attribute
    document.documentElement.lang = currentLang === 'pt' ? 'pt-BR' : 'en';
}

// Change language
function changeLang(lang) {
    if (lang !== 'pt' && lang !== 'en') return;

    currentLang = lang;
    saveLanguagePreference(lang);
    updateAllTexts();

    // Update active flag button
    document.querySelectorAll('.flag-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-lang') === lang) {
            btn.classList.add('active');
        }
    });

    // Show toast notification
    const message = lang === 'pt'
        ? 'Idioma alterado para Português'
        : 'Language changed to English';
    showToast(message);
}

// Show toast notification
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ===========================
// Mobile Menu Toggle
// ===========================
function setupMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const nav = document.getElementById('nav');

    if (hamburger && nav) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            nav.classList.toggle('active');
        });

        // Close menu when clicking nav links
        const navLinks = nav.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                nav.classList.remove('active');
            });
        });
    }
}

// ===========================
// Sticky Header
// ===========================
function setupStickyHeader() {
    const header = document.getElementById('header');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 100) {
            header.style.boxShadow = '0 4px 30px rgba(109, 40, 217, 0.5)';
        } else {
            header.style.boxShadow = '0 4px 20px rgba(109, 40, 217, 0.3)';
        }

        lastScroll = currentScroll;
    });
}

// ===========================
// Tab Navigation (Degen Zone)
// ===========================
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');

            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            const targetContent = document.getElementById(targetTab);
            if (targetContent) {
                targetContent.classList.add('active');
            }

            // Update degen zone data when switching tabs (if API is loaded)
            if (window.SignalDegenAPI && targetTab !== 'new-listings') {
                window.SignalDegenAPI.updateDegenZone(targetTab);
            }
        });
    });
}

// ===========================
// Smooth Scroll for Anchor Links
// ===========================
function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');

            // Ignore empty anchors or just "#"
            if (href === '#' || href.length <= 1) {
                e.preventDefault();
                return;
            }

            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const headerHeight = document.getElementById('header').offsetHeight;
                const targetPosition = target.offsetTop - headerHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ===========================
// Scroll Animations
// ===========================
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe signal cards and feature cards
    const cards = document.querySelectorAll('.signal-card, .feature-card, .degen-card');
    cards.forEach(card => {
        observer.observe(card);
    });
}

// ===========================
// Real-Time Updates (Connected to API)
// ===========================
// Note: Real-time updates are now handled by js/api.js
// This function is kept for backwards compatibility but is no longer active

// ===========================
// View Analysis Button Handlers
// ===========================
function setupAnalysisButtons() {
    const analysisButtons = document.querySelectorAll('.btn-analysis');

    analysisButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const card = e.target.closest('.signal-card') || e.target.closest('.degen-card');
            const pair = card.querySelector('.pair, .degen-pair').textContent;

            // In production, this would open a detailed analysis modal or page
            const message = currentLang === 'pt'
                ? `Análise detalhada de ${pair} em breve!`
                : `Detailed analysis for ${pair} coming soon!`;
            showToast(message);
        });
    });
}

// ===========================
// Backtesting Simulator
// ===========================
function setupBacktestSimulator() {
    const simulateButton = document.querySelector('.backtesting .btn-primary');

    if (simulateButton) {
        simulateButton.addEventListener('click', () => {
            // Add loading state
            simulateButton.textContent = currentLang === 'pt' ? 'Simulando...' : 'Simulating...';
            simulateButton.disabled = true;

            // Simulate processing
            setTimeout(() => {
                simulateButton.textContent = currentLang === 'pt' ? 'Simular' : 'Simulate';
                simulateButton.disabled = false;

                const message = currentLang === 'pt'
                    ? 'Simulação concluída! Resultados atualizados.'
                    : 'Simulation complete! Results updated.';
                showToast(message);

                // Add animation to results
                const results = document.querySelector('.backtest-results');
                if (results) {
                    results.style.animation = 'fadeInUp 0.6s ease';
                }
            }, 2000);
        });
    }
}

// ===========================
// Initialize Chart (Mock)
// ===========================
function initializeChart() {
    const canvas = document.getElementById('backtest-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = 300;

    // Draw simple mock chart
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 3;
    ctx.beginPath();

    // Generate mock data points
    const points = 30;
    const baseValue = 100;
    let currentValue = baseValue;

    for (let i = 0; i <= points; i++) {
        const x = (canvas.width / points) * i;
        currentValue += (Math.random() - 0.35) * 30; // Upward trend
        const y = canvas.height - ((currentValue / 200) * canvas.height);

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }

    ctx.stroke();

    // Add glow effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#8b5cf6';
    ctx.stroke();
}

// ===========================
// Initialize All Features
// ===========================
function init() {
    // Load language preference
    loadLanguagePreference();

    // Setup language switcher
    const flagButtons = document.querySelectorAll('.flag-btn');
    flagButtons.forEach(button => {
        button.addEventListener('click', () => {
            const lang = button.getAttribute('data-lang');
            changeLang(lang);
        });
    });

    // Update initial language
    updateAllTexts();

    // Setup features
    setupMobileMenu();
    setupStickyHeader();
    setupTabs();
    setupSmoothScroll();
    setupScrollAnimations();
    setupAnalysisButtons();
    setupBacktestSimulator();
    setupPoolAnalyzer();

    // Initialize chart after a short delay
    setTimeout(() => {
        initializeChart();
    }, 500);

    // Real-time updates are now handled by js/api.js automatically
}

// ===========================
// POOL ANALYZER UI LOGIC
// ===========================

let poolAnalyzer;

function setupPoolAnalyzer() {
    // Initialize PoolAnalyzer instance
    if (typeof PoolAnalyzer !== 'undefined') {
        poolAnalyzer = new PoolAnalyzer();
        console.log('Pool Analyzer initialized');
    } else {
        console.warn('PoolAnalyzer class not found');
        return;
    }

    // Get DOM elements
    const analyzeBtn = document.getElementById('analyzePoolBtn');
    const poolInput = document.getElementById('poolAddressInput');
    const networkSelect = document.getElementById('networkSelect');
    const resultsContainer = document.getElementById('poolAnalysisResults');

    if (!analyzeBtn || !poolInput || !networkSelect || !resultsContainer) {
        console.warn('Pool analyzer elements not found in DOM');
        return;
    }

    // Analyze button click handler
    analyzeBtn.addEventListener('click', async () => {
        const poolAddress = poolInput.value.trim();
        const network = networkSelect.value;

        if (!poolAddress) {
            showToast(t('poolAnalyzer.errors.emptyAddress'), 'error');
            return;
        }

        // Show loading state
        analyzeBtn.disabled = true;
        analyzeBtn.classList.add('loading');
        resultsContainer.style.display = 'none';

        try {
            // Analyze pool
            const result = await poolAnalyzer.analyzePool(network, poolAddress);

            if (!result.success) {
                throw new Error(result.error || t('poolAnalyzer.errors.unknown'));
            }

            // Display results
            displayPoolResults(result);
            resultsContainer.style.display = 'block';

            // Scroll to results
            resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

        } catch (error) {
            console.error('Pool analysis error:', error);
            showToast(error.message || t('poolAnalyzer.errors.unknown'), 'error');
        } finally {
            // Reset button state
            analyzeBtn.disabled = false;
            analyzeBtn.classList.remove('loading');
        }
    });

    // Quick example buttons
    const quickExamples = document.querySelectorAll('.quick-example');
    quickExamples.forEach(example => {
        example.addEventListener('click', () => {
            const address = example.dataset.address;
            const network = example.dataset.network;

            if (address) poolInput.value = address;
            if (network) networkSelect.value = network;
        });
    });

    // Enter key to analyze
    poolInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            analyzeBtn.click();
        }
    });
}

function displayPoolResults(result) {
    const { poolData, aprs, ranges, risk, feeTier } = result;

    // Update pool pair name
    const pairNameEl = document.getElementById('poolPairName');
    if (pairNameEl) {
        pairNameEl.textContent = `${poolData.baseToken.symbol} / ${poolData.quoteToken.symbol}`;
    }

    // Update DEX info
    const dexInfoEl = document.getElementById('poolDexInfo');
    if (dexInfoEl) {
        dexInfoEl.textContent = `${poolData.dexId.toUpperCase()} • ${poolData.chainId}`;
    }

    // Update risk badge
    updateRiskBadge(risk);

    // Update metrics
    updatePoolMetrics(poolData);

    // Update APRs
    updateAPRs(aprs, feeTier);

    // Update ranges
    updateRanges(ranges, poolData.priceNative);

    // Update action buttons
    const dexscreenerBtn = document.getElementById('viewOnDexscreener');
    if (dexscreenerBtn && poolData.url) {
        dexscreenerBtn.href = poolData.url;
    }

    // Copy analysis button
    const copyBtn = document.getElementById('copyAnalysis');
    if (copyBtn) {
        copyBtn.onclick = () => copyPoolAnalysis(poolData, aprs, ranges, risk);
    }
}

function updateRiskBadge(risk) {
    const badgeEl = document.getElementById('riskBadge');
    const reasonsEl = document.getElementById('riskReasons');

    if (badgeEl) {
        badgeEl.className = `risk-badge ${risk.level.toLowerCase()}`;
        badgeEl.textContent = `⚠️ ${t('poolAnalyzer.risk.' + risk.level.toLowerCase())}`;
    }

    if (reasonsEl && risk.reasons.length > 0) {
        reasonsEl.innerHTML = '<ul>' +
            risk.reasons.map(reason => `<li>${reason}</li>`).join('') +
            '</ul>';
    }
}

function updatePoolMetrics(poolData) {
    // Current Price
    const priceEl = document.getElementById('metricPrice');
    if (priceEl) {
        priceEl.textContent = formatPoolPrice(poolData.priceUsd);
    }

    // 24h Change
    const changeEl = document.getElementById('metricChange');
    if (changeEl) {
        const change = poolData.priceChange.h24;
        changeEl.className = `metric-value ${change >= 0 ? 'positive' : 'negative'}`;
        changeEl.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
    }

    // Liquidity
    const liquidityEl = document.getElementById('metricLiquidity');
    if (liquidityEl) {
        liquidityEl.textContent = formatCurrency(poolData.liquidity.usd);
    }

    // 24h Volume
    const volumeEl = document.getElementById('metricVolume');
    if (volumeEl) {
        volumeEl.textContent = formatCurrency(poolData.volume.h24);
    }

    // Market Cap
    const mcapEl = document.getElementById('metricMcap');
    if (mcapEl) {
        mcapEl.textContent = poolData.marketCap > 0
            ? formatCurrency(poolData.marketCap)
            : 'N/A';
    }

    // FDV
    const fdvEl = document.getElementById('metricFdv');
    if (fdvEl) {
        fdvEl.textContent = poolData.fdv > 0
            ? formatCurrency(poolData.fdv)
            : 'N/A';
    }
}

function updateAPRs(aprs, feeTier) {
    // Daily APR
    const dailyEl = document.getElementById('aprDaily');
    if (dailyEl) {
        dailyEl.textContent = aprs.daily.toFixed(2) + '%';
    }

    // Monthly APR
    const monthlyEl = document.getElementById('aprMonthly');
    if (monthlyEl) {
        monthlyEl.textContent = aprs.monthly.toFixed(2) + '%';
    }

    // Annual APR
    const annualEl = document.getElementById('aprAnnual');
    if (annualEl) {
        annualEl.textContent = aprs.annual.toFixed(2) + '%';
    }

    // Fee tier note
    const feeNoteEls = document.querySelectorAll('.apr-estimate');
    feeNoteEls.forEach(el => {
        el.textContent = t('poolAnalyzer.estimatedFee') + ` ${feeTier}%`;
    });
}

function updateRanges(ranges, currentPrice) {
    // Short Range
    const shortMinEl = document.getElementById('shortMin');
    const shortMaxEl = document.getElementById('shortMax');
    const shortPercentEl = document.getElementById('shortPercent');

    if (shortMinEl) shortMinEl.textContent = formatPoolPrice(ranges.short.min);
    if (shortMaxEl) shortMaxEl.textContent = formatPoolPrice(ranges.short.max);
    if (shortPercentEl) shortPercentEl.textContent = `±${ranges.short.percent.toFixed(1)}%`;

    // Moderate Range
    const modMinEl = document.getElementById('moderateMin');
    const modMaxEl = document.getElementById('moderateMax');
    const modPercentEl = document.getElementById('moderatePercent');

    if (modMinEl) modMinEl.textContent = formatPoolPrice(ranges.moderate.min);
    if (modMaxEl) modMaxEl.textContent = formatPoolPrice(ranges.moderate.max);
    if (modPercentEl) modPercentEl.textContent = `±${ranges.moderate.percent.toFixed(1)}%`;

    // Long Range
    const longMinEl = document.getElementById('longMin');
    const longMaxEl = document.getElementById('longMax');
    const longPercentEl = document.getElementById('longPercent');

    if (longMinEl) longMinEl.textContent = formatPoolPrice(ranges.long.min);
    if (longMaxEl) longMaxEl.textContent = formatPoolPrice(ranges.long.max);
    if (longPercentEl) longPercentEl.textContent = `±${ranges.long.percent.toFixed(1)}%`;
}

function formatPoolPrice(price) {
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

function formatCurrency(value) {
    if (value >= 1e9) {
        return '$' + (value / 1e9).toFixed(2) + 'B';
    } else if (value >= 1e6) {
        return '$' + (value / 1e6).toFixed(2) + 'M';
    } else if (value >= 1e3) {
        return '$' + (value / 1e3).toFixed(2) + 'K';
    } else {
        return '$' + value.toFixed(2);
    }
}

function copyPoolAnalysis(poolData, aprs, ranges, risk) {
    const text = `
🔍 Pool Analysis: ${poolData.baseToken.symbol}/${poolData.quoteToken.symbol}

💰 Current Price: ${formatPoolPrice(poolData.priceUsd)}
📊 24h Change: ${poolData.priceChange.h24.toFixed(2)}%
💧 Liquidity: ${formatCurrency(poolData.liquidity.usd)}
📈 24h Volume: ${formatCurrency(poolData.volume.h24)}

⚡ Estimated APRs:
• Daily: ${aprs.daily.toFixed(2)}%
• Monthly: ${aprs.monthly.toFixed(2)}%
• Annual: ${aprs.annual.toFixed(2)}%

🎯 Strategic Ranges:
• Short (±${ranges.short.percent.toFixed(1)}%): ${formatPoolPrice(ranges.short.min)} - ${formatPoolPrice(ranges.short.max)}
• Moderate (±${ranges.moderate.percent.toFixed(1)}%): ${formatPoolPrice(ranges.moderate.min)} - ${formatPoolPrice(ranges.moderate.max)}
• Long (±${ranges.long.percent.toFixed(1)}%): ${formatPoolPrice(ranges.long.min)} - ${formatPoolPrice(ranges.long.max)}

⚠️ Risk Level: ${risk.level}

📍 DEX: ${poolData.dexId.toUpperCase()} on ${poolData.chainId}
🔗 ${poolData.url || ''}

Generated by SignalDegen Pool Analyzer
    `.trim();

    navigator.clipboard.writeText(text).then(() => {
        showToast(t('poolAnalyzer.copiedToClipboard'), 'success');
    }).catch(err => {
        console.error('Copy failed:', err);
        showToast(t('poolAnalyzer.errors.copyFailed'), 'error');
    });
}

// ===========================
// Run on DOM Load
// ===========================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// ===========================
// Handle Window Resize
// ===========================
window.addEventListener('resize', () => {
    // Redraw chart on resize
    const canvas = document.getElementById('backtest-chart');
    if (canvas) {
        initializeChart();
    }
});

// Export functions for potential external use
window.SignalDegen = {
    changeLang,
    showToast,
    t
};
