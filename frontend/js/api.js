// API Service for Quantum Bot
class QuantumAPI {
    constructor() {
        // Use your backend URL here
        this.baseURL = 'https://quantum-bot-api.vercel.app/api';
        this.cache = new Map();
        this.cacheDuration = 30000; // 30 seconds
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
            return this.getMockData(endpoint);
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
            return { success: false, error: error.message };
        }
    }

    getMockData(endpoint) {
        // Mock data for development
        switch (endpoint) {
            case '/signals':
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
                            source: 'Quantum AI'
                        }
                    ]
                };

            case '/market/overview':
                return {
                    success: true,
                    data: {
                        marketCap: 21560000,
                        volume24h: 1250000,
                        activeMiners: 42156,
                        aiAccuracy: 92.4
                    }
                };

            default:
                return { success: false, error: 'Endpoint not found' };
        }
    }

    clearCache() {
        this.cache.clear();
    }
}

// Global instance
window.quantumAPI = new QuantumAPI();