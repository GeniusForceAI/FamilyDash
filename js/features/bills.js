import { auth } from '../auth.js';
import config from '../config.js';
import { Modal } from '../components/Modal.js';
import { ChartComponent } from '../components/Chart.js';
import { Table } from '../components/Table.js';
import { Toast } from '../components/Toast.js';

export class BillsFeature {
    constructor() {
        this.billsData = null;
        this.accountsData = null;
        this.charts = {};
        this.toast = new Toast();
        this.initializeComponents();
    }

    initializeComponents() {
        // Initialize modals
        this.billModal = new Modal('billModal', {
            onSave: (formData) => this.handleSubmit(formData, 'bill'),
            onClose: () => this.loadData()
        });

        this.accountModal = new Modal('accountModal', {
            onSave: (formData) => this.handleSubmit(formData, 'account'),
            onClose: () => this.loadData()
        });

        // Initialize tables
        this.billsTable = new Table('billsTableBody', {
            noDataMessage: 'No bills found',
            rowClassName: (bill) => this.getBillStatusClass(bill),
            formatters: {
                amount: (value) => this.formatCurrency(value),
                due_date: (value) => new Date(value).toLocaleDateString()
            },
            actions: [
                { icon: 'edit', handler: 'billsManager.editBill' },
                { icon: 'trash', handler: 'billsManager.deleteBill' }
            ]
        });

        this.accountsTable = new Table('accountsTableBody', {
            noDataMessage: 'No accounts found',
            formatters: {
                balance: (value) => this.formatCurrency(value),
                type: (value) => this.capitalizeFirst(value)
            },
            actions: [
                { icon: 'edit', handler: 'billsManager.editAccount' },
                { icon: 'trash', handler: 'billsManager.deleteAccount' }
            ]
        });

        // Initialize charts
        this.charts.billsByCategory = new ChartComponent('billsByCategoryChart');
        this.charts.billsTimeline = new ChartComponent('billsTimelineChart');
        this.charts.accountDistribution = new ChartComponent('accountDistributionChart');
    }

    async loadData() {
        try {
            const [billsResponse, accountsResponse] = await Promise.all([
                auth.fetchWithAuth(config.getApiUrl(config.endpoints.bills)),
                auth.fetchWithAuth(config.getApiUrl(config.endpoints.billsAccounts))
            ]);

            if (!billsResponse.ok || !accountsResponse.ok) {
                throw new Error('Failed to load data');
            }

            this.billsData = await billsResponse.json();
            this.accountsData = await accountsResponse.json();
            
            this.renderDashboard();
        } catch (error) {
            console.error('Error loading data:', error);
            this.toast.error('Failed to load bills data. Please try again.');
        }
    }

    renderDashboard() {
        this.renderStatistics();
        this.renderTables();
        this.renderCharts();
    }

    renderStatistics() {
        const now = new Date();
        const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const bills = this.billsData?.filter(bill => !bill.is_subscription) || [];
        const subscriptions = this.billsData?.filter(bill => bill.is_subscription) || [];

        const dueThisWeek = bills.reduce((sum, bill) => {
            const dueDate = new Date(bill.due_date);
            return dueDate >= now && dueDate <= weekEnd ? sum + bill.amount : sum;
        }, 0);

        const dueThisMonth = bills.reduce((sum, bill) => {
            const dueDate = new Date(bill.due_date);
            return dueDate >= now && dueDate <= monthEnd ? sum + bill.amount : sum;
        }, 0);

        const totalBills = bills.reduce((sum, bill) => sum + bill.amount, 0);
        const subscriptionTotal = subscriptions.reduce((sum, sub) => sum + sub.amount, 0);

        document.getElementById('totalBills').textContent = this.formatCurrency(totalBills);
        document.getElementById('dueThisWeek').textContent = this.formatCurrency(dueThisWeek);
        document.getElementById('dueThisMonth').textContent = this.formatCurrency(dueThisMonth);
        document.getElementById('subscriptionTotal').textContent = this.formatCurrency(subscriptionTotal);
    }

    renderTables() {
        const bills = this.billsData?.filter(bill => !bill.is_subscription) || [];
        const subscriptions = this.billsData?.filter(bill => bill.is_subscription) || [];
        
        this.billsTable.render(bills);
        this.accountsTable.render(this.accountsData);
    }

    renderCharts() {
        this.renderBillsByCategoryChart();
        this.renderBillsTimelineChart();
        this.renderAccountDistributionChart();
    }

    renderBillsByCategoryChart() {
        const bills = this.billsData?.filter(bill => !bill.is_subscription) || [];
        const categoryAmounts = bills.reduce((acc, bill) => {
            const category = bill.category || 'Other';
            acc[category] = (acc[category] || 0) + Number(bill.amount);
            return acc;
        }, {});

        this.charts.billsByCategory.createDoughnutChart({
            labels: Object.keys(categoryAmounts),
            datasets: [{
                data: Object.values(categoryAmounts),
                backgroundColor: this.charts.billsByCategory.getDefaultColors(),
                borderWidth: 0
            }]
        });
    }

    renderBillsTimelineChart() {
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
        
        const bills = this.billsData?.filter(bill => !bill.is_subscription) || [];
        const dailyTotals = {};
        
        bills.forEach(bill => {
            const dueDate = new Date(bill.due_date);
            if (dueDate >= now && dueDate <= thirtyDaysFromNow) {
                const dateStr = dueDate.toISOString().split('T')[0];
                dailyTotals[dateStr] = (dailyTotals[dateStr] || 0) + Number(bill.amount);
            }
        });

        const sortedDates = Object.keys(dailyTotals).sort();
        const cumulativeData = [];
        let cumulative = 0;

        sortedDates.forEach(date => {
            cumulative += dailyTotals[date];
            cumulativeData.push(cumulative);
        });

        this.charts.billsTimeline.createLineChart({
            labels: sortedDates.map(date => new Date(date).toLocaleDateString()),
            datasets: [{
                label: 'Daily Bills',
                data: sortedDates.map(date => dailyTotals[date]),
                borderColor: '#4361ee',
                backgroundColor: 'rgba(67, 97, 238, 0.1)',
                fill: true,
                tension: 0.4,
                order: 2
            }, {
                label: 'Cumulative Total',
                data: cumulativeData,
                borderColor: '#7209b7',
                borderDash: [5, 5],
                fill: false,
                tension: 0,
                order: 1
            }]
        });
    }

    renderAccountDistributionChart() {
        if (!this.accountsData?.length) return;

        this.charts.accountDistribution.createBarChart({
            labels: this.accountsData.map(account => account.name),
            datasets: [{
                label: 'Balance',
                data: this.accountsData.map(account => Number(account.balance)),
                backgroundColor: this.charts.accountDistribution.getDefaultColors(),
                borderRadius: 4,
                borderWidth: 0
            }]
        });
    }

    // Utility methods
    getBillStatusClass(bill) {
        const dueDate = new Date(bill.due_date);
        const now = new Date();
        
        if (dueDate < now) return 'overdue';
        if (dueDate - now <= 7 * 24 * 60 * 60 * 1000) return 'due-soon';
        return '';
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
