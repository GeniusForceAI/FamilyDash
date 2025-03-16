import { auth } from './auth.js';
import config from './config.js';

export class PaymentsManager {
    constructor() {
        this.paymentsData = null;
        this.charts = {};
        
        // Bind methods
        this.handleThemeChange = this.handleThemeChange.bind(this);
    }

    async initialize() {
        await this.loadData();
        this.setupEventListeners();
        this.renderDashboard();
        
        // Listen for theme changes
        document.addEventListener('themeChanged', this.handleThemeChange);
    }

    handleThemeChange() {
        // Re-render charts with new theme colors
        this.renderCharts();
    }

    async loadData() {
        try {
            const response = await auth.fetchWithAuth(config.getApiUrl(config.endpoints.payments));
            if (!response.ok) {
                throw new Error('Failed to load payments data');
            }
            this.paymentsData = await response.json();
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Failed to load payments data. Please try again.');
        }
    }

    setupEventListeners() {
        const addPaymentBtn = document.getElementById('addPaymentBtn');
        if (addPaymentBtn) {
            addPaymentBtn.addEventListener('click', () => {
                const modal = document.getElementById('paymentModal');
                if (modal) modal.style.display = 'block';
            });
        }

        const paymentForm = document.getElementById('paymentForm');
        if (paymentForm) {
            paymentForm.addEventListener('submit', this.handlePaymentSubmit.bind(this));
        }
    }

    renderDashboard() {
        this.renderPaymentsTable();
        this.renderStatistics();
        this.renderCharts();
    }

    renderPaymentsTable() {
        const tbody = document.getElementById('paymentsTableBody');
        if (!tbody || !this.paymentsData?.length) {
            if (tbody) tbody.innerHTML = '<tr><td colspan="5" class="no-data">No payments found</td></tr>';
            return;
        }

        tbody.innerHTML = this.paymentsData
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(payment => `
                <tr>
                    <td>${new Date(payment.date).toLocaleDateString()}</td>
                    <td>${payment.description}</td>
                    <td>${this.capitalizeFirst(payment.category)}</td>
                    <td>${this.formatCurrency(payment.amount)}</td>
                    <td>
                        <button class="action-button" onclick="paymentsManager.editPayment('${payment.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-button" onclick="paymentsManager.deletePayment('${payment.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
    }

    renderStatistics() {
        if (!this.paymentsData?.length) return;

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const monthlyPayments = this.paymentsData.filter(payment => {
            const paymentDate = new Date(payment.date);
            return paymentDate.getMonth() === currentMonth && 
                   paymentDate.getFullYear() === currentYear;
        });

        const totalPayments = monthlyPayments.reduce((sum, payment) => sum + payment.amount, 0);
        const avgPayment = totalPayments / monthlyPayments.length || 0;
        const largestPayment = Math.max(...monthlyPayments.map(p => p.amount), 0);

        document.getElementById('totalMonthlyPayments').textContent = this.formatCurrency(totalPayments);
        document.getElementById('averagePayment').textContent = this.formatCurrency(avgPayment);
        document.getElementById('largestPayment').textContent = this.formatCurrency(largestPayment);

        // Category breakdown
        const categoryBreakdown = monthlyPayments.reduce((acc, payment) => {
            acc[payment.category] = (acc[payment.category] || 0) + payment.amount;
            return acc;
        }, {});

        const breakdownHtml = Object.entries(categoryBreakdown)
            .sort(([,a], [,b]) => b - a)
            .map(([category, amount]) => `
                <div class="category-item">
                    <span>${this.capitalizeFirst(category)}</span>
                    <span>${this.formatCurrency(amount)}</span>
                    <div class="progress-bar">
                        <div class="progress" style="width: ${(amount / totalPayments * 100).toFixed(1)}%"></div>
                    </div>
                </div>
            `).join('');

        const breakdownElement = document.getElementById('categoryBreakdown');
        if (breakdownElement) {
            breakdownElement.innerHTML = breakdownHtml || '<div class="no-data">No data available</div>';
        }
    }

    renderCharts() {
        // Add chart rendering logic here when needed
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    showError(message) {
        const errorToast = document.createElement('div');
        errorToast.className = 'error-toast';
        errorToast.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(errorToast);
        setTimeout(() => errorToast.remove(), 5000);
    }
}

// Initialize the payments manager
const paymentsManager = new PaymentsManager();
document.addEventListener('DOMContentLoaded', () => paymentsManager.initialize());
window.paymentsManager = paymentsManager;
