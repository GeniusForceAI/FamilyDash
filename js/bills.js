import { auth } from './auth.js';
import config from './config.js';

export class BillsManager {
    constructor() {
        this.billsData = null;
        this.accountsData = null;
        this.charts = {};
        
        // Bind methods
        this.handleThemeChange = this.handleThemeChange.bind(this);
        this.showModal = this.showModal.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    async initialize() {
        // Initialize theme
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.body.classList.toggle('dark-mode', savedTheme === 'dark');
        document.body.classList.toggle('light-mode', savedTheme === 'light');

        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.checked = savedTheme === 'dark';
            themeToggle.addEventListener('change', () => {
                const newTheme = themeToggle.checked ? 'dark' : 'light';
                localStorage.setItem('theme', newTheme);
                document.body.classList.toggle('dark-mode', newTheme === 'dark');
                document.body.classList.toggle('light-mode', newTheme === 'light');
                document.dispatchEvent(new Event('themeChanged'));
            });
        }

        await this.loadData();
        this.setupEventListeners();
        this.renderDashboard();
        document.addEventListener('themeChanged', this.handleThemeChange);
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
            
            console.log('Loaded bills:', this.billsData);
            console.log('Loaded accounts:', this.accountsData);
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Failed to load bills data. Please try again.');
        }
    }

    setupEventListeners() {
        const addBillBtn = document.getElementById('addBillBtn');
        const addAccountBtn = document.getElementById('addAccountBtn');
        
        if (addBillBtn) addBillBtn.addEventListener('click', () => this.showModal('bill'));
        if (addAccountBtn) addAccountBtn.addEventListener('click', () => this.showModal('account'));
        
        const billForm = document.getElementById('billForm');
        const accountForm = document.getElementById('accountForm');
        
        if (billForm) billForm.addEventListener('submit', (e) => this.handleSubmit(e, 'bill'));
        if (accountForm) accountForm.addEventListener('submit', (e) => this.handleSubmit(e, 'account'));

        // Handle recurring bill toggle
        const recurringCheckbox = document.getElementById('billRecurring');
        const recurringPeriodGroup = document.getElementById('recurringPeriodGroup');
        if (recurringCheckbox && recurringPeriodGroup) {
            recurringCheckbox.addEventListener('change', (e) => {
                recurringPeriodGroup.style.display = e.target.checked ? 'block' : 'none';
            });
        }
    }

    showModal(type) {
        const modal = document.getElementById(`${type}Modal`);
        if (modal) {
            modal.style.display = 'block';
            if (type === 'bill') {
                this.populateAccountsDropdown();
            }
        }
    }

    closeModal(type) {
        const modal = document.getElementById(`${type}Modal`);
        if (modal) {
            modal.style.display = 'none';
            document.getElementById(`${type}Form`).reset();
        }
    }

    populateAccountsDropdown() {
        const accountSelect = document.getElementById('billAccount');
        if (!accountSelect || !this.accountsData?.length) return;

        accountSelect.innerHTML = this.accountsData.map(account => 
            `<option value="${account.id}">${account.name} (${this.formatCurrency(account.balance)})</option>`
        ).join('');
    }

    async handleSubmit(e, type) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        
        try {
            const data = Object.fromEntries(formData.entries());
            const endpoint = type === 'bill' ? config.endpoints.bills : config.endpoints.billsAccounts;
            const response = await auth.fetchWithAuth(
                config.getApiUrl(endpoint),
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                }
            );

            if (!response.ok) throw new Error(`Failed to save ${type}`);
            
            this.closeModal(type);
            await this.loadData();
            this.renderDashboard();
            this.showSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} saved successfully`);
        } catch (error) {
            console.error(`Error saving ${type}:`, error);
            this.showError(`Failed to save ${type}. Please try again.`);
        }
    }

    renderDashboard() {
        this.renderAccountsTable();
        this.renderSubscriptionsTable();
        this.renderBillsTable();
        this.renderStatistics();
        this.renderCharts();
    }

    renderCharts() {
        this.renderBillsByCategoryChart();
        this.renderBillsTimelineChart();
        this.renderAccountDistributionChart();
    }

    renderBillsByCategoryChart() {
        const ctx = document.getElementById('billsByCategoryChart')?.getContext('2d');
        if (!ctx || !this.billsData) return;

        // Destroy existing chart if it exists
        if (this.charts.billsByCategory) {
            this.charts.billsByCategory.destroy();
        }

        const bills = this.billsData.filter(bill => !bill.is_subscription);
        const categoryAmounts = bills.reduce((acc, bill) => {
            const category = bill.category || 'Other';
            acc[category] = (acc[category] || 0) + Number(bill.amount);
            return acc;
        }, {});

        const colors = [
            '#4361ee', // Primary blue
            '#2d31fa', // Deep blue
            '#5390d9', // Light blue
            '#48bfe3', // Sky blue
            '#56cfe1', // Cyan
            '#64dfdf', // Turquoise
            '#72efdd', // Mint
            '#80ffdb', // Aqua
            '#06d6a0', // Teal
            '#0cb0a9'  // Dark teal
        ];

        const isDarkMode = document.body.classList.contains('dark-mode');
        const textColor = isDarkMode ? '#ffffff' : '#333333';

        Chart.defaults.color = textColor;
        Chart.defaults.backgroundColor = isDarkMode ? '#1e1e2d' : '#ffffff';

        this.charts.billsByCategory = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categoryAmounts),
                datasets: [{
                    data: Object.values(categoryAmounts),
                    backgroundColor: colors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: textColor,
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${context.label}: ${this.formatCurrency(value)} (${percentage}%)`;
                            }
                        },
                        backgroundColor: isDarkMode ? '#2d2d3d' : '#ffffff',
                        titleColor: textColor,
                        bodyColor: textColor,
                        borderColor: isDarkMode ? '#3d3d4d' : '#e0e0e0',
                        borderWidth: 1
                    }
                }
            }
        });
    }

    renderBillsTimelineChart() {
        const ctx = document.getElementById('billsTimelineChart')?.getContext('2d');
        if (!ctx || !this.billsData) return;

        // Destroy existing chart if it exists
        if (this.charts.billsTimeline) {
            this.charts.billsTimeline.destroy();
        }

        const isDarkMode = document.body.classList.contains('dark-mode');
        const textColor = isDarkMode ? '#ffffff' : '#333333';
        const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

        Chart.defaults.color = textColor;
        Chart.defaults.backgroundColor = isDarkMode ? '#1e1e2d' : '#ffffff';

        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
        
        const bills = this.billsData.filter(bill => !bill.is_subscription);
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

        this.charts.billsTimeline = new Chart(ctx, {
            type: 'line',
            data: {
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
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: textColor,
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `${context.dataset.label}: ${this.formatCurrency(context.raw)}`;
                            }
                        },
                        backgroundColor: isDarkMode ? '#2d2d3d' : '#ffffff',
                        titleColor: textColor,
                        bodyColor: textColor,
                        borderColor: isDarkMode ? '#3d3d4d' : '#e0e0e0',
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: value => this.formatCurrency(value),
                            color: textColor
                        },
                        grid: {
                            color: gridColor
                        }
                    },
                    x: {
                        ticks: {
                            color: textColor,
                            maxRotation: 45,
                            minRotation: 45
                        },
                        grid: {
                            color: gridColor
                        }
                    }
                }
            }
        });
    }

    renderAccountDistributionChart() {
        const ctx = document.getElementById('accountDistributionChart')?.getContext('2d');
        if (!ctx || !this.accountsData) return;

        // Destroy existing chart if it exists
        if (this.charts.accountDistribution) {
            this.charts.accountDistribution.destroy();
        }

        const isDarkMode = document.body.classList.contains('dark-mode');
        const textColor = isDarkMode ? '#ffffff' : '#333333';
        const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

        Chart.defaults.color = textColor;
        Chart.defaults.backgroundColor = isDarkMode ? '#1e1e2d' : '#ffffff';

        const colors = [
            '#4361ee', // Primary blue
            '#2d31fa', // Deep blue
            '#5390d9', // Light blue
            '#48bfe3', // Sky blue
            '#56cfe1', // Cyan
            '#64dfdf', // Turquoise
            '#72efdd', // Mint
            '#80ffdb', // Aqua
            '#06d6a0', // Teal
            '#0cb0a9'  // Dark teal
        ];

        this.charts.accountDistribution = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: this.accountsData.map(account => account.name),
                datasets: [{
                    label: 'Balance',
                    data: this.accountsData.map(account => Number(account.balance)),
                    backgroundColor: colors,
                    borderRadius: 4,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `Balance: ${this.formatCurrency(context.raw)}`;
                            }
                        },
                        backgroundColor: isDarkMode ? '#2d2d3d' : '#ffffff',
                        titleColor: textColor,
                        bodyColor: textColor,
                        borderColor: isDarkMode ? '#3d3d4d' : '#e0e0e0',
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: value => this.formatCurrency(value),
                            color: textColor
                        },
                        grid: {
                            color: gridColor
                        }
                    },
                    x: {
                        ticks: {
                            color: textColor
                        },
                        grid: {
                            color: gridColor
                        }
                    }
                }
            }
        });
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

    renderAccountsTable() {
        const tbody = document.getElementById('accountsTableBody');
        if (!tbody || !this.accountsData) return;

        if (!this.accountsData.length) {
            tbody.innerHTML = '<tr><td colspan="4" class="no-data">No accounts found</td></tr>';
            return;
        }

        tbody.innerHTML = this.accountsData.map(account => `
            <tr>
                <td data-label="Name">${account.name}</td>
                <td data-label="Balance">${this.formatCurrency(account.balance)}</td>
                <td data-label="Type">${account.type}</td>
                <td data-label="Actions">
                    <div class="action-buttons">
                        <button class="btn" onclick="billsManager.editAccount('${account.id}')">
                            <i class="fas fa-edit"></i>
                            <span class="hide-mobile">Edit</span>
                        </button>
                        <button class="btn" onclick="billsManager.deleteAccount('${account.id}')">
                            <i class="fas fa-trash"></i>
                            <span class="hide-mobile">Delete</span>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderSubscriptionsTable() {
        const tbody = document.getElementById('subscriptionsTableBody');
        if (!tbody || !this.billsData) return;

        const subscriptions = this.billsData.filter(bill => bill.is_subscription);
        
        if (!subscriptions.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="no-data">No subscriptions found</td></tr>';
            return;
        }

        tbody.innerHTML = subscriptions.map(subscription => `
            <tr>
                <td data-label="Name">${subscription.name}</td>
                <td data-label="Amount">${this.formatCurrency(subscription.amount)}</td>
                <td data-label="Billing Cycle">${subscription.billing_cycle}</td>
                <td data-label="Payment Account">${this.getAccountName(subscription.account_id)}</td>
                <td data-label="Actions">
                    <div class="action-buttons">
                        <button class="btn" onclick="billsManager.editSubscription('${subscription.id}')">
                            <i class="fas fa-edit"></i>
                            <span class="hide-mobile">Edit</span>
                        </button>
                        <button class="btn" onclick="billsManager.deleteSubscription('${subscription.id}')">
                            <i class="fas fa-trash"></i>
                            <span class="hide-mobile">Delete</span>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderBillsTable() {
        const tbody = document.getElementById('billsTableBody');
        if (!tbody || !this.billsData) return;

        const bills = this.billsData.filter(bill => !bill.is_subscription);
        
        if (!bills.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="no-data">No bills found</td></tr>';
            return;
        }

        tbody.innerHTML = bills.map(bill => `
            <tr class="${this.getBillStatusClass(bill)}">
                <td data-label="Name">${bill.name}</td>
                <td data-label="Amount">${this.formatCurrency(bill.amount)}</td>
                <td data-label="Due Date">${new Date(bill.due_date).toLocaleDateString()}</td>
                <td data-label="Status">
                    <span class="status-badge ${this.getBillStatusClass(bill)}">
                        ${this.getBillStatus(bill)}
                    </span>
                </td>
                <td data-label="Actions">
                    <div class="action-buttons">
                        <button class="btn" onclick="billsManager.markBillAsPaid('${bill.id}')">
                            <i class="fas fa-check"></i>
                            <span class="hide-mobile">Mark Paid</span>
                        </button>
                        <button class="btn" onclick="billsManager.editBill('${bill.id}')">
                            <i class="fas fa-edit"></i>
                            <span class="hide-mobile">Edit</span>
                        </button>
                    </div>
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

    getBillStatus(bill) {
        const dueDate = new Date(bill.due_date);
        const now = new Date();
        
        if (dueDate < now) return 'Overdue';
        if (dueDate - now <= 7 * 24 * 60 * 60 * 1000) return 'Due Soon';
        return 'Upcoming';
    }

    handleThemeChange() {
        // Re-render dashboard with new theme
        this.renderDashboard();
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

    showSuccess(message) {
        const successToast = document.createElement('div');
        successToast.className = 'success-toast';
        successToast.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(successToast);
        setTimeout(() => successToast.remove(), 5000);
    }

    async editBill(id) {
        // Implementation for editing bills
    }

    async deleteBill(id) {
        // Implementation for deleting bills
    }

    async editAccount(id) {
        // Implementation for editing accounts
    }

    async deleteAccount(id) {
        // Implementation for deleting accounts
    }

    async editSubscription(id) {
        // Implementation for editing subscriptions
    }

    async deleteSubscription(id) {
        // Implementation for deleting subscriptions
    }

    async markBillAsPaid(id) {
        // Implementation for marking bill as paid
    }

    getAccountName(id) {
        const account = this.accountsData.find(account => account.id === id);
        return account ? account.name : 'Not assigned';
    }
}

// Initialize the bills manager
const billsManager = new BillsManager();
document.addEventListener('DOMContentLoaded', () => billsManager.initialize());
window.billsManager = billsManager;
