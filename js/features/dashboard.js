import { auth } from '../auth.js';
import config from '../config.js';
import { ChartComponent } from '../components/Chart.js';
import { Table } from '../components/Table.js';
import { Toast } from '../components/Toast.js';

export class DashboardFeature {
    constructor() {
        this.billsData = null;
        this.expensesData = null;
        this.incomeData = null;
        this.charts = {};
        this.toast = new Toast();
        this.initializeComponents();
    }

    initializeComponents() {
        // Initialize charts
        this.charts.cashFlow = new ChartComponent('cashFlowChart');
        this.charts.expenseDistribution = new ChartComponent('expenseDistributionChart');
        this.charts.savingsProgress = new ChartComponent('savingsProgressChart');
        this.charts.billsVsIncome = new ChartComponent('billsVsIncomeChart');

        // Initialize tables
        this.recentTransactionsTable = new Table('recentTransactionsTable', {
            noDataMessage: 'No recent transactions',
            formatters: {
                amount: (value) => this.formatCurrency(value),
                date: (value) => new Date(value).toLocaleDateString(),
                type: (value) => this.capitalizeFirst(value)
            }
        });
    }

    async loadData() {
        try {
            const [billsResponse, expensesResponse, incomeResponse] = await Promise.all([
                auth.fetchWithAuth(config.getApiUrl(config.endpoints.bills)),
                auth.fetchWithAuth(config.getApiUrl(config.endpoints.expenses)),
                auth.fetchWithAuth(config.getApiUrl(config.endpoints.income))
            ]);

            if (!billsResponse.ok || !expensesResponse.ok || !incomeResponse.ok) {
                throw new Error('Failed to load data');
            }

            this.billsData = await billsResponse.json();
            this.expensesData = await expensesResponse.json();
            this.incomeData = await incomeResponse.json();

            this.renderDashboard();
        } catch (error) {
            console.error('Error loading data:', error);
            this.toast.error('Failed to load dashboard data. Please try again.');
        }
    }

    renderDashboard() {
        this.renderStatistics();
        this.renderCharts();
        this.renderRecentTransactions();
    }

    renderStatistics() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Calculate monthly totals
        const monthlyIncome = this.calculateMonthlyTotal(this.incomeData, currentMonth, currentYear);
        const monthlyBills = this.calculateMonthlyTotal(this.billsData, currentMonth, currentYear);
        const monthlyExpenses = this.calculateMonthlyTotal(this.expensesData, currentMonth, currentYear);
        const monthlySavings = monthlyIncome - monthlyBills - monthlyExpenses;

        // Update statistics cards
        document.getElementById('monthlyIncome').textContent = this.formatCurrency(monthlyIncome);
        document.getElementById('monthlyBills').textContent = this.formatCurrency(monthlyBills);
        document.getElementById('monthlyExpenses').textContent = this.formatCurrency(monthlyExpenses);
        document.getElementById('monthlySavings').textContent = this.formatCurrency(monthlySavings);
    }

    renderCharts() {
        this.renderCashFlowChart();
        this.renderExpenseDistributionChart();
        this.renderSavingsProgressChart();
        this.renderBillsVsIncomeChart();
    }

    renderCashFlowChart() {
        const months = this.getLast6Months();
        const datasets = [{
            label: 'Income',
            data: months.map(date => this.calculateMonthlyTotal(this.incomeData, date.getMonth(), date.getFullYear())),
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            fill: true
        }, {
            label: 'Bills',
            data: months.map(date => this.calculateMonthlyTotal(this.billsData, date.getMonth(), date.getFullYear())),
            borderColor: '#2196F3',
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            fill: true
        }, {
            label: 'Expenses',
            data: months.map(date => this.calculateMonthlyTotal(this.expensesData, date.getMonth(), date.getFullYear())),
            borderColor: '#FF5722',
            backgroundColor: 'rgba(255, 87, 34, 0.1)',
            fill: true
        }];

        this.charts.cashFlow.createLineChart({
            labels: months.map(date => date.toLocaleDateString('default', { month: 'short' })),
            datasets
        });
    }

    renderExpenseDistributionChart() {
        const categories = {};
        this.expensesData?.forEach(expense => {
            const category = expense.category || 'Other';
            categories[category] = (categories[category] || 0) + expense.amount;
        });

        this.charts.expenseDistribution.createDoughnutChart({
            labels: Object.keys(categories),
            datasets: [{
                data: Object.values(categories),
                backgroundColor: this.charts.expenseDistribution.getDefaultColors()
            }]
        });
    }

    renderSavingsProgressChart() {
        const months = this.getLast12Months();
        let cumulativeSavings = 0;
        const savingsData = months.map(date => {
            const monthlyIncome = this.calculateMonthlyTotal(this.incomeData, date.getMonth(), date.getFullYear());
            const monthlyBills = this.calculateMonthlyTotal(this.billsData, date.getMonth(), date.getFullYear());
            const monthlyExpenses = this.calculateMonthlyTotal(this.expensesData, date.getMonth(), date.getFullYear());
            const monthlySavings = monthlyIncome - monthlyBills - monthlyExpenses;
            cumulativeSavings += monthlySavings;
            return cumulativeSavings;
        });

        this.charts.savingsProgress.createLineChart({
            labels: months.map(date => date.toLocaleDateString('default', { month: 'short', year: '2-digit' })),
            datasets: [{
                label: 'Cumulative Savings',
                data: savingsData,
                borderColor: '#9C27B0',
                backgroundColor: 'rgba(156, 39, 176, 0.1)',
                fill: true
            }]
        });
    }

    renderBillsVsIncomeChart() {
        const currentMonth = new Date().getMonth();
        const bills = this.billsData?.filter(bill => new Date(bill.due_date).getMonth() === currentMonth) || [];
        const billsByType = {};
        
        bills.forEach(bill => {
            const type = bill.category || 'Other';
            billsByType[type] = (billsByType[type] || 0) + bill.amount;
        });

        this.charts.billsVsIncome.createBarChart({
            labels: Object.keys(billsByType),
            datasets: [{
                label: 'Bills by Type',
                data: Object.values(billsByType),
                backgroundColor: this.charts.billsVsIncome.getDefaultColors()
            }]
        });
    }

    renderRecentTransactions() {
        const allTransactions = [
            ...(this.expensesData || []).map(t => ({ ...t, type: 'expense' })),
            ...(this.billsData || []).map(t => ({ ...t, type: 'bill' })),
            ...(this.incomeData || []).map(t => ({ ...t, type: 'income' }))
        ];

        const sortedTransactions = allTransactions
            .sort((a, b) => new Date(b.date || b.due_date) - new Date(a.date || a.due_date))
            .slice(0, 10);

        this.recentTransactionsTable.render(sortedTransactions);
    }

    // Utility methods
    calculateMonthlyTotal(data, month, year) {
        return (data || []).reduce((sum, item) => {
            const date = new Date(item.date || item.due_date);
            if (date.getMonth() === month && date.getFullYear() === year) {
                return sum + (item.amount || 0);
            }
            return sum;
        }, 0);
    }

    getLast6Months() {
        return Array.from({ length: 6 }, (_, i) => {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            return date;
        }).reverse();
    }

    getLast12Months() {
        return Array.from({ length: 12 }, (_, i) => {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            return date;
        }).reverse();
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
}
