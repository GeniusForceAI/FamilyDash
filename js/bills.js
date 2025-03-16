import { auth } from './auth.js';
import config from './config.js';

class BillsManager {
    constructor() {
        this.billsData = null;
        this.accountsData = null;
        this.charts = {};
    }

    async initialize() {
        await this.loadData();
        this.setupEventListeners();
        this.renderDashboard();
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
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Failed to load bills data. Please try again.');
        }
    }

    setupEventListeners() {
        document.getElementById('addBillBtn').addEventListener('click', () => this.showBillModal());
        document.getElementById('addAccountBtn').addEventListener('click', () => this.showAccountModal());
        
        // Form submissions
        document.getElementById('billForm').addEventListener('submit', (e) => this.handleBillSubmit(e));
        document.getElementById('accountForm').addEventListener('submit', (e) => this.handleAccountSubmit(e));
    }

    renderDashboard() {
        this.renderBillsTable();
        this.renderAccountsTable();
        this.renderStatistics();
        this.renderCharts();
    }

    renderBillsTable() {
        const tbody = document.getElementById('billsTableBody');
        if (!this.billsData?.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="no-data">No bills found</td></tr>';
            return;
        }

        tbody.innerHTML = this.billsData.map(bill => `
            <tr class="${bill.status === 'overdue' ? 'overdue' : ''}">
                <td>${bill.name}</td>
                <td>${this.formatCurrency(bill.amount)}</td>
                <td>${new Date(bill.due_date).toLocaleDateString()}</td>
                <td>${bill.status}</td>
                <td>${bill.payment_account || 'Not assigned'}</td>
                <td>
                    <button class="action-button" onclick="billsManager.editBill('${bill.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-button" onclick="billsManager.deleteBill('${bill.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    renderAccountsTable() {
        const tbody = document.getElementById('accountsTableBody');
        if (!this.accountsData?.length) {
            tbody.innerHTML = '<tr><td colspan="4" class="no-data">No accounts found</td></tr>';
            return;
        }

        tbody.innerHTML = this.accountsData.map(account => `
            <tr>
                <td>${account.name}</td>
                <td>${this.formatCurrency(account.balance)}</td>
                <td>${account.type}</td>
                <td>${new Date(account.last_updated).toLocaleDateString()}</td>
            </tr>
        `).join('');
    }

    renderStatistics() {
        const totalBills = this.billsData?.reduce((sum, bill) => sum + bill.amount, 0) || 0;
        const totalAccounts = this.accountsData?.reduce((sum, acc) => sum + acc.balance, 0) || 0;
        
        document.getElementById('totalBills').textContent = this.formatCurrency(totalBills);
        document.getElementById('totalAccounts').textContent = this.formatCurrency(totalAccounts);
        
        const coverageRatio = totalAccounts ? (totalBills / totalAccounts) * 100 : 0;
        const progressBar = document.querySelector('.progress');
        progressBar.style.width = `${Math.min(coverageRatio, 100)}%`;
        document.querySelector('.progress-text').textContent = 
            `Bills coverage: ${coverageRatio.toFixed(1)}% of available funds`;
    }

    renderCharts() {
        this.renderBillsByCategory();
        this.renderBillsTimeline();
        this.renderAccountDistribution();
    }

    renderBillsByCategory() {
        const ctx = document.getElementById('billsByCategoryChart').getContext('2d');
        const categoryData = {};
        
        this.billsData?.forEach(bill => {
            categoryData[bill.category] = (categoryData[bill.category] || 0) + bill.amount;
        });

        if (this.charts.category) this.charts.category.destroy();
        this.charts.category = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categoryData),
                datasets: [{
                    data: Object.values(categoryData),
                    backgroundColor: this.generateColors(Object.keys(categoryData).length)
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: this.isDarkMode() ? '#fff' : '#000' }
                    }
                }
            }
        });
    }

    renderBillsTimeline() {
        const ctx = document.getElementById('billsTimelineChart').getContext('2d');
        const timelineData = {};
        
        this.billsData?.forEach(bill => {
            const date = new Date(bill.due_date).toLocaleDateString();
            timelineData[date] = (timelineData[date] || 0) + bill.amount;
        });

        if (this.charts.timeline) this.charts.timeline.destroy();
        this.charts.timeline = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Object.keys(timelineData),
                datasets: [{
                    label: 'Due Amount',
                    data: Object.values(timelineData),
                    borderColor: '#4CAF50',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { 
                        ticks: { color: this.isDarkMode() ? '#fff' : '#000' }
                    },
                    x: { 
                        ticks: { color: this.isDarkMode() ? '#fff' : '#000' }
                    }
                }
            }
        });
    }

    renderAccountDistribution() {
        const ctx = document.getElementById('accountDistributionChart').getContext('2d');
        const accountData = {};
        
        this.accountsData?.forEach(account => {
            accountData[account.name] = account.balance;
        });

        if (this.charts.accounts) this.charts.accounts.destroy();
        this.charts.accounts = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(accountData),
                datasets: [{
                    label: 'Account Balance',
                    data: Object.values(accountData),
                    backgroundColor: this.generateColors(Object.keys(accountData).length)
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { 
                        ticks: { color: this.isDarkMode() ? '#fff' : '#000' }
                    },
                    x: { 
                        ticks: { color: this.isDarkMode() ? '#fff' : '#000' }
                    }
                }
            }
        });
    }

    async handleBillSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const billData = {
            name: formData.get('name'),
            amount: parseFloat(formData.get('amount')),
            due_date: formData.get('dueDate'),
            category: formData.get('category'),
            payment_account: formData.get('account'),
            recurring: formData.get('recurring') === 'on',
            recurring_period: formData.get('recurringPeriod')
        };

        try {
            const response = await auth.fetchWithAuth(
                config.getApiUrl(config.endpoints.bills) + (formData.get('billId') ? '/' + formData.get('billId') : ''),
                {
                    method: formData.get('billId') ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(billData)
                }
            );

            if (!response.ok) throw new Error('Failed to save bill');
            
            this.closeBillModal();
            await this.loadData();
            this.renderDashboard();
            this.showSuccess('Bill saved successfully');
        } catch (error) {
            console.error('Error saving bill:', error);
            this.showError('Failed to save bill. Please try again.');
        }
    }

    async handleAccountSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const accountData = {
            name: formData.get('name'),
            balance: parseFloat(formData.get('balance')),
            type: formData.get('type')
        };

        try {
            const response = await auth.fetchWithAuth(
                config.getApiUrl(config.endpoints.billsAccounts),
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(accountData)
                }
            );

            if (!response.ok) throw new Error('Failed to save account');
            
            this.closeAccountModal();
            await this.loadData();
            this.renderDashboard();
            this.showSuccess('Account saved successfully');
        } catch (error) {
            console.error('Error saving account:', error);
            this.showError('Failed to save account. Please try again.');
        }
    }

    // Utility methods
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    generateColors(count) {
        const colors = [
            '#4CAF50', '#2196F3', '#FFC107', '#E91E63', '#9C27B0',
            '#00BCD4', '#FF5722', '#795548', '#607D8B', '#3F51B5'
        ];
        return Array(count).fill().map((_, i) => colors[i % colors.length]);
    }

    isDarkMode() {
        return document.body.classList.contains('dark-mode');
    }

    showError(message) {
        // Implementation of error toast
    }

    showSuccess(message) {
        // Implementation of success toast
    }
}

// Initialize the bills manager
const billsManager = new BillsManager();
document.addEventListener('DOMContentLoaded', () => billsManager.initialize());
window.billsManager = billsManager;
