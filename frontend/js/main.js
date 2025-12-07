// Main Application
class QuantumBotApp {
    constructor() {
        this.api = window.quantumAPI;
        this.init();
    }

    async init() {
        console.log('🚀 Quantum Bot App Initializing...');

        // Load data
        await this.loadMarketData();
        await this.loadCryptoTable();
        await this.loadSignals();
        await this.loadStats();

        // Initialize components
        this.initPriceChart();
        this.setupEventListeners();
        this.startLiveUpdates();

        console.log('✅ Quantum Bot App Ready!');
    }

    async loadMarketData() {
        try {
            const data = await this.api.get('/market/overview');
            if (data.success) {
                this.updateMarketData(data.data);
            }
        } catch (error) {
            console.error('Error loading market data:', error);
        }
    }

    async loadCryptoTable() {
        const container = document.getElementById('cryptoTableBody');
        if (!container) return;

        // Mock data for CoinMarketCap table
        const cryptoData = [
            { rank: 1, symbol: 'QUBIC', name: 'Qubic', price: 0.002156, change24h: 5.42, change7d: 18.7, marketCap: 21560000, volume: 1250000, supply: '10B', signal: 'STRONG_BUY' },
            { rank: 2, symbol: 'BTC', name: 'Bitcoin', price: 42356.78, change24h: 2.15, change7d: -1.42, marketCap: 830000000000, volume: 28500000000, supply: '19.6M', signal: 'BUY' },
            { rank: 3, symbol: 'ETH', name: 'Ethereum', price: 2289.45, change24h: 1.89, change7d: -0.45, marketCap: 275000000000, volume: 12500000000, supply: '120M', signal: 'HOLD' },
            { rank: 4, symbol: 'SOL', name: 'Solana', price: 98.67, change24h: -0.45, change7d: 8.23, marketCap: 42000000000, volume: 3500000000, supply: '425M', signal: 'BUY' },
            { rank: 5, symbol: 'XRP', name: 'Ripple', price: 0.6234, change24h: 0.78, change7d: -2.15, marketCap: 33500000000, volume: 2500000000, supply: '54B', signal: 'SELL' },
            { rank: 6, symbol: 'ADA', name: 'Cardano', price: 0.4567, change24h: 1.23, change7d: 3.45, marketCap: 16000000000, volume: 450000000, supply: '35B', signal: 'BUY' },
            { rank: 7, symbol: 'AVAX', name: 'Avalanche', price: 24.56, change24h: 3.45, change7d: 12.34, marketCap: 8900000000, volume: 450000000, supply: '360M', signal: 'STRONG_BUY' },
            { rank: 8, symbol: 'DOT', name: 'Polkadot', price: 6.78, change24h: -1.23, change7d: 5.67, marketCap: 8900000000, volume: 280000000, supply: '1.3B', signal: 'ALERT' }
        ];

        this.renderCryptoTable(cryptoData);
    }

    renderCryptoTable(data) {
        const container = document.getElementById('cryptoTableBody');
        if (!container) return;

        container.innerHTML = data.map(crypto => `
            <tr class="crypto-row">
                <td class="ps-4 fw-bold text-muted">${crypto.rank}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="crypto-icon me-3">
                            ${crypto.symbol.charAt(0)}
                        </div>
                        <div>
                            <div class="fw-bold">${crypto.symbol}</div>
                            <div class="small text-muted">${crypto.name}</div>
                        </div>
                    </div>
                </td>
                <td class="text-end fw-bold">$${this.formatPrice(crypto.price)}</td>
                <td class="text-end fw-bold ${crypto.change24h >= 0 ? 'price-up' : 'price-down'}">
                    ${crypto.change24h >= 0 ? '+' : ''}${crypto.change24h.toFixed(2)}%
                </td>
                <td class="text-end fw-bold ${crypto.change7d >= 0 ? 'price-up' : 'price-down'}">
                    ${crypto.change7d >= 0 ? '+' : ''}${crypto.change7d.toFixed(2)}%
                </td>
                <td class="text-end">$${this.formatMarketCap(crypto.marketCap)}</td>
                <td class="text-end">$${this.formatVolume(crypto.volume)}</td>
                <td class="text-end">${crypto.supply} ${crypto.symbol}</td>
                <td class="text-end pe-4">
                    ${this.getSignalBadge(crypto.signal)}
                </td>
            </tr>
        `).join('');
    }

    async loadSignals() {
        try {
            const data = await this.api.get('/signals');
            if (data.success) {
                this.renderLiveSignals(data.data.slice(0, 3));
                this.renderSignalsGrid(data.data);
            }
        } catch (error) {
            console.error('Error loading signals:', error);
        }
    }

    renderLiveSignals(signals) {
        const container = document.getElementById('liveSignals');
        if (!container) return;

        container.innerHTML = signals.map(signal => `
            <div class="signal-card ${signal.type.toLowerCase()} mb-3">
                <div class="signal-header">
                    <div>
                        <div class="signal-symbol">${signal.symbol}</div>
                        <div class="small text-muted">${new Date(signal.timestamp).toLocaleTimeString()}</div>
                    </div>
                    <span class="signal-type ${signal.type.toLowerCase()}">${signal.type}</span>
                </div>
                <div class="signal-price">$${signal.price.toFixed(6)}</div>
                <div class="small text-muted">Confidence: ${signal.confidence}%</div>
            </div>
        `).join('');
    }

    renderSignalsGrid(signals) {
        const container = document.getElementById('signalsGrid');
        if (!container) return;

        container.innerHTML = signals.map(signal => `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="signal-card ${signal.type.toLowerCase()} h-100">
                    <div class="signal-header">
                        <div>
                            <div class="signal-symbol">${signal.symbol}</div>
                            <div class="small text-muted">${new Date(signal.timestamp).toLocaleString()}</div>
                        </div>
                        <span class="signal-type ${signal.type.toLowerCase()}">${signal.type}</span>
                    </div>
                    <div class="signal-price">$${signal.price.toFixed(6)}</div>
                    <div class="signal-meta">
                        <div class="signal-meta-item">
                            <span class="signal-meta-label">Target</span>
                            <span class="signal-meta-value text-success">$${signal.target.toFixed(6)}</span>
                        </div>
                        <div class="signal-meta-item">
                            <span class="signal-meta-label">Stop Loss</span>
                            <span class="signal-meta-value text-danger">$${signal.stopLoss.toFixed(6)}</span>
                        </div>
                    </div>
                    <div class="confidence-bar">
                        <div class="confidence-fill ${signal.confidence > 80 ? 'high' : signal.confidence > 60 ? 'medium' : 'low'}" 
                             style="width: ${signal.confidence}%"></div>
                    </div>
                    <div class="d-flex justify-content-between mt-3">
                        <button class="btn btn-sm btn-outline-primary" onclick="viewSignal(${signal.id})">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="setAlert('${signal.symbol}')">
                            <i class="bi bi-bell"></i> Alert
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async loadStats() {
        // Update sidebar stats
        const elements = {
            'signalsToday': '24',
            'accuracyRate': '92.4%',
            'activeUsers': '1,245',
            'qubicPriceSide': '$0.002156',
            'marketCap': '$21.56M',
            'volume24h': '$1.25M',
            'activeMiners': '42,156',
            'aiAccuracy': '92.4%'
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }

    updateMarketData(data) {
        // Update market data
        if (data.marketCap) {
            document.getElementById('marketCap').textContent = `$${(data.marketCap / 1e6).toFixed(2)}M`;
        }
        if (data.volume24h) {
            document.getElementById('volume24h').textContent = `$${(data.volume24h / 1e6).toFixed(2)}M`;
        }
    }

    initPriceChart() {
        // Chart initialization
        console.log('Price chart initialized');
    }

    setupEventListeners() {
        // Setup event listeners
        console.log('Event listeners setup');
    }

    startLiveUpdates() {
        // Start live updates
        setInterval(() => {
            this.updateLiveData();
        }, 30000); // Every 30 seconds
    }

    updateLiveData() {
        // Update live data
        const now = new Date();
        document.getElementById('liveUpdate').textContent =
            `Last updated: ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    formatPrice(price) {
        if (price < 0.01) return price.toFixed(6);
        if (price < 1) return price.toFixed(4);
        if (price < 1000) return price.toFixed(2);
        return price.toLocaleString(undefined, { minimumFractionDigits: 2 });
    }

    formatMarketCap(cap) {
        if (cap >= 1e9) return `${(cap / 1e9).toFixed(2)}B`;
        if (cap >= 1e6) return `${(cap / 1e6).toFixed(2)}M`;
        if (cap >= 1e3) return `${(cap / 1e3).toFixed(2)}K`;
        return cap.toFixed(2);
    }

    formatVolume(volume) {
        if (volume >= 1e9) return `${(volume / 1e9).toFixed(1)}B`;
        if (volume >= 1e6) return `${(volume / 1e6).toFixed(1)}M`;
        if (volume >= 1e3) return `${(volume / 1e3).toFixed(1)}K`;
        return volume.toFixed(1);
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
}

// Global functions
function refreshTable() {
    if (window.quantumApp) {
        window.quantumApp.loadCryptoTable();
    }
}

function filterTable(filter) {
    console.log('Filter:', filter);
    // Implement filtering
}

function changeChartTimeframe(timeframe) {
    console.log('Timeframe:', timeframe);
    // Update chart
}

function generateTestSignal() {
    alert('Test signal generation feature');
}

function viewSignal(id) {
    alert(`Viewing signal #${id}`);
}

function setAlert(symbol) {
    alert(`Setting alert for ${symbol}`);
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    window.quantumApp = new QuantumBotApp();
});