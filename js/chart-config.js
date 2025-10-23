// ===========================
// CHART.JS CONFIGURATION
// Performance chart for backtesting
// ===========================

let performanceChartInstance = null;

function renderPerformanceChart(portfolioHistory, initialCapital) {
    const canvas = document.getElementById('performanceChart');

    if (!canvas) {
        console.error('Performance chart canvas not found');
        return;
    }

    const ctx = canvas.getContext('2d');

    // Destroy previous chart instance if exists
    if (performanceChartInstance) {
        performanceChartInstance.destroy();
        performanceChartInstance = null;
    }

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(168, 85, 247, 0.4)');
    gradient.addColorStop(0.5, 'rgba(236, 72, 153, 0.2)');
    gradient.addColorStop(1, 'rgba(251, 146, 60, 0.1)');

    // Prepare data
    const labels = portfolioHistory.map(p => {
        const date = new Date(p.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const values = portfolioHistory.map(p => p.value);

    // Add initial capital as first point
    labels.unshift('Start');
    values.unshift(initialCapital);

    // Chart configuration
    performanceChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Portfolio Value',
                data: values,
                borderColor: '#a855f7',
                backgroundColor: gradient,
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointBackgroundColor: '#ec4899',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverBackgroundColor: '#ec4899',
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(26, 11, 46, 0.95)',
                    titleColor: '#ec4899',
                    bodyColor: '#e0e7ff',
                    borderColor: '#a855f7',
                    borderWidth: 2,
                    padding: 16,
                    displayColors: false,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        title: function(context) {
                            return context[0].label;
                        },
                        label: function(context) {
                            const value = context.parsed.y;
                            const profit = value - initialCapital;
                            const profitPercent = ((profit / initialCapital) * 100).toFixed(2);
                            return [
                                `Value: $${value.toFixed(2)}`,
                                `Profit: $${profit.toFixed(2)} (${profitPercent}%)`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(168, 85, 247, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#a5b4fc',
                        font: {
                            size: 11
                        },
                        maxTicksLimit: 10
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(168, 85, 247, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#a5b4fc',
                        font: {
                            size: 11
                        },
                        callback: function(value) {
                            return '$' + value.toFixed(0);
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            animation: {
                duration: 2000,
                easing: 'easeInOutQuart'
            }
        }
    });

    return performanceChartInstance;
}

function destroyPerformanceChart() {
    if (performanceChartInstance) {
        performanceChartInstance.destroy();
        performanceChartInstance = null;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        renderPerformanceChart,
        destroyPerformanceChart
    };
}
