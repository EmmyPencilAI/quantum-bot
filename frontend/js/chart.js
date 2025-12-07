// Price Chart
class QuantumChart {
    constructor() {
        this.chart = null;
        this.init();
    }

    init() {
        const ctx = document.getElementById('priceChart');
        if (!ctx) return;

        this.chart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: this.generateLabels('1D'),
                datasets: [{
                    label: 'QUBIC Price',
                    data: this.generateData('1D'),
                    borderColor: '#0d6efd',
                    backgroundColor: 'rgba(13, 110, 253, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.6)'
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.6)',
                            callback: function (value) {
                                return '$' + value.toFixed(6);
                            }
                        }
                    }
                }
            }
        });
    }

    generateLabels(timeframe) {
        const labels = [];
        const now = new Date();

        switch (timeframe) {
            case '1D':
                for (let i = 23; i >= 0; i--) {
                    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
                    labels.push(time.getHours().toString().padStart(2, '0') + ':00');
                }
                break;
            case '7D':
                for (let i = 6; i >= 0; i--) {
                    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                    labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
                }
                break;
            case '1M':
                for (let i = 29; i >= 0; i--) {
                    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                    labels.push(date.getDate().toString());
                }
                break;
        }

        return labels;
    }

    generateData(timeframe) {
        let basePrice = 0.002156;
        const data = [];
        let count = 0;

        switch (timeframe) {
            case '1D': count = 24; break;
            case '7D': count = 7; break;
            case '1M': count = 30; break;
        }

        for (let i = 0; i < count; i++) {
            const change = (Math.random() - 0.5) * 0.0002;
            basePrice += change;
            basePrice = Math.max(0.0015, Math.min(0.0028, basePrice));
            data.push(basePrice);
        }

        return data;
    }
}

// Initialize chart
document.addEventListener('DOMContentLoaded', () => {
    new QuantumChart();
});