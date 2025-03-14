// Configuration for API endpoints
const config = {
  // API base URL - will be different in production vs development
  apiUrl: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8000/api'
    : 'https://baker-finances-backend.up.railway.app/api'
};

// Export the configuration
if (typeof module !== 'undefined' && module.exports) {
  module.exports = config;
}
