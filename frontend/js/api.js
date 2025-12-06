// API Service for Quantum Bot

class QuantumAPI {
    constructor() {
        this.baseURL = window.location.origin + '/api';
        this.cache = new Map();
        this.cacheDuration = 60000; // 1 minute
    }

    async get(endpoint, useCache = true) {
        const cacheKey = `GET:${endpoint}`;

        if (useCache && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheDuration) {
                return cached.data;
            }
        }

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`);

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();

            if (useCache) {
                this.cache.set(cacheKey, {
                    data: data,
                    timestamp: Date.now()
                });
            }

            return data;
        } catch (error) {
            console.error(`API Fetch Error (${endpoint}):`, error);
            return null;
        }
    }

    async post(endpoint, data) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API Post Error (${endpoint}):`, error);
            return null;
        }
    }

    // Cryptocurrency Data
    async getCryptocurrencies(limit = 50, start = 1) {
        return this.get(`/cryptocurrencies?limit=${limit}&start=${start}`);
    }

    async getCryptocurrency(symbol) {
        return this.get(`/cryptocurrency/${symbol}`);
    }

    // Trading Signals
    async getSignals(limit = 20, page = 1, type = null) {
        let endpoint = `/signals?limit=${limit}&page=${page}`;
        if (type) endpoint += `&type=${type}`;
        return this.get(endpoint);
    }

    async getSignalStats() {
        return this.get('/signals/stats/summary');
    }

    async createSignal(signalData) {
        return this.post('/signals', signalData);
    }

    // Market Data
    async getMarketOverview() {
        return this.get('/market/overview');
    }

    async getQubicStats() {
        return this.get('/qubic/stats');
    }

    async getPriceHistory(symbol, timeframe = '1D') {
        return this.get(`/price-history/${symbol}?timeframe=${timeframe}`);
    }

    // User Data
    async getUserData() {
        return this.get('/user/profile');
    }

    async getUserPortfolio() {
        return this.get('/user/portfolio');
    }

    async setAlert(alertData) {
        return this.post('/alerts', alertData);
    }

    // Telegram
    async getTelegramStats() {
        return this.get('/telegram/stats');
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
    }

    // Mock data for development
    async getMockCryptocurrencies() {
        return {
            success: true,
            data: [
                {
                    rank: 1,
                    symbol: 'QUBIC',
                    name: 'Qubic',
                    price: 0.002156,
                    change24h: 5.42,
                    change7d: 18.7,
                    marketCap: 21560000,
                    volume24h: 1250000,
                    circulatingSupply: 10000000000,
                    signal: 'STRONG_BUY',
                    icon: '⚡'
                },
                {
                    rank: 2,
                    symbol: 'BTC',
                    name: 'Bitcoin',
                    price: 42356.78,
                    change24h: 2.15,
                    change7d: -1.42,
                    marketCap: 830000000000,
                    volume24h: 28500000000,
                    circulatingSupply: 19600000,
                    signal: 'BUY',
                    icon: '₿'
                },
                {
                    rank: 3,
                    symbol: 'ETH',
                    name: 'Ethereum',
                    price: 2289.45,
                    change24h: 1.89,
                    change7d: -0.45,
                    marketCap: 275000000000,
                    volume24h: 12500000000,
                    circulatingSupply: 120000000,
                    signal: 'HOLD',
                    icon: 'Ξ'
                },
                {
                    rank: 4,
                    symbol: 'SOL',
                    name: 'Solana',
                    price: 98.67,
                    change24h: -0.45,
                    change7d: 8.23,
                    marketCap: 42000000000,
                    volume24h: 3500000000,
                    circulatingSupply: 425000000,
                    signal: 'BUY',
                    icon: '◎'
                },
                {
                    rank: 5,
                    symbol: 'XRP',
                    name: 'Ripple',
                    price: 0.6234,
                    change24h: 0.78,
                    change7d: -2.15,
                    marketCap: 33500000000,
                    volume24h: 2500000000,
                    circulatingSupply: 54000000000,
                    signal: 'SELL',
                    icon: 'X'
                },
                {
                    rank: 6,
                    symbol: 'ADA',
                    name: 'Cardano',
                    price: 0.4567,
                    change24h: 1.23,
                    change7d: 3.45,
                    marketCap: 16000000000,
                    volume24h: 450000000,
                    circulatingSupply: 35000000000,
                    signal: 'BUY',
                    icon: 'A'
                },
                {
                    rank: 7,
                    symbol: 'DOT',
                    name: 'Polkadot',
                    price: 6.78,
                    change24h: -1.23,
                    change7d: 5.67,
                    marketCap: 8900000000,
                    volume24h: 280000000,
                    circulatingSupply: 1300000000,
                    signal: 'ALERT',
                    icon: '●'
                },
                {
                    rank: 8,
                    symbol: 'AVAX',
                    name: 'Avalanche',
                    price: 24.56,
                    change24h: 3.45,
                    change7d: 12.34,
                    marketCap: 8900000000,
                    volume24h: 450000000,
                    circulatingSupply: 360000000,
                    signal: 'STRONG_BUY',
                    icon: '❄️'
                }
            ]
        };
    }

    async getMockSignals() {
        return {
            success: true,
            data: [
                {
                    id: 1,
                    symbol: 'QUBIC/USDT',
                    type: 'BUY',
                    confidence: 92,
                    price: 0.002156,
                    target: 0.002500,
                    stopLoss: 0.001900,
                    timestamp: new Date().toISOString(),
                    source: 'Quantum AI',
                    metadata: {
                        rsi: 32.5,
                        macd: -0.00015,
                        volume: 1250000,
                        trend: 'Bullish',
                        marketCap: 21560000,
                        change24h: 5.42
                    }
                },
                {
                    id: 2,
                    symbol: 'SOL/USDT',
                    type: 'BUY',
                    confidence: 85,
                    price: 98.67,
                    target: 115.00,
                    stopLoss: 88.00,
                    timestamp: new Date(Date.now() - 3600000).toISOString(),
                    source: 'Technical Analysis',
                    metadata: {
                        rsi: 45.2,
                        macd: 0.0234,
                        volume: 3500000000,
                        trend: 'Bullish',
                        marketCap: 42000000000,
                        change24h: -0.45
                    }
                },
                {
                    id: 3,
                    symbol: 'BTC/USDT',
                    type: 'SELL',
                    confidence: 78,
                    price: 42356.78,
                    target: 40000.00,
                    stopLoss: 44000.00,
                    timestamp: new Date(Date.now() - 7200000).toISOString(),
                    source: 'Market Sentiment',
                    metadata: {
                        rsi: 68.7,
                        macd: -125.45,
                        volume: 28500000000,
                        trend: 'Bearish',
                        marketCap: 830000000000,
                        change24h: 2.15
                    }
                },
                {
                    id: 4,
                    symbol: 'ETH/USDT',
                    type: 'HOLD',
                    confidence: 65,
                    price: 2289.45,
                    target: 2400.00,
                    stopLoss: 2150.00,
                    timestamp: new Date(Date.now() - 10800000).toISOString(),
                    source: 'AI Analysis',
                    metadata: {
                        rsi: 52.3,
                        macd: 12.34,
                        volume: 12500000000,
                        trend: 'Neutral',
                        marketCap: 275000000000,
                        change24h: 1.89
                    }
                }
            ]
        };
    }
}

// Global API instance
const api = new QuantumAPI();