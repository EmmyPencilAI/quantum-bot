// Main Application Script

class QuantumDashboard {
    constructor() {
        this.api = api;
        this.currentFilter = 'all';
        this.currentChartTimeframe = '1D';
        this.init();
    }

    async init() {
        // Load initial data
        await this.loadMarketData();
        await this.loadCryptoTable();
        await this.loadSignals();
        await this.loadStats();

        // Initialize chart
        this.initPriceChart();

        // Setup event listeners
        this.setupEventListeners();

        // Start auto-refresh
        this.startAutoRefresh();

        console.log('Quantum Dashboard initialized');
    }

    async loadMarketData() {
        try {
            // Load market overview
            const overview = await this.api.getMarketOverview() ||
                await this.getMockMarketOverview();

            if (overview && overview.success) {
                this.updateMarketOverview(overview.data);
            }
        } catch (error) {
            console.error('Error loading market data:', error);
        }
    }

    async loadCryptoTable() {
        try {
            const container = document.getElementById('cryptoTableBody');
            if (!container) return;

            // Show loading state
            container.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-5">
                        <div class="loading mx-auto"></div>
                        <div class="mt-2 text-muted">Loading cryptocurrency data...</div>
                    </td>
                </tr>
            `;

            // Load data
            const data = await this.api.getCryptocurrencies() ||
                await this.api.getMockCryptocurrencies();

            if (data && data.success) {
                this.renderCryptoTable(data.data);
            }
        } catch (error) {
            console.error('Error loading crypto table:', error);
            this.renderCryptoTableError();
        }
    }

    renderCryptoTable(cryptos) {
        const container = document.getElementById('cryptoTableBody');
        if (!container) return;

        container.innerHTML = '';

        cryptos.forEach((crypto, index) => {
            const change24hClass = crypto.change24h >= 0 ? 'price-up' : 'price-down';
            const change7dClass = crypto.change7d >= 0 ? 'price-up' : 'price-down';

            const signalBadge = this.getSignalBadge(crypto.signal);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="ps-4 fw-bold text-muted">${crypto.rank}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="crypto-icon me-3">
                            ${crypto.icon || '₿'}
                        </div>
                        <div>
                            <div class="fw-bold">${crypto.symbol}</div>
                            <div class="small text-muted">${crypto.name}</div>
                        </div>
                    </div>
                </td>
                <td class="text-end fw-bold">$${crypto.price.toLocaleString(undefined, { minimumFractionDigits: crypto.price < 1 ? 6 : 2 })}</td>
                <td class="text-end fw-bold ${change24hClass}">
                    ${crypto.change24h >= 0 ? '+' : ''}${crypto.change24h.toFixed(2)}%
                </td>
                <td class="text-end fw-bold ${change7dClass}">
                    ${crypto.change7d >= 0 ? '+' : ''}${crypto.change7d.toFixed(2)}%
                </td>
                <td class="text-end">$${this.formatMarketCap(crypto.marketCap)}</td>
                <td class="text-end">$${this.formatVolume(crypto.volume24h)}</td>
                <td class="text-end">${this.formatSupply(crypto.circulatingSupply)} ${crypto.symbol}</td>
                <td class="text-end pe-4">${signalBadge}</td>
            `;

            // Add click event
            row.style.cursor = 'pointer';
            row.addEventListener('click', () => this.showCryptoDetails(crypto));

            container.appendChild(row);
        });
    }

    renderCryptoTableError() {
        const container = document.getElementById('cryptoTableBody');
        if (!container) return;

        container.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-5">
                    <div class="text-danger mb-2">
                        <i class="bi bi-exclamation-triangle fs-4"></i>
                    </div>
                    <div class="text-muted">Failed to load cryptocurrency data</div>
                    <button class="btn btn-sm btn-outline-secondary mt-3" onclick="location.reload()">
                        <i class="bi bi-arrow-clockwise me-1"></i> Retry
                    </button>
                </td>
            </tr>
        `;
    }

    getSignalBadge(signal) {
        const badges = {
            'STRONG_BUY': '<span class="badge bg-success">Strong Buy</span>',
            'BUY': '<span class="badge bg-success">Buy</span>',
            'HOLD': '<span class="badge bg-secondary">Hold</span>',
            'SELL': '<span class="badge bg-danger">Sell</span>',
            'STRONG_SELL': '<span class="badge bg-danger">Strong Sell</span>',
            'ALERT': '<span class="badge bg-warning">Alert</span>'
        };

        return badges[signal] || '<span class="badge bg-secondary">-</span>';
    }

    async loadSignals() {
        try {
            const container = document.getElementById('liveSignals');
            const grid = document.getElementById('signalsGrid');

            if (!container && !grid) return;

            // Load signals
            const data = await this.api.getSignals(4) ||
                await this.api.getMockSignals();

            if (data && data.success) {
                // Update live signals sidebar
                if (container) {
                    container.innerHTML = '';
                    data.data.slice(0, 3).forEach(signal => {
                        container.appendChild(this.createSignalCard(signal));
                    });
                }

                // Update signals grid
                if (grid) {
                    grid.innerHTML = '';
                    data.data.forEach(signal => {
                        const col = document.createElement('div');
                        col.className = 'col-md-6 col-lg-4 col-xl-3 mb-4';
                        col.innerHTML = this.createSignalCardHTML(signal);
                        grid.appendChild(col);
                    });
                }
            }
        } catch (error) {
            console.error('Error loading signals:', error);
        }
    }

    createSignalCard(signal) {
        const div = document.createElement('div');
        div.className = 'signal-card mb-3 ' + signal.type.toLowerCase();
        div.innerHTML = this.createSignalCardHTML(signal);
        return div;
    }

    createSignalCardHTML(signal) {
        const typeClass = signal.type.toLowerCase();
        const profitPercentage = ((signal.target / signal.price - 1) * 100).toFixed(2);
        const riskPercentage = ((1 - signal.stopLoss / signal.price) * 100).toFixed(2);
        const confidenceLevel = signal.confidence > 80 ? 'high' : signal.confidence > 60 ? 'medium' : 'low';

        return `
            <div class="signal-header">
                <div>
                    <div class="signal-symbol">${signal.symbol}</div>
                    <div class="small text-muted">${new Date(signal.timestamp).toLocaleTimeString()}</div>
                </div>
                <span class="signal-type ${typeClass}">${signal.type}</span>
            </div>
            
            <div class="signal-price">$${signal.price.toFixed(6)}</div>
            
            <div class="signal-meta">
                <div class="signal-meta-item">
                    <span class="signal-meta-label">Target</span>
                    <span class="signal-meta-value text-success">$${signal.target.toFixed(6)}</span>
                    <small class="text-success">+${profitPercentage}%</small>
                </div>
                <div class="signal-meta-item">
                    <span class="signal-meta-label">Stop Loss</span>
                    <span class="signal-meta-value text-danger">$${signal.stopLoss.toFixed(6)}</span>
                    <small class="text-danger">-${riskPercentage}%</small>
                </div>
            </div>
            
            <div class="signal-confidence">
                <div class="confidence-bar">
                    <div class="confidence-fill ${confidenceLevel}" style="width: ${signal.confidence}%"></div>
                </div>
                <div class="d-flex justify-content-between">
                    <small class="text-muted">Confidence</small>
                    <small class="fw-bold">${signal.confidence}%</small>
                </div>
            </div>
            
            <div class="signal-actions">
                <button class="btn btn-sm btn-outline-primary" onclick="viewSignal('${signal.id}')">
                    <i class="bi bi-eye"></i>
                </button>
                <button class="btn btn-sm btn-primary" onclick="setAlert('${signal.symbol}', ${signal.price})">
                    <i class="bi bi-bell"></i>
                </button>
                <button class="btn btn-sm btn-outline-success" onclick="trade('${signal.symbol}')">
                    <i class="bi bi-arrow-right"></i>
                </button>
            </div>
        `;
    }

    async loadStats() {
        try {
            const stats = await this.api.getSignalStats();

            if (stats && stats.success) {
                this.updateStats(stats.data);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    updateStats(stats) {
        // Update sidebar stats
        const elements = {
            'signalsToday': stats.today || 24,
            'accuracyRate': `${stats.avgConfidence || 92.4}%`,
            'activeUsers': stats.activeUsers || 1245,
            'qubicPrice': `$${(stats.qubicPrice || 0.002156).toFixed(6)}`
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }

    updateMarketOverview(overview) {
        const elements = {
            'marketCap': this.formatMarketCap(overview.marketCap || 21560000),
            'volume24h': this.formatVolume(overview.volume24h || 1250000),
            'activeMiners': (overview.activeMiners || 42156).toLocaleString(),
            'aiAccuracy': `${overview.aiAccuracy || 92.4}%`
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }

    initPriceChart() {
        // Chart initialization is handled in chart.js
        // This is just a placeholder
        console.log('Price chart initialized');
    }

    setupEventListeners() {
        // Refresh button
        const refreshBtn = document.querySelector('button[onclick="refreshTable()"]');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshTable());
        }

        // Filter buttons
        const filterButtons = document.querySelectorAll('[onclick^="filterTable"]');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.getAttribute('onclick').match(/'([^']+)'/)[1];
                this.filterTable(filter);
            });
        });

        // Chart timeframe buttons
        const chartButtons = document.querySelectorAll('[onclick^="changeChartTimeframe"]');
        chartButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const timeframe = e.target.getAttribute('onclick').match(/'([^']+)'/)[1];
                this.changeChartTimeframe(timeframe);
            });
        });
    }

    async refreshTable() {
        // Clear cache and reload
        this.api.clearCache();
        await this.loadCryptoTable();

        // Show success feedback
        const btn = document.querySelector('button[onclick="refreshTable()"]');
        if (btn) {
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<i class="bi bi-check2"></i>';
            btn.disabled = true;

            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.disabled = false;
            }, 1000);
        }
    }

    filterTable(filter) {
        this.currentFilter = filter;

        // Update active button
        document.querySelectorAll('.btn-group .btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Apply filter to table
        const rows = document.querySelectorAll('#cryptoTableBody tr');
        rows.forEach(row => {
            const symbol = row.querySelector('td:nth-child(2) .fw-bold').textContent;
            const change24h = parseFloat(row.querySelector('td:nth-child(4)').textContent);

            let shouldShow = true;

            switch (filter) {
                case 'gainers':
                    shouldShow = change24h > 0;
                    break;
                case 'losers':
                    shouldShow = change24h < 0;
                    break;
                case 'qubic':
                    shouldShow = symbol === 'QUBIC';
                    break;
                case 'all':
                default:
                    shouldShow = true;
            }

            row.style.display = shouldShow ? '' : 'none';
        });
    }

    changeChartTimeframe(timeframe) {
        this.currentChartTimeframe = timeframe;

        // Update active button
        document.querySelectorAll('.chart-controls .btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.textContent === timeframe) {
                btn.classList.add('active');
            }
        });

        // Reload chart data
        this.loadChartData(timeframe);
    }

    async loadChartData(timeframe) {
        // This would fetch new chart data based on timeframe
        console.log(`Loading chart data for ${timeframe}`);

        // Update chart with new data
        if (window.priceChart) {
            // Simulate new data
            const newData = this.generateMockChartData(timeframe);
            window.priceChart.data.datasets[0].data = newData;
            window.priceChart.update();
        }
    }

    generateMockChartData(timeframe) {
        // Generate mock data based on timeframe
        const points = {
            '1D': 24,
            '7D': 7,
            '1M': 30,
            '3M': 90,
            '1Y': 365,
            'ALL': 100
        }[timeframe] || 24;

        let price = 0.002156;
        const data = [];

        for (let i = 0; i < points; i++) {
            const change = (Math.random() - 0.5) * 0.0002;
            price += change;
            price = Math.max(0.001, Math.min(0.003, price));
            data.push(price);
        }

        return data;
    }

    showCryptoDetails(crypto) {
        // Show modal with crypto details
        const modalHTML = `
            <div class="modal fade" id="cryptoModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <div class="d-flex align-items-center">
                                    <div class="crypto-icon me-3">${crypto.icon}</div>
                                    <div>
                                        <div class="fw-bold">${crypto.symbol}</div>
                                        <div class="small text-muted">${crypto.name}</div>
                                    </div>
                                </div>
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <div class="text-muted small">Current Price</div>
                                        <div class="display-6 fw-bold">$${crypto.price.toFixed(6)}</div>
                                    </div>
                                    <div class="mb-3">
                                        <div class="text-muted small">24h Change</div>
                                        <div class="h4 fw-bold ${crypto.change24h >= 0 ? 'text-success' : 'text-danger'}">
                                            ${crypto.change24h >= 0 ? '+' : ''}${crypto.change24h.toFixed(2)}%
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <div class="text-muted small">Market Cap</div>
                                        <div class="h5 fw-bold">$${this.formatMarketCap(crypto.marketCap)}</div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <div class="text-muted small">Volume (24h)</div>
                                        <div class="h5 fw-bold">$${this.formatVolume(crypto.volume24h)}</div>
                                    </div>
                                    <div class="mb-3">
                                        <div class="text-muted small">Circulating Supply</div>
                                        <div class="h5 fw-bold">${this.formatSupply(crypto.circulatingSupply)} ${crypto.symbol}</div>
                                    </div>
                                    <div class="mb-3">
                                        <div class="text-muted small">Quantum Signal</div>
                                        <div class="h5 fw-bold">${this.getSignalBadge(crypto.signal)}</div>
                                    </div>
                                </div>
                            </div>
                            <div class="mt-4">
                                <h6 class="mb-3">Quick Actions</h6>
                                <div class="d-flex gap-2">
                                    <button class="btn btn-primary" onclick="trade('${crypto.symbol}')">
                                        <i class="bi bi-arrow-right-circle me-1"></i> Trade
                                    </button>
                                    <button class="btn btn-outline-primary" onclick="setAlert('${crypto.symbol}', ${crypto.price})">
                                        <i class="bi bi-bell me-1"></i> Set Alert
                                    </button>
                                    <button class="btn btn-outline-secondary">
                                        <i class="bi bi-star me-1"></i> Add to Watchlist
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Create and show modal
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer);

        const modal = new bootstrap.Modal(document.getElementById('cryptoModal'));
        modal.show();

        // Cleanup after modal is hidden
        modalContainer.addEventListener('hidden.bs.modal', () => {
            modalContainer.remove();
        });
    }

    formatMarketCap(value) {
        if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
        if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
        if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
        return `$${value.toFixed(2)}`;
    }

    formatVolume(value) {
        if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
        if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
        if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
        return value.toFixed(1);
    }

    formatSupply(value) {
        if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
        if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
        if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
        return value.toFixed(2);
    }

    startAutoRefresh() {
        // Refresh data every 60 seconds
        setInterval(async () => {
            await this.loadMarketData();
            await this.loadStats();
        }, 60000);
    }

    getMockMarketOverview() {
        return {
            success: true,
            data: {
                marketCap: 21560000,
                volume24h: 1250000,
                activeMiners: 42156,
                aiAccuracy: 92.4,
                qubicPrice: 0.002156
            }
        };
    }
}

// Global functions for inline onclick handlers
function refreshTable() {
    if (window.quantumDashboard) {
        window.quantumDashboard.refreshTable();
    }
}

function filterTable(filter) {
    if (window.quantumDashboard) {
        window.quantumDashboard.filterTable(filter);
    }
}

function changeChartTimeframe(timeframe) {
    if (window.quantumDashboard) {
        window.quantumDashboard.changeChartTimeframe(timeframe);
    }
}

function generateTestSignal() {
    if (window.quantumDashboard && window.quantumDashboard.api) {
        window.quantumDashboard.api.createSignal({
            symbol: 'QUBIC/USDT',
            type: 'BUY',
            price: 0.002156,
            confidence: 85,
            source: 'Manual Test'
        }).then(response => {
            if (response && response.success) {
                alert('Test signal generated successfully!');
                window.quantumDashboard.loadSignals();
            }
        });
    }
}

function viewSignal(signalId) {
    console.log(`Viewing signal ${signalId}`);
    // Implement signal detail view
    alert(`Signal details for ${signalId} would open here`);
}

function setAlert(symbol, price) {
    const targetPrice = prompt(`Set alert for ${symbol}\n\nEnter target price:`, price * 1.1);
    if (targetPrice) {
        if (window.quantumDashboard && window.quantumDashboard.api) {
            window.quantumDashboard.api.setAlert({
                symbol: symbol,
                targetPrice: parseFloat(targetPrice),
                type: 'ABOVE'
            }).then(response => {
                if (response && response.success) {
                    alert(`Alert set for ${symbol} at $${targetPrice}`);
                }
            });
        }
    }
}

function trade(symbol) {
    // Open trading interface
    console.log(`Opening trade for ${symbol}`);
    window.open(`https://www.binance.com/en/trade/${symbol.replace('/', '_')}`, '_blank');
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.quantumDashboard = new QuantumDashboard();
});