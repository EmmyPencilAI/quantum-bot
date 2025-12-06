import axios from 'axios';
import { logger } from '../utils/logger';

export class MarketDataService {
    private coingeckoApi: string;
    private finnhubApi: string;
    private alphaVantageApi: string;

    constructor() {
        this.coingeckoApi = process.env.COINGECKO_API_URL || 'https://api.coingecko.com/api/v3';
        this.finnhubApi = 'https://finnhub.io/api/v1';
        this.alphaVantageApi = 'https://www.alphavantage.co/query';
    }

    async getMarketData(): Promise<any[]> {
        try {
            // Try Coingecko first
            const coingeckoData = await this.getCoingeckoData();
            if (coingeckoData && coingeckoData.length > 0) {
                return coingeckoData;
            }

            // Fallback to Finnhub
            const finnhubData = await this.getFinnhubData();
            if (finnhubData && finnhubData.length > 0) {
                return finnhubData;
            }

            // Final fallback: mock data
            return this.getMockData();

        } catch (error) {
            logger.error('Error fetching market data:', error);
            return this.getMockData();
        }
    }

    private async getCoingeckoData(): Promise<any[]> {
        try {
            const response = await axios.get(`${this.coingeckoApi}/coins/markets`, {
                params: {
                    vs_currency: 'usd',
                    ids: 'bitcoin,ethereum,solana,ripple',
                    order: 'market_cap_desc',
                    per_page: 10,
                    page: 1,
                    sparkline: false
                },
                timeout: 5000
            });

            return response.data.map((coin: any) => ({
                symbol: `${coin.symbol.toUpperCase()}/USD`,
                name: coin.name,
                price: coin.current_price,
                change24h: coin.price_change_percentage_24h,
                volume: coin.total_volume,
                marketCap: coin.market_cap,
                lastUpdated: coin.last_updated
            }));

        } catch (error) {
            logger.warn('Coingecko API failed, using fallback');
            return [];
        }
    }

    private async getFinnhubData(): Promise<any[]> {
        try {
            const apiKey = process.env.FINNHUB_API_KEY;
            if (!apiKey) {
                return [];
            }

            const symbols = ['BTC', 'ETH', 'SOL', 'XRP'];
            const data = [];

            for (const symbol of symbols) {
                try {
                    const response = await axios.get(`${this.finnhubApi}/quote`, {
                        params: { symbol: `BINANCE:${symbol}USDT` },
                        headers: { 'X-Finnhub-Token': apiKey },
                        timeout: 3000
                    });

                    data.push({
                        symbol: `${symbol}/USD`,
                        price: response.data.c,
                        change24h: response.data.dp,
                        volume: response.data.v * response.data.c,
                        lastUpdated: new Date()
                    });

                } catch (error) {
                    logger.warn(`Failed to fetch ${symbol} from Finnhub`);
                }
            }

            return data;

        } catch (error) {
            logger.warn('Finnhub API failed');
            return [];
        }
    }

    async getSymbolData(symbol: string): Promise<any> {
        try {
            // Clean symbol format
            const cleanSymbol = symbol.replace('/', '').replace('USDT', '');

            // Try multiple sources
            const sources = [
                () => this.getSymbolFromCoingecko(cleanSymbol),
                () => this.getSymbolFromFinnhub(cleanSymbol),
                () => this.getSymbolFromAlphaVantage(cleanSymbol)
            ];

            for (const source of sources) {
                try {
                    const data = await source();
                    if (data) return data;
                } catch (error) {
                    continue;
                }
            }

            // Return mock data if all sources fail
            return this.getMockSymbolData(symbol);

        } catch (error) {
            logger.error(`Error fetching data for ${symbol}:`, error);
            return this.getMockSymbolData(symbol);
        }
    }

    private async getSymbolFromCoingecko(symbol: string): Promise<any> {
        try {
            const response = await axios.get(`${this.coingeckoApi}/coins/${symbol.toLowerCase()}`);
            const coin = response.data;

            return {
                symbol: `${symbol.toUpperCase()}/USD`,
                price: coin.market_data.current_price.usd,
                change24h: coin.market_data.price_change_percentage_24h,
                volume: coin.market_data.total_volume.usd,
                marketCap: coin.market_data.market_cap.usd,
                high24h: coin.market_data.high_24h.usd,
                low24h: coin.market_data.low_24h.usd
            };
        } catch (error) {
            throw new Error('Coingecko symbol fetch failed');
        }
    }

    private async getSymbolFromFinnhub(symbol: string): Promise<any> {
        try {
            const apiKey = process.env.FINNHUB_API_KEY;
            if (!apiKey) throw new Error('No API key');

            const response = await axios.get(`${this.finnhubApi}/quote`, {
                params: { symbol: `BINANCE:${symbol}USDT` },
                headers: { 'X-Finnhub-Token': apiKey }
            });

            return {
                symbol: `${symbol}/USD`,
                price: response.data.c,
                change24h: response.data.dp,
                volume: response.data.v * response.data.c,
                open: response.data.o,
                high: response.data.h,
                low: response.data.l,
                previousClose: response.data.pc
            };
        } catch (error) {
            throw new Error('Finnhub symbol fetch failed');
        }
    }

    private async getSymbolFromAlphaVantage(symbol: string): Promise<any> {
        try {
            const apiKey = process.env.ALPHA_VANTAGE_KEY;
            if (!apiKey) throw new Error('No API key');

            const response = await axios.get(this.alphaVantageApi, {
                params: {
                    function: 'DIGITAL_CURRENCY_DAILY',
                    symbol: symbol,
                    market: 'USD',
                    apikey: apiKey
                }
            });

            const data = response.data['Time Series (Digital Currency Daily)'];
            const latestDate = Object.keys(data)[0];
            const latestData = data[latestDate];

            return {
                symbol: `${symbol}/USD`,
                price: parseFloat(latestData['4a. close (USD)']),
                open: parseFloat(latestData['1a. open (USD)']),
                high: parseFloat(latestData['2a. high (USD)']),
                low: parseFloat(latestData['3a. low (USD)']),
                volume: parseFloat(latestData['5. volume'])
            };
        } catch (error) {
            throw new Error('Alpha Vantage symbol fetch failed');
        }
    }

    private getMockData(): any[] {
        return [
            {
                symbol: 'QUBIC/USDT',
                price: 0.002156,
                change24h: 5.42,
                volume: 1250000,
                marketCap: 21560000,
                trend: 'Bullish'
            },
            {
                symbol: 'BTC/USDT',
                price: 42356.78,
                change24h: 2.15,
                volume: 28500000000,
                marketCap: 830000000000,
                trend: 'Bullish'
            },
            {
                symbol: 'ETH/USDT',
                price: 2289.45,
                change24h: 1.89,
                volume: 12500000000,
                marketCap: 275000000000,
                trend: 'Neutral'
            },
            {
                symbol: 'SOL/USDT',
                price: 98.67,
                change24h: -0.45,
                volume: 3500000000,
                marketCap: 42000000000,
                trend: 'Bearish'
            }
        ];
    }

    private getMockSymbolData(symbol: string): any {
        const mockPrices: Record<string, any> = {
            'QUBIC/USDT': { price: 0.002156, change24h: 5.42, volume: 1250000 },
            'BTC/USDT': { price: 42356.78, change24h: 2.15, volume: 28500000000 },
            'ETH/USDT': { price: 2289.45, change24h: 1.89, volume: 12500000000 },
            'SOL/USDT': { price: 98.67, change24h: -0.45, volume: 3500000000 },
            'XRP/USDT': { price: 0.6234, change24h: 0.78, volume: 2500000000 }
        };

        const defaultData = { price: 100, change24h: 0, volume: 1000000 };
        const data = mockPrices[symbol] || defaultData;

        return {
            symbol,
            ...data,
            marketCap: data.price * 1000000000,
            high24h: data.price * 1.05,
            low24h: data.price * 0.95,
            lastUpdated: new Date()
        };
    }

    async getQubicNetworkStats(): Promise<any> {
        // Mock Qubic network stats
        return {
            networkHashrate: '15.6 PH/s',
            activeMiners: 42156,
            difficulty: 1256892345,
            lastBlock: 1245678,
            avgBlockTime: '60s',
            transactions24h: 124567,
            totalSupply: 1000000000,
            circulatingSupply: 850000000
        };
    }
}