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
            tab_new: 'Novas Listagens',
            tab_meme: 'Memecoins',
            tab_whale: 'Alertas de Baleias',
            tab_arb: 'Arbitragem',
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
            subtitle: 'Teste estratégias com dados históricos',
            filters: 'Filtros',
            pair: 'Par de Negociação',
            period: 'Período',
            period_30d: 'Últimos 30 dias',
            period_90d: 'Últimos 90 dias',
            period_180d: 'Últimos 180 dias',
            period_1y: 'Último ano',
            capital: 'Capital Inicial',
            strategy: 'Estratégia',
            strategy_safe: 'Apenas Safe Signals',
            strategy_mixed: 'Misto (Safe + Degen)',
            strategy_aggressive: 'Agressivo (Apenas Degen)',
            simulate: 'Simular',
            results: 'Resultados',
            initial: 'Capital Inicial',
            final: 'Capital Final',
            profit: 'Lucro',
            total_trades: 'Total de Trades',
            wins: 'Ganhos',
            best: 'Melhor Trade',
            worst: 'Pior Trade',
            chart_placeholder: 'Gráfico de Performance',
            disclaimer: 'Resultados passados não garantem resultados futuros'
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
            tab_new: 'New Listings',
            tab_meme: 'Memecoins',
            tab_whale: 'Whale Alerts',
            tab_arb: 'Arbitrage',
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
            subtitle: 'Test strategies with historical data',
            filters: 'Filters',
            pair: 'Trading Pair',
            period: 'Period',
            period_30d: 'Last 30 days',
            period_90d: 'Last 90 days',
            period_180d: 'Last 180 days',
            period_1y: 'Last 1 year',
            capital: 'Initial Capital',
            strategy: 'Strategy',
            strategy_safe: 'Safe Signals Only',
            strategy_mixed: 'Mixed (Safe + Degen)',
            strategy_aggressive: 'Aggressive (Degen Only)',
            simulate: 'Simulate',
            results: 'Results',
            initial: 'Initial Capital',
            final: 'Final Capital',
            profit: 'Profit',
            total_trades: 'Total Trades',
            wins: 'Wins',
            best: 'Best Trade',
            worst: 'Worst Trade',
            chart_placeholder: 'Performance Chart',
            disclaimer: 'Past performance does not guarantee future results'
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
// Mock Real-Time Updates (Demo)
// ===========================
function simulateRealTimeUpdates() {
    // This is a demo function to simulate price updates
    // In production, this would connect to a WebSocket or poll an API

    setInterval(() => {
        const prices = document.querySelectorAll('.price');
        const changes = document.querySelectorAll('.change');

        // Randomly update a few prices (just for demo effect)
        if (Math.random() > 0.7) {
            const randomIndex = Math.floor(Math.random() * prices.length);
            if (prices[randomIndex]) {
                // Add a subtle pulse effect to show update
                prices[randomIndex].style.animation = 'pulse 0.5s ease';
                setTimeout(() => {
                    prices[randomIndex].style.animation = '';
                }, 500);
            }
        }
    }, 5000); // Update every 5 seconds
}

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

    // Initialize chart after a short delay
    setTimeout(() => {
        initializeChart();
    }, 500);

    // Start real-time updates simulation (optional)
    // simulateRealTimeUpdates();
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
