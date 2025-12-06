// API Configuration for different environments
const CONFIG = {
    development: {
        API_URL: 'http://localhost:3000/api',
        SOCKET_URL: 'ws://localhost:3000'
    },
    production: {
        API_URL: 'https://quantum-bot-api.vercel.app/api',
        SOCKET_URL: 'wss://quantum-bot-api.vercel.app'
    }
};

// Auto-detect environment
const isProduction = window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1';

export const API_URL = isProduction ? CONFIG.production.API_URL : CONFIG.development.API_URL;
export const SOCKET_URL = isProduction ? CONFIG.production.SOCKET_URL : CONFIG.development.SOCKET_URL;