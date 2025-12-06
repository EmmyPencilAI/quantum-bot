// Dashboard-specific JavaScript

class DashboardManager {
    constructor() {
        this.api = api;
        this.init();
    }

    async init() {
        await this.loadDashboardData();
        this.initCharts();
        this.setupAutoRefresh();
        this.updateLastUpdated();
    }

    async loadDashboardData() {
        try {
            // Load signals for table
            const signals = await this.api.getSignals(10) ||
                await this.api.getMockSignals();

            if (signals && signals.success) {
                this.renderSignalsTable(signals.data);
            }

            // Load stats
            const stats = await this.api.getSignalStats();
            if (stats && stats.success) {
                this.updateDashboardStats(stats.data);
            }

        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    renderSignalsTable(signals) {
        const container = document.getElementById('dashboardSignals');
        if (!container) return;

        container.innerHTML = '';

        signals.forEach(signal => {
            const row = document.createElement('tr');
            const typeClass = signal.type === 'BUY' ? 'text-success' :
                signal.type === 'SELL' ? 'text-danger' : 'text-warning';

            const profitPercentage = ((signal.target / signal.price - 1) * 100).toFixed(2);
            const confidenceLevel = signal.confidence > 80 ? 'high' : signal.confidence > 60 ? 'medium' : 'low';

            row.innerHTML = `
                <td class="ps-4">
                    <div class="small text-muted">${new Date(signal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div class="smaller text-muted">${new Date(signal.timestamp).toLocaleDateString()}</div>
                </td>
                <td>
                    <div class="fw-bold">${signal.symbol}</div>
                </td>
                <td>
                    <span class="badge ${signal.type === 'BUY' ? 'bg-success' : 'bg-danger'}">
                        ${signal.type}
                    </span>
                </td>
                <td class="text-end fw-bold">$${signal.price.toFixed(6)}</td>
                <td class="text-end text-success fw-bold">$${signal.target.toFixed(6)}</td>
                <td class="text-end text-danger fw-bold">$${signal.stopLoss.toFixed(6)}</td>
                <td class="text-end">
                    <div class="d-flex align-items-center justify-content-end">
                        <div class="progress progress-thin me-2" style="width: 60px;">
                            <div class="progress-bar bg-${confidenceLevel}" style="width: ${signal.confidence}%"></div>
                        </div>
                        <span class="fw-bold">${signal.confidence}%</span>
                    </div>
                </td>
                <td class="text-end pe-4">
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="viewSignal('${signal.id}')">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-outline-success" onclick="copySignal('${signal.id}')">
                            <i class="bi bi-clipboard"></i>
                        </button>
                    </div>
                </td>
            `;

            container.appendChild(row);
        });
    }

    updateDashboardStats(stats) {
        const elements = {
            'totalSignals': stats.total || 1245,
            'dashboardAccuracy': `${stats.avgConfidence || 92.4}%`,
            'dashboardPrice': `$${(stats.qubicPrice || 0.002156).toFixed(6)}`,
            'dashboardUsers': stats.activeUsers || 1245
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }

    initCharts() {
        // Performance Chart
        const performanceCtx = document.getElementById('performanceChart');
        if (performanceCtx) {
            new Chart(performanceCtx.getContext('2d'), {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                    datasets: [
                        {
                            label: 'Signals Generated',
                            data: [45, 52, 48, 61, 58, 63, 70, 75, 82, 78, 85, 92],
                            borderColor: '#6366f1',
                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: 'Accuracy %',
                            data: [85, 87, 86, 88, 89, 90, 91, 92, 92, 93, 94, 95],
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            fill: true,
                            tension: 0.4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                color: '#8a94a6'
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                color: 'rgba(42, 47, 66, 0.5)'
                            },
                            ticks: {
                                color: '#8a94a6'
                            }
                        },
                        y: {
                            grid: {
                                color: 'rgba(42, 47, 66, 0.5)'
                            },
                            ticks: {
                                color: '#8a94a6'
                            }
                        }
                    }
                }
            });
        }

        // Distribution Chart
        const distributionCtx = document.getElementById('distributionChart');
        if (distributionCtx) {
            new Chart(distributionCtx.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['Buy Signals', 'Sell Signals', 'Hold Signals', 'Alerts'],
                    datasets: [{
                        data: [65, 20, 10, 5],
                        backgroundColor: [
                            '#10b981',
                            '#ef4444',
                            '#6b7280',
                            '#f59e0b'
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: '#8a94a6',
                                padding: 20
                            }
                        }
                    }
                }
            });
        }
    }

    setupAutoRefresh() {
        // Refresh data every 30 seconds
        setInterval(() => {
            this.loadDashboardData();
            this.updateLastUpdated();
        }, 30000);
    }

    updateLastUpdated() {
        const element = document.getElementById('lastUpdated');
        if (element) {
            const now = new Date();
            element.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
    }
}

// Global functions
function refreshAllData() {
    if (window.dashboardManager) {
        window.dashboardManager.loadDashboardData();

        // Show feedback
        const btn = document.querySelector('[onclick="refreshAllData()"]');
        if (btn) {
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<i class="bi bi-check2 me-2"></i>Refreshed';
            btn.disabled = true;

            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.disabled = false;
            }, 2000);
        }
    }
}

function exportData() {
    // Implement data export
    alert('Data export feature coming soon!');

    // For now, simulate export
    const data = {
        timestamp: new Date().toISOString(),
        type: 'dashboard_export',
        data: 'Export functionality will be implemented soon.'
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `quantum-bot-export-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

function copySignal(signalId) {
    // Copy signal details to clipboard
    navigator.clipboard.writeText(`Signal ID: ${signalId}\nCopied from Quantum Bot Dashboard`).then(() => {
        // Show success feedback
        const event = new Event('signalCopied');
        window.dispatchEvent(event);

        alert('Signal details copied to clipboard!');
    });
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardManager = new DashboardManager();
});