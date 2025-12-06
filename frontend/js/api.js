class QuantumAPI {
    constructor() {
        // Auto-detect API URL based on environment
        this.baseURL = this.getApiUrl();
        this.cache = new Map();
        this.cacheDuration = 30000; // 30 seconds

        console.log(`API Base URL: ${this.baseURL}`);
    }

    getApiUrl() {
        // Check if we're in development
        if (window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1') {
            return 'http://localhost:3000/api';
        }

        // Check for environment variable (set during Vercel build)
        if (window.API_URL) {
            return window.API_URL;
        }

        // Default production URL (your backend Vercel URL)
        return 'https://quantum-bot-api.vercel.app/api';
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
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                mode: 'cors', // Important for cross-origin requests
                credentials: 'omit' // Change to 'include' if using cookies
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
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

            // Try fallback URL if main API fails
            if (this.baseURL.includes('vercel.app')) {
                console.log('Trying fallback API URL...');
                this.baseURL = 'https://quantum-bot-backup-api.vercel.app/api';
                return this.get(endpoint, false); // Retry without cache
            }

            return null;
        }
    }

    async post(endpoint, data) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                mode: 'cors',
                credentials: 'omit',
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API Post Error (${endpoint}):`, error);
            return null;
        }
    }
}