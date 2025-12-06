class QuantumBotDashboard {
    constructor() {
        this.apiBaseUrl = window.location.origin + '/api';
        this.signalsLimit = 10;
        this.signalsPage = 1;
        this.init();
    }

    async init() {
        await this.loadStats();
        await this.loadSignals();
        await this.loadMarketData();
        this.setupEventListeners();
        this.startAutoRefresh();
    }

    async loadStats() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/signals/stats/summary`);
            const data = await response.json();

            if (data.success) {
                document.getElementById('totalSignals').textContent = data.data.total.toLocaleString();
                document.getElementById('accuracyRate').textContent = `${data.data.avgConfidence}%`;
                document.getElementById('activeUsers').textContent = '100+'; // Mock for now
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    async loadSignals() {
        try {
            const response = await fetch(
                `${this.apiBaseUrl}/signals?limit=${this.signalsLimit}&page=${this.signalsPage}`
            );
            const data = await response.json();

            if (data.success && data.data.length > 0) {
                this.displaySignals(data.data);
                this.signalsPage++;
            }
        } catch (error) {
            console.error('Error loading signals:', error);
            this.displayMockSignals();
        }
    }

    displaySignals(signals) {
        const container = document.getElementById('signalsContainer');

        signals.forEach(signal => {
            const signalCard = this.createSignalCard(signal);
            container.innerHTML += signalCard;
        });
    }

    createSignalCard(signal) {
        const typeClass = `signal-${signal.type.toLowerCase()}`;
        const typeIcon = signal.type === 'BUY' ? 'fa-arrow-up text-success' :
            signal.type === 'SELL' ? 'fa-arrow-down text-danger' :
                signal.type === 'ALERT' ? 'fa-exclamation text-warning' : 'fa-pause text-secondary';

        const profitPercentage = ((signal.target / signal.price - 1) * 100).toFixed(2);
        const riskPercentage = ((1 - signal.stopLoss / signal.price) * 100).toFixed(2);

        return `
            <div class="col-lg-6 col-xl-4">
                <div class="card signal-card ${typeClass}">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <h5 class="card-title mb-1">${signal.symbol}</h5>
                                <div class="d-flex align-items-center gap-2">
                                    <span class="badge ${signal.type === 'BUY' ? 'bg-success' : 'bg-danger'}">
                                        ${signal.type}
                                    </span>
                                    <span class="text-muted">${new Date(signal.timestamp).toLocaleString()}</span>
                                </div>
                            </div>
                            <i class="fas ${typeIcon} fa-2x"></i>
                        </div>
                        
                        <div class="mb-3">
                            <div class="progress mb-2" style="height: 10px;">
                                <div class="progress-bar ${signal.confidence > 70 ? 'bg-success' : signal.confidence > 50 ? 'bg-warning' : 'bg-danger'}" 
                                     style="width: ${signal.confidence}%"></div>
                            </div>
                            <div class="d-flex justify-content-between">
                                <small class="text-muted">Confidence</small>
                                <small class="fw-bold">${signal.confidence}%</small>
                            </div>
                        </div>
                        
                        <div class="row mb-3">
                            <div class="col-4">
                                <div class="text-center">
                                    <div class="text-muted small">Price</div>
                                    <div class="fw-bold">$${signal.price.toFixed(6)}</div>
                                </div>
                            </div>
                            <div class="col-4">
                                <div class="text-center">
                                    <div class="text-muted small">Target</div>
                                    <div class="fw-bold text-success">$${signal.target.toFixed(6)}</div>
                                    <small class="text-success">+${profitPercentage}%</small>
                                </div>
                            </div>
                            <div class="col-4">
                                <div class="text-center">
                                    <div class="text-muted small">Stop Loss</div>
                                    <div class="fw-bold text-danger">$${signal.stopLoss.toFixed(6)}</div>
                                    <small class="text-danger">-${riskPercentage}%</small>
                                </div>
                            </div>
                        </div>
                        
                        ${signal.metadata ? `
                            <div class="row text-center small">
                                ${signal.metadata.rsi ? `
                                    <div class="col-4">
                                        <div class="text-muted">RSI</div>
                                        <div class="fw-bold ${signal.metadata.rsi > 70 ? 'text-danger' : signal.metadata.rsi < 30 ? 'text-success' : ''}">
                                            ${signal.metadata.rsi.toFixed(1)}
                                        </div>
                                    </div>
                                ` : ''}
                                ${signal.metadata.trend ? `
                                    <div class="col-4">
                                        <div class="text-muted">Trend</div>
                                        <div class="fw-bold ${signal.metadata.trend === 'Bullish' ? 'text-success' : 'text-danger'}">
                                            ${signal.metadata.trend}
                                        </div>
                                    </div>
                                ` : ''}
                                <div class="col-4">
                                    <div class="text-muted">Source</div>
                                    <div class="fw-bold">${signal.source}</div>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    async loadMarketData() {
        try {
            // Mock data for now - replace with actual API call
            const mockData = {
                price: 0.002156,
                change24h: 5.42,
                marketCap: 21560000,
                volume24h: 1250000
            };

            document.getElementById('qubicPrice').textContent = `$${mockData.price.toFixed(6)}`;
            document.getElementById('priceChange').textContent = `${mockData.change24h > 0 ? '+' : ''}${mockData.change24h.toFixed(2)}%`;
            document.getElementById('priceChange').className = `badge ${mockData.change24h > 0 ? 'bg-success' : 'bg-danger'}`;
            document.getElementById('marketCap').textContent = `$${(mockData.marketCap / 1e6).toFixed(2)}M`;
            document.getElementById('volume24h').textContent = `$${(mockData.volume24h / 1e6).toFixed(2)}M`;

        } catch (error) {
            console.error('Error loading market data:', error);
        }
    }

    displayMockSignals() {
        const mockSignals = [
            {
                symbol: 'QUBIC/USDT',
                type: 'BUY',
                confidence: 85,
                price: 0.002156,
                target: 0.002500,
                stopLoss: 0.001900,
                timestamp: new Date(),
                source: 'Quantum AI',
                metadata: { rsi: 32.5, trend: 'Bullish' }
            },
            {
                symbol: 'BTC/USDT',
                type: 'SELL',
                confidence: 72,
                price: 42356.78,
                target: 40000.00,
                stopLoss: 44000.00,
                timestamp: new Date(Date.now() - 3600000),
                source: 'Technical Analysis',
                metadata: { rsi: 68.7, trend: 'Bearish' }
            }
        ];

        this.displaySignals(mockSignals);
    }

    setupEventListeners() {
        // Telegram bot link
        const telegramBtn = document.querySelector('a[href*="t.me"]');
        if (telegramBtn) {
            telegramBtn.addEventListener('click', (e) => {
                this.trackEvent('telegram_click');
            });
        }
    }

    startAutoRefresh() {
        // Refresh signals every 60 seconds
        setInterval(() => {
            this.loadStats();
        }, 60000);
    }

    trackEvent(eventName) {
        // Analytics tracking
        console.log(`Event: ${eventName}`);
    }
}

// Global functions for button clicks
function loadMoreSignals() {
    const dashboard = window.quantumDashboard;
    if (dashboard) {
        dashboard.loadSignals();
    }
}

function subscribeToAlerts() {
    window.open('https://t.me/quantumbroker_bot', '_blank');
    alert('Open Telegram and start the bot with /start command');
}

function testSignal() {
    fetch('/api/signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            symbol: 'QUBIC/USDT',
            type: 'BUY',
            price: 0.002156,
            confidence: 85,
            source: 'Test Signal'
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Test signal generated successfully!');
                location.reload();
            } else {
                alert('Error: ' + data.error);
            }
        })
        .catch(error => {
            alert('Error generating test signal');
            console.error(error);
        });
}

function subscribeEmail() {
    const email = document.getElementById('subscribeEmail').value;
    if (!email) {
        alert('Please enter your email address');
        return;
    }

    // Mock subscription
    alert(`Thank you! You've subscribed with: ${email}`);
    document.getElementById('subscribeEmail').value = '';
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.quantumDashboard = new QuantumBotDashboard();
});