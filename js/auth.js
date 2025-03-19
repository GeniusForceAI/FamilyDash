// Authentication utilities
import config from './config.js';

export const auth = {
    // Check if user is logged in
    isLoggedIn() {
        const token = localStorage.getItem('token');
        if (!token) return false;
        
        // Check if token is expired
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expirationTime = payload.exp * 1000; // Convert to milliseconds
            return Date.now() < expirationTime;
        } catch (e) {
            console.error('Token validation error:', e);
            return false;
        }
    },

    // Check authentication and return a promise
    async checkAuth() {
        if (!this.isLoggedIn()) {
            return false;
        }
        
        try {
            // Verify token with the server
            const response = await fetch(config.getApiUrl('/api/users/me'), {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`,
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                console.error('Auth check failed:', response.status);
                return false;
            }
            
            // Store user data
            const userData = await response.json();
            localStorage.setItem('user', JSON.stringify(userData));
            return true;
        } catch (error) {
            console.error('Auth check error:', error);
            return false;
        }
    },
    
    // Get current user data
    getCurrentUser() {
        const userJson = localStorage.getItem('user');
        if (!userJson) return null;
        
        try {
            return JSON.parse(userJson);
        } catch (e) {
            console.error('Error parsing user data:', e);
            return null;
        }
    },

    // Get the current token
    getToken() {
        return localStorage.getItem('token');
    },

    // Get home path
    getHomePath() {
        return config.getPath('/');
    },

    // Perform login
    async login(email, password) {
        console.log('Login attempt for:', email);
        const formData = new URLSearchParams();
        formData.append('username', email);  // FastAPI OAuth2 expects 'username'
        formData.append('password', password);

        try {
            const response = await fetch(config.getApiUrl(config.endpoints.token), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                },
                body: formData
            });

            console.log('Login response:', response.status);
            const data = await response.json();
            console.log('Login data:', data);

            if (!response.ok) {
                throw new Error(data.detail || 'Invalid credentials');
            }

            if (!data.access_token) {
                throw new Error('No access token received');
            }

            console.log('Login successful');
            localStorage.setItem('token', data.access_token);
            return data;
        } catch (error) {
            console.error('Login error:', error);
            localStorage.removeItem('token'); // Clear any existing token
            throw error;
        }
    },

    // Register a new user (admin only)
    async register(userData) {
        const response = await this.fetchWithAuth(config.getApiUrl(config.endpoints.register), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Registration failed');
        }

        return await response.json();
    },

    // Perform logout
    logout() {
        localStorage.removeItem('token');
        // Use replaceState to clean the URL
        window.history.replaceState({}, document.title, window.location.pathname);
        window.location.replace(config.getPath('/pages/login.html'));
    },

    // Fetch with authentication
    async fetchWithAuth(url, options = {}) {
        const token = this.getToken();
        if (!token) {
            this.logout();
            throw new Error('No authentication token found');
        }

        // Add authorization header
        const headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'Content-Type': options.headers?.['Content-Type'] || 'application/json',
            'Accept': 'application/json'
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            // Handle unauthorized responses
            if (response.status === 401) {
                console.error('Unauthorized request:', { url });
                this.logout();
                throw new Error('Unauthorized');
            }

            return response;
        } catch (error) {
            console.error('Fetch error:', error);
            if (error.message === 'Unauthorized') {
                this.logout();
            }
            throw error;
        }
    }
};

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    // Clean URL parameters
    window.history.replaceState({}, document.title, window.location.pathname);
    
    // Only redirect if we're not already on the login page
    const loginPath = '/pages/login.html';
    const currentPath = window.location.pathname;
    
    if (currentPath.endsWith(loginPath)) {
        return; // Already on login page
    }
    
    if (!auth.isLoggedIn()) {
        window.location.replace(config.getPath(loginPath));
    }
});
