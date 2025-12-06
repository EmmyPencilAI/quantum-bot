// Price Chart Implementation

class QuantumChart {
    constructor() {
        this.chart = null;
        this.timeframe = '1D';
        this.init();
    }

    init() {
        this.createChart();
        this.loadChartData();
    }

    createChart() {
        const ctx = document.getElementById('priceChart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: this.generateLabels(),
                datasets: [{
                    label: 'QUBIC Price',
                    data: this.generateMockData(),
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: '#6366f1',
                    pointHoverBorderColor: '#ffffff',
                    pointHoverBorderWidth: 2
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
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(26, 30, 44, 0.95)',
                        titleColor: '#8a94a6',
                        bodyColor: '#ffffff',
                        borderColor: '#2a2f42',
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                            label: function (context) {
                                return `Price: $${context.parsed.y.toFixed(6)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(42, 47, 66, 0.5)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#8a94a6',
                            font: {
                                size: 11
                            },
                            maxTicksLimit: 8
                        }
                    },
                    y: {
                        position: 'right',
                        grid: {
                            color: 'rgba(42, 47, 66, 0.5)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#8a94a6',
                            font: {
                                size: 11
                            },
                            callback: function (value) {
                                return '$' + value.toFixed(6);
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                elements: {
                    line: {
                        cubicInterpolationMode: 'monotone'
                    }
                }
            }
        });

        // Store in global for access from main.js
        window.priceChart = this.chart;
    }

    generateLabels() {
        const now = new Date();
        const labels = [];

        switch (this.timeframe) {
            case '1D':
                // Last 24 hours in 1-hour intervals
                for (let i = 23; i >= 0; i--) {
                    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
                    labels.push(time.getHours().toString().padStart(2, '0') + ':00');
                }
                break;

            case '7D':
                // Last 7 days
                for (let i = 6; i >= 0; i--) {
                    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                    labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
                }
                break;

            case '1M':
                // Last 30 days in 1-day intervals
                for (let i = 29; i >= 0; i--) {
                    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                    labels.push(date.getDate().toString());
                }
                break;

            case '3M':
                // Last 90 days in 3-day intervals
                for (let i = 29; i >= 0; i--) {
                    const date = new Date(now.getTime() - i * 3 * 24 * 60 * 60 * 1000);
                    labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
                }
                break;

            case '1Y':
                // Last 12 months
                for (let i = 11; i >= 0; i--) {
                    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    labels.push(date.toLocaleDateString('en-US', { month: 'short' }));
                }
                break;

            case 'ALL':
                // Last 2 years in monthly intervals
                for (let i = 23; i >= 0; i--) {
                    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    labels.push(date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
                }
                break;
        }

        return labels;
    }

    generateMockData() {
        let basePrice = 0.002156;
        const volatility = 0.0001; // 10% volatility
        const data = [];

        let count = 0;
        switch (this.timeframe) {
            case '1D': count = 24; break;
            case '7D': count = 7; break;
            case '1M': count = 30; break;
            case '3M': count = 30; break;
            case '1Y': count = 12; break;
            case 'ALL': count = 24; break;
        }

        for (let i = 0; i < count; i++) {
            // Random walk with momentum
            const randomChange = (Math.random() - 0.5) * 2 * volatility;
            const trend = Math.sin(i / count * Math.PI * 2) * 0.00005; // Sinusoidal trend
            basePrice += randomChange + trend;

            // Ensure price stays in reasonable range
            basePrice = Math.max(0.0015, Math.min(0.0028, basePrice));

            // Add some spikes for interest
            if (Math.random() < 0.05) {
                basePrice *= (1 + (Math.random() - 0.5) * 0.1);
            }

            data.push(basePrice);
        }

        return data;
    }

    async loadChartData() {
        try {
            // In a real app, you would fetch data from API
            // const data = await api.getPriceHistory('QUBIC', this.timeframe);

            // For now, use mock data
            const mockData = this.generateMockData();
            const labels = this.generateLabels();

            if (this.chart) {
                this.chart.data.labels = labels;
                this.chart.data.datasets[0].data = mockData;
                this.chart.update('none');
            }
        } catch (error) {
            console.error('Error loading chart data:', error);
        }
    }

    changeTimeframe(timeframe) {
        this.timeframe = timeframe;
        this.loadChartData();

        // Update active button
        document.querySelectorAll('.chart-controls .btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.textContent === timeframe) {
                btn.classList.add('active');
            }
        });
    }

    updateLivePrice(price) {
        if (this.chart && this.timeframe === '1D') {
            const data = this.chart.data.datasets[0].data;
            data.push(price);
            data.shift();

            // Update last label
            const now = new Date();
            const lastLabel = now.getHours().toString().padStart(2, '0') + ':' +
                now.getMinutes().toString().padStart(2, '0');
            this.chart.data.labels[this.chart.data.labels.length - 1] = lastLabel;

            this.chart.update('none');
        }
    }
}

// Initialize chart when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.quantumChart = new QuantumChart();
});