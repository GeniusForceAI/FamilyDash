import { auth } from './auth.js';
import { config } from './config.js';
import { ChartComponent } from './components/Chart.js';
import { Toast } from './components/Toast.js';
import { Table } from './components/Table.js';

export class DashboardManager {
    constructor() {
        this.charts = {};
        this.toast = new Toast();
        this.table = new Table({
            id: 'recentTransactionsTable',
            formatters: {
                date: (date) => new Date(date).toLocaleDateString(),
                amount: (amount) => new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                }).format(amount)
            }
        });
    }

    async initialize() {
        if (!auth.isLoggedIn()) {
            window.location.href = config.getPath('/pages/login.html');
            return;
        }

        // Initialize theme toggle
        const themeToggle = document.getElementById('themeToggle');
        themeToggle.checked = document.body.classList.contains('dark-mode');
        themeToggle.addEventListener('change', () => {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
        });

        // Initialize charts
        this.initializeCharts();

        // Load initial data
        await this.loadDashboardData();

        // Set up auto-refresh every 5 minutes
        setInterval(() => this.loadDashboardData(), 300000);
    }

    initializeCharts() {
        // Cash Flow Overview Chart
        this.charts.cashFlow = new ChartComponent('cashFlowChart', {
            type: 'line',
            options: {
                responsive: true,
                plugins: {
                    title: { display: false },
                    legend: { position: 'bottom' }
                }
            }
        });

        // Expense Distribution Chart
        this.charts.expenseDistribution = new ChartComponent('expenseDistributionChart', {
            type: 'doughnut',
            options: {
                responsive: true,
                plugins: {
                    title: { display: false },
                    legend: { position: 'bottom' }
                }
            }
        });

        // Savings Progress Chart
        this.charts.savingsProgress = new ChartComponent('savingsProgressChart', {
            type: 'bar',
            options: {
                responsive: true,
                plugins: {
                    title: { display: false },
                    legend: { position: 'bottom' }
                }
            }
        });

        // Bills vs Income Chart
        this.charts.billsVsIncome = new ChartComponent('billsVsIncomeChart', {
            type: 'bar',
            options: {
                responsive: true,
                plugins: {
                    title: { display: false },
                    legend: { position: 'bottom' }
                }
            }
        });
    }

    async loadDashboardData() {
        try {
            const response = await auth.fetchWithAuth(`${config.apiUrl}/api/finances`);
            if (!response.ok) throw new Error('Failed to load dashboard data');
            
            const data = await response.json();
            this.updateDashboard(data);
        } catch (error) {
            this.toast.show('Error loading dashboard data', 'error');
            console.error('Dashboard data error:', error);
        }
    }

    updateDashboard(data) {
        // Update statistics cards
        document.getElementById('monthlyIncome').textContent = this.formatCurrency(data.income?.monthly || 0);
        document.getElementById('monthlyBills').textContent = this.formatCurrency(data.totalBills || 0);
        document.getElementById('monthlyExpenses').textContent = this.formatCurrency(data.totalExpenses || 0);
        document.getElementById('monthlySavings').textContent = this.formatCurrency(
            (data.income?.monthly || 0) - (data.totalBills || 0) - (data.totalExpenses || 0)
        );

        // Update charts
        this.updateCharts(data);

        // Update recent transactions table
        this.updateTransactionsTable(data.recentTransactions || []);
    }

    updateCharts(data) {
        // Cash Flow Overview
        this.charts.cashFlow.update({
            labels: data.cashFlow.map(item => item.date),
            datasets: [{
                label: 'Income',
                data: data.cashFlow.map(item => item.income),
                borderColor: '#4CAF50',
                fill: false
            }, {
                label: 'Expenses',
                data: data.cashFlow.map(item => item.expenses),
                borderColor: '#f44336',
                fill: false
            }]
        });

        // Expense Distribution
        this.charts.expenseDistribution.update({
            labels: data.expensesByCategory.map(item => item.category),
            datasets: [{
                data: data.expensesByCategory.map(item => item.amount),
                backgroundColor: [
                    '#4CAF50', '#2196F3', '#FFC107', '#f44336', '#9C27B0',
                    '#00BCD4', '#FF9800', '#795548', '#607D8B', '#E91E63'
                ]
            }]
        });

        // Savings Progress
        this.charts.savingsProgress.update({
            labels: data.savingsProgress.map(item => item.month),
            datasets: [{
                label: 'Savings',
                data: data.savingsProgress.map(item => item.amount),
                backgroundColor: '#4CAF50'
            }]
        });

        // Bills vs Income
        this.charts.billsVsIncome.update({
            labels: ['Current Month'],
            datasets: [{
                label: 'Income',
                data: [data.income?.monthly || 0],
                backgroundColor: '#4CAF50'
            }, {
                label: 'Bills',
                data: [data.totalBills || 0],
                backgroundColor: '#f44336'
            }]
        });
    }

    updateTransactionsTable(transactions) {
        this.table.update(transactions.map(transaction => ({
            date: transaction.date,
            description: transaction.description,
            type: transaction.type,
            amount: transaction.amount
        })));
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }
}
