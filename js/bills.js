import { auth } from './auth.js';
import config from './config.js';

export class BillsManager {
    constructor() {
        this.billsData = null;
        this.accountsData = null;
        this.charts = {};
        
        // Bind methods that need 'this' context
        this.handleThemeChange = this.handleThemeChange.bind(this);
        this.handleBillSubmit = this.handleBillSubmit.bind(this);
        this.handleAccountSubmit = this.handleAccountSubmit.bind(this);
        this.showBillModal = this.showBillModal.bind(this);
        this.showAccountModal = this.showAccountModal.bind(this);
        this.closeBillModal = this.closeBillModal.bind(this);
        this.closeAccountModal = this.closeAccountModal.bind(this);
    }

    async initialize() {
        await this.loadData();
        this.setupEventListeners();
        this.renderDashboard();
        
        // Listen for theme changes
        document.addEventListener('themeChanged', this.handleThemeChange);
        
        // Calculate and display due bills
        this.calculateDueBills();
    }

    handleThemeChange() {
        // Re-render charts with new theme colors
        this.renderCharts();
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
        // Action buttons
        const addBillBtn = document.getElementById('addBillBtn');
        const addAccountBtn = document.getElementById('addAccountBtn');
        
        if (addBillBtn) addBillBtn.addEventListener('click', this.showBillModal);
        if (addAccountBtn) addAccountBtn.addEventListener('click', this.showAccountModal);
        
        // Form submissions
        const billForm = document.getElementById('billForm');
        const accountForm = document.getElementById('accountForm');
        
        if (billForm) billForm.addEventListener('submit', this.handleBillSubmit);
        if (accountForm) accountForm.addEventListener('submit', this.handleAccountSubmit);

        // Modal close buttons
        const closeBillModal = document.getElementById('closeBillModal');
        const closeAccountModal = document.getElementById('closeAccountModal');
        const cancelBillBtn = document.getElementById('cancelBillBtn');
        const cancelAccountBtn = document.getElementById('cancelAccountBtn');
        
        if (closeBillModal) closeBillModal.addEventListener('click', this.closeBillModal);
        if (closeAccountModal) closeAccountModal.addEventListener('click', this.closeAccountModal);
        if (cancelBillBtn) cancelBillBtn.addEventListener('click', this.closeBillModal);
        if (cancelAccountBtn) cancelAccountBtn.addEventListener('click', this.closeAccountModal);

        // Save buttons
        const saveBillBtn = document.getElementById('saveBillBtn');
        const saveAccountBtn = document.getElementById('saveAccountBtn');
        
        if (saveBillBtn) saveBillBtn.addEventListener('click', () => {
            document.getElementById('billForm').dispatchEvent(new Event('submit'));
        });
        if (saveAccountBtn) saveAccountBtn.addEventListener('click', () => {
            document.getElementById('accountForm').dispatchEvent(new Event('submit'));
        });

        // Recurring bill toggle
        const recurringCheckbox = document.getElementById('billRecurring');
        const recurringPeriodGroup = document.getElementById('recurringPeriodGroup');
        
        if (recurringCheckbox && recurringPeriodGroup) {
            recurringCheckbox.addEventListener('change', (e) => {
                recurringPeriodGroup.style.display = e.target.checked ? 'block' : 'none';
            });
        }
    }

    calculateDueBills() {
        const now = new Date();
        const weekEnd = new Date(now);
        weekEnd.setDate(now.getDate() + 7);
        
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        const dueThisWeek = this.billsData?.reduce((sum, bill) => {
            const dueDate = new Date(bill.due_date);
            return dueDate >= now && dueDate <= weekEnd ? sum + bill.amount : sum;
        }, 0) || 0;
        
        const dueThisMonth = this.billsData?.reduce((sum, bill) => {
            const dueDate = new Date(bill.due_date);
            return dueDate >= now && dueDate <= monthEnd ? sum + bill.amount : sum;
        }, 0) || 0;
        
        const dueThisWeekElement = document.getElementById('dueThisWeek');
        const dueThisMonthElement = document.getElementById('dueThisMonth');
        
        if (dueThisWeekElement) dueThisWeekElement.textContent = this.formatCurrency(dueThisWeek);
        if (dueThisMonthElement) dueThisMonthElement.textContent = this.formatCurrency(dueThisMonth);
    }

    renderDashboard() {
        this.renderBillsTable();
        this.renderAccountsTable();
        this.renderStatistics();
        this.renderCharts();
    }

    renderBillsTable() {
        const tbody = document.getElementById('billsTableBody');
        if (!tbody || !this.billsData?.length) {
            if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="no-data">No bills found</td></tr>';
            return;
        }

        tbody.innerHTML = this.billsData.map(bill => `
            <tr class="${this.getBillStatusClass(bill)}">
                <td>${bill.name}</td>
                <td>${this.formatCurrency(bill.amount)}</td>
                <td>${new Date(bill.due_date).toLocaleDateString()}</td>
                <td><span class="status-badge ${bill.status}">${bill.status}</span></td>
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

    getBillStatusClass(bill) {
        const dueDate = new Date(bill.due_date);
        const now = new Date();
        
        if (dueDate < now) return 'overdue';
        if (dueDate - now <= 7 * 24 * 60 * 60 * 1000) return 'due-soon';
        return '';
    }

    renderAccountsTable() {
        const tbody = document.getElementById('accountsTableBody');
        if (!tbody || !this.accountsData?.length) {
            if (tbody) tbody.innerHTML = '<tr><td colspan="4" class="no-data">No accounts found</td></tr>';
            return;
        }

        tbody.innerHTML = this.accountsData.map(account => `
            <tr>
                <td>${account.name}</td>
                <td>${this.formatCurrency(account.balance)}</td>
                <td>${this.capitalizeFirst(account.type)}</td>
                <td>${new Date(account.last_updated).toLocaleDateString()}</td>
            </tr>
        `).join('');
    }

    renderStatistics() {
        const totalBills = this.billsData?.reduce((sum, bill) => sum + bill.amount, 0) || 0;
        const totalAccounts = this.accountsData?.reduce((sum, acc) => sum + acc.balance, 0) || 0;
        
        const totalBillsElement = document.getElementById('totalBills');
        const totalAccountsElement = document.getElementById('totalAccounts');
        
        if (totalBillsElement) totalBillsElement.textContent = this.formatCurrency(totalBills);
        if (totalAccountsElement) totalAccountsElement.textContent = this.formatCurrency(totalAccounts);
        
        const coverageRatio = totalAccounts ? (totalBills / totalAccounts) * 100 : 0;
        const progressBar = document.querySelector('.progress');
        const progressText = document.querySelector('.progress-text');
        
        if (progressBar) progressBar.style.width = `${Math.min(coverageRatio, 100)}%`;
        if (progressText) {
            progressText.textContent = `Bills coverage: ${coverageRatio.toFixed(1)}% of available funds`;
        }
    }

    renderCharts() {
        this.renderBillsByCategory();
        this.renderBillsTimeline();
        this.renderAccountDistribution();
    }

    renderBillsByCategory() {
        const canvas = document.getElementById('billsByCategoryChart');
        if (!canvas || !this.billsData?.length) return;

        const ctx = canvas.getContext('2d');
        const categoryData = {};
        
        this.billsData.forEach(bill => {
            categoryData[bill.category] = (categoryData[bill.category] || 0) + bill.amount;
        });

        if (this.charts.category) this.charts.category.destroy();
        this.charts.category = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categoryData).map(this.capitalizeFirst),
                datasets: [{
                    data: Object.values(categoryData),
                    backgroundColor: this.generateColors(Object.keys(categoryData).length)
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { 
                            color: this.isDarkMode() ? '#f1f5f9' : '#1e293b',
                            font: { family: 'Inter' }
                        }
                    }
                }
            }
        });
    }

    renderBillsTimeline() {
        const canvas = document.getElementById('billsTimelineChart');
        if (!canvas || !this.billsData?.length) return;

        const ctx = canvas.getContext('2d');
        const timelineData = {};
        
        this.billsData.forEach(bill => {
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
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { 
                        ticks: { 
                            color: this.isDarkMode() ? '#f1f5f9' : '#1e293b',
                            font: { family: 'Inter' }
                        },
                        grid: {
                            color: this.isDarkMode() ? 'rgba(241, 245, 249, 0.1)' : 'rgba(30, 41, 59, 0.1)'
                        }
                    },
                    x: { 
                        ticks: { 
                            color: this.isDarkMode() ? '#f1f5f9' : '#1e293b',
                            font: { family: 'Inter' }
                        },
                        grid: {
                            color: this.isDarkMode() ? 'rgba(241, 245, 249, 0.1)' : 'rgba(30, 41, 59, 0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: { 
                            color: this.isDarkMode() ? '#f1f5f9' : '#1e293b',
                            font: { family: 'Inter' }
                        }
                    }
                }
            }
        });
    }

    renderAccountDistribution() {
        const canvas = document.getElementById('accountDistributionChart');
        if (!canvas || !this.accountsData?.length) return;

        const ctx = canvas.getContext('2d');
        const accountData = {};
        
        this.accountsData.forEach(account => {
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
                    backgroundColor: this.generateColors(Object.keys(accountData).length),
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { 
                        ticks: { 
                            color: this.isDarkMode() ? '#f1f5f9' : '#1e293b',
                            font: { family: 'Inter' }
                        },
                        grid: {
                            color: this.isDarkMode() ? 'rgba(241, 245, 249, 0.1)' : 'rgba(30, 41, 59, 0.1)'
                        }
                    },
                    x: { 
                        ticks: { 
                            color: this.isDarkMode() ? '#f1f5f9' : '#1e293b',
                            font: { family: 'Inter' }
                        },
                        grid: {
                            color: this.isDarkMode() ? 'rgba(241, 245, 249, 0.1)' : 'rgba(30, 41, 59, 0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: { 
                            color: this.isDarkMode() ? '#f1f5f9' : '#1e293b',
                            font: { family: 'Inter' }
                        }
                    }
                }
            }
        });
    }

    // Modal methods
    showBillModal() {
        const modal = document.getElementById('billModal');
        if (modal) {
            modal.classList.add('active');
            this.populateAccountsDropdown();
        }
    }

    closeBillModal() {
        const modal = document.getElementById('billModal');
        if (modal) {
            modal.classList.remove('active');
            document.getElementById('billForm').reset();
        }
    }

    showAccountModal() {
        const modal = document.getElementById('accountModal');
        if (modal) modal.classList.add('active');
    }

    closeAccountModal() {
        const modal = document.getElementById('accountModal');
        if (modal) {
            modal.classList.remove('active');
            document.getElementById('accountForm').reset();
        }
    }

    populateAccountsDropdown() {
        const accountSelect = document.getElementById('billAccount');
        if (!accountSelect || !this.accountsData?.length) return;

        accountSelect.innerHTML = this.accountsData.map(account => `
            <option value="${account.id}">${account.name} (${this.formatCurrency(account.balance)})</option>
        `).join('');
    }

    // Form handlers
    async handleBillSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        
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
            const url = config.getApiUrl(config.endpoints.bills);
            const billId = formData.get('billId');
            
            const response = await auth.fetchWithAuth(
                billId ? `${url}/${billId}` : url,
                {
                    method: billId ? 'PUT' : 'POST',
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
        const form = e.target;
        const formData = new FormData(form);
        
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
    isDarkMode() {
        return document.body.classList.contains('dark-mode');
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

    generateColors(count) {
        const colors = [
            '#3b82f6', '#22c55e', '#f59e0b', '#ef4444',
            '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
        ];
        return Array(count).fill().map((_, i) => colors[i % colors.length]);
    }

    showError(message) {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;
        
        const toast = document.createElement('div');
        toast.className = 'toast error';
        toast.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span class="toast-message">${message}</span>
            <button class="toast-close">×</button>
        `;
        
        toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 5000);
        
        toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
    }

    showSuccess(message) {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;
        
        const toast = document.createElement('div');
        toast.className = 'toast success';
        toast.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span class="toast-message">${message}</span>
            <button class="toast-close">×</button>
        `;
        
        toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 5000);
        
        toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
    }
}

// Initialize the bills manager
const billsManager = new BillsManager();
document.addEventListener('DOMContentLoaded', () => billsManager.initialize());
window.billsManager = billsManager;
