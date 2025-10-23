// ===========================
// BACKTESTING UI CONTROLLER
// Handles user interactions and display
// ===========================

// Format currency
function formatCurrency(value) {
    return '$' + value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Format percentage
function formatPercent(value) {
    return value.toFixed(2) + '%';
}

// Format date
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

// Animate number counting
function animateValue(element, start, end, duration = 1500) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }

        // Format based on element content
        if (element.classList.contains('mono')) {
            if (element.textContent.includes('$')) {
                element.textContent = formatCurrency(current);
            } else if (element.textContent.includes('%')) {
                element.textContent = formatPercent(current);
            } else {
                element.textContent = Math.round(current);
            }
        }
    }, 16);
}

// Show loading state
function showLoading(step) {
    document.getElementById('backtestEmpty').style.display = 'none';
    document.getElementById('backtestContent').style.display = 'none';
    document.getElementById('backtestError').style.display = 'none';
    document.getElementById('backtestLoading').style.display = 'flex';
    document.getElementById('loadingStep').textContent = step;
}

// Hide loading state
function hideLoading() {
    document.getElementById('backtestLoading').style.display = 'none';
}

// Show error
function showError(message) {
    hideLoading();
    document.getElementById('backtestEmpty').style.display = 'none';
    document.getElementById('backtestContent').style.display = 'none';
    document.getElementById('backtestError').style.display = 'flex';
    document.getElementById('errorMessage').textContent = message;
}

// Show results
function showResults() {
    hideLoading();
    document.getElementById('backtestEmpty').style.display = 'none';
    document.getElementById('backtestError').style.display = 'none';
    document.getElementById('backtestContent').style.display = 'block';
}

// Update stats display
function updateStats(results) {
    // Initial Capital
    document.getElementById('statInitial').textContent = formatCurrency(results.initialCapital);

    // Final Capital
    const finalElement = document.getElementById('statFinal');
    finalElement.textContent = formatCurrency(results.finalCapital);
    finalElement.className = 'stat-value mono ' + (results.totalProfit >= 0 ? 'profit' : 'loss');

    // Total Profit
    const profitElement = document.getElementById('statProfit');
    const profitSign = results.totalProfit >= 0 ? '+' : '';
    profitElement.textContent = profitSign + formatCurrency(results.totalProfit) +
        ' (' + profitSign + formatPercent(results.totalProfitPercent) + ')';
    profitElement.className = 'stat-value mono ' + (results.totalProfit >= 0 ? 'profit' : 'loss');

    // Total Trades
    document.getElementById('statTrades').textContent = results.totalTrades;

    // Win Rate
    document.getElementById('statWinRate').textContent = formatPercent(results.winRate);
    document.getElementById('statWinLoss').textContent =
        `${results.wins} wins / ${results.losses} losses`;

    // Best Trade
    const bestElement = document.getElementById('statBest');
    bestElement.textContent = formatCurrency(results.bestTrade);
    bestElement.className = 'stat-value mono ' + (results.bestTrade >= 0 ? 'profit' : 'loss');

    // Worst Trade
    const worstElement = document.getElementById('statWorst');
    worstElement.textContent = formatCurrency(results.worstTrade);
    worstElement.className = 'stat-value mono ' + (results.worstTrade >= 0 ? 'profit' : 'loss');

    // Avg Win
    const avgWinElement = document.getElementById('statAvgWin');
    avgWinElement.textContent = formatCurrency(results.avgWin);
    avgWinElement.className = 'stat-value mono ' + (results.avgWin >= 0 ? 'profit' : 'loss');
}

// Render trade history
function renderTradeHistory(trades) {
    const tradesList = document.getElementById('tradesList');
    const tradesCount = document.getElementById('tradesCount');

    tradesCount.textContent = `${trades.length} ${trades.length === 1 ? 'trade' : 'trades'}`;
    tradesList.innerHTML = '';

    trades.forEach((trade, index) => {
        const tradeElement = document.createElement('div');
        tradeElement.className = `trade-item ${trade.result.toLowerCase()}`;
        tradeElement.style.animationDelay = `${index * 0.05}s`;

        const profitSign = trade.profit >= 0 ? '+' : '';

        tradeElement.innerHTML = `
            <div class="trade-header">
                <span class="trade-number">#${index + 1}</span>
                <span class="trade-result">${trade.result}</span>
                <span class="trade-profit">${profitSign}${formatCurrency(trade.profit)} (${profitSign}${formatPercent(trade.profitPercent)})</span>
            </div>
            <div class="trade-details">
                <div>
                    <span>Entry:</span>
                    <span>${formatCurrency(trade.entryPrice)} on ${formatDate(trade.entryDate)}</span>
                </div>
                <div>
                    <span>Exit:</span>
                    <span>${formatCurrency(trade.exitPrice)} on ${formatDate(trade.exitDate)}</span>
                </div>
                <div>
                    <span>Signal:</span>
                    <span>${trade.entrySignal} → ${trade.exitSignal}</span>
                </div>
            </div>
        `;

        tradesList.appendChild(tradeElement);
    });
}

// Main backtest execution
async function executeBacktest() {
    // Get form values
    const pair = document.getElementById('backtestPair').value;
    const days = parseInt(document.getElementById('backtestPeriod').value);
    const capital = parseFloat(document.getElementById('backtestCapital').value);
    const strategy = document.getElementById('backtestStrategy').value;

    // Validate inputs
    if (!pair || !days || !capital || capital < 100 || capital > 100000) {
        showError('Please check your input values. Capital must be between $100 and $100,000.');
        return;
    }

    // Disable button
    const btn = document.getElementById('simulateBtn');
    btn.disabled = true;
    btn.querySelector('.btn-text').style.display = 'none';
    btn.querySelector('.btn-spinner').style.display = 'inline-block';

    try {
        // Step 1: Show loading
        showLoading('Fetching historical data...');
        await new Promise(resolve => setTimeout(resolve, 500));

        // Step 2: Calculate signals
        showLoading('Calculating RSI indicators...');
        await new Promise(resolve => setTimeout(resolve, 300));

        // Step 3: Simulate
        showLoading('Simulating trades...');

        const config = {
            pair: pair,
            days: days,
            capital: capital,
            strategy: strategy
        };

        // Run backtest
        const results = await runBacktest(config);

        // Step 4: Generate results
        showLoading('Generating results...');
        await new Promise(resolve => setTimeout(resolve, 300));

        // Update UI
        updateStats(results);
        renderPerformanceChart(results.portfolioHistory, results.initialCapital);
        renderTradeHistory(results.trades);

        // Show results
        showResults();

    } catch (error) {
        console.error('Backtest error:', error);
        showError(error.message || 'An error occurred during backtesting. Please try again.');
    } finally {
        // Re-enable button
        btn.disabled = false;
        btn.querySelector('.btn-text').style.display = 'inline';
        btn.querySelector('.btn-spinner').style.display = 'none';
    }
}

// Initialize backtesting
function initializeBacktesting() {
    const simulateBtn = document.getElementById('simulateBtn');

    if (simulateBtn) {
        simulateBtn.addEventListener('click', executeBacktest);
    }

    // Capital input validation
    const capitalInput = document.getElementById('backtestCapital');
    if (capitalInput) {
        capitalInput.addEventListener('input', function() {
            let value = parseFloat(this.value);
            if (value < 100) this.value = 100;
            if (value > 100000) this.value = 100000;
        });
    }

    console.log('Backtesting initialized');
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeBacktesting);
} else {
    initializeBacktesting();
}
