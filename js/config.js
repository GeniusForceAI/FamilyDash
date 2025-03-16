// Configuration for API endpoints
const config = {
    // Base URL for GitHub Pages deployment
    baseUrl: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? ''  // No prefix for local development
        : '/FamilyDash',  // GitHub Pages serves at /FamilyDash

    // API base URL - will be different in production vs development
    apiUrl: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:8001'  // Local FastAPI server
        : 'https://web-production-f4beb.up.railway.app',  // Railway deployment

    // API endpoints - consistent between environments
    endpoints: {
        token: '/token/',
        register: '/api/users/register/',
        finances: '/api/finances/',
        health: '/api/health/',
        bills: '/api/bills/',
        billsAccounts: '/api/bills/accounts/'
    },

    // Helper function to get full path for frontend routes
    getPath(path) {
        return `${this.baseUrl}${path}`;
    },

    // Helper function to get full API URL
    getApiUrl(endpoint) {
        return `${this.apiUrl}${endpoint}`;
    }
};

// Make config available globally and as a module
window.config = config;
export default config;
