// Income Manager Class
export class IncomeManager {
    constructor() {
        this.incomeData = null;
        this.charts = {};
        this.toast = new Toast();
        
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
            themeToggle.addEventListener('change', this.handleThemeChange);
        }

        // Initialize event listeners
        document.getElementById('addIncomeBtn').addEventListener('click', () => this.showModal());
        document.getElementById('closeModal').addEventListener('click', () => this.hideModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.hideModal());
        document.getElementById('saveIncomeBtn').addEventListener('click', () => this.handleSubmit());

        // Load mock data
        await this.loadMockData();
        
        // Initialize charts
        this.initializeCharts();
        
        // Update UI
        this.updateDashboard();
    }

    handleThemeChange(event) {
        const isDark = event.target.checked;
        document.body.classList.toggle('dark-mode', isDark);
        document.body.classList.toggle('light-mode', !isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        this.updateCharts();
    }

    showModal(incomeData = null) {
        const modal = document.getElementById('incomeModal');
        const modalTitle = document.getElementById('modalTitle');
        const form = document.getElementById('incomeForm');

        modalTitle.textContent = incomeData ? 'Edit Income Source' : 'Add Income Source';
        
        if (incomeData) {
            form.sourceName.value = incomeData.name;
            form.category.value = incomeData.category;
            form.incomeType.value = incomeData.type;
            form.frequency.value = incomeData.frequency;
            form.amount.value = incomeData.amount;
            form.lastReceived.value = incomeData.lastReceived;
            form.notes.value = incomeData.notes || '';
        } else {
            form.reset();
        }

        modal.classList.add('show');
    }

    hideModal() {
        const modal = document.getElementById('incomeModal');
        modal.classList.remove('show');
    }

    async handleSubmit() {
        const form = document.getElementById('incomeForm');
        
        // Basic form validation
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = {
            name: form.sourceName.value,
            category: form.category.value,
            type: form.incomeType.value,
            frequency: form.frequency.value,
            amount: parseFloat(form.amount.value),
            lastReceived: form.lastReceived.value,
            notes: form.notes.value
        };

        // In a real app, this would be an API call
        console.log('Saving income source:', formData);
        
        this.hideModal();
        this.toast.show('Income source saved successfully!', 'success');
        
        // Refresh the data
        await this.loadMockData();
        this.updateDashboard();
    }

    async loadMockData() {
        // Mock data for income sources
        this.incomeData = {
            sources: [
                {
                    id: 1,
                    name: 'Software Engineering Salary',
                    category: 'salary',
                    type: 'recurring',
                    frequency: 'biweekly',
                    amount: 5000.00,
                    lastReceived: '2025-03-15'
                },
                {
                    id: 2,
                    name: 'Genius Force Workshops',
                    category: 'freelance',
                    type: 'variable',
                    frequency: 'monthly',
                    amount: 2500.00,
                    lastReceived: '2025-03-10'
                },
                {
                    id: 3,
                    name: 'Stock Dividends',
                    category: 'investments',
                    type: 'recurring',
                    frequency: 'quarterly',
                    amount: 1500.00,
                    lastReceived: '2025-03-01'
                }
            ],
            monthlyStats: {
                total: 12500.00,
                recurring: 10000.00,
                variable: 2500.00,
                ytd: 87500.00
            },
            trends: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                data: [11000, 11500, 12000, 12500, 12500, 12500]
            }
        };
    }

    initializeCharts() {
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        };

        // Income Trends Chart
        this.charts.trends = new Chart(document.getElementById('incomeTrendsChart'), {
            type: 'line',
            data: {
                labels: this.incomeData.trends.labels,
                datasets: [{
                    label: 'Monthly Income',
                    data: this.incomeData.trends.data,
                    borderColor: '#4CAF50',
                    tension: 0.1
                }]
            },
            options: chartOptions
        });

        // Income Distribution Chart
        this.charts.distribution = new Chart(document.getElementById('incomeDistributionChart'), {
            type: 'doughnut',
            data: {
                labels: ['Salary', 'Freelance', 'Investments'],
                datasets: [{
                    data: [10000, 2500, 1500],
                    backgroundColor: ['#4CAF50', '#2196F3', '#FFC107']
                }]
            },
            options: chartOptions
        });

        // Income Goal Chart
        this.charts.goal = new Chart(document.getElementById('incomeGoalChart'), {
            type: 'bar',
            data: {
                labels: ['Current', 'Goal'],
                datasets: [{
                    label: 'Monthly Income',
                    data: [12500, 15000],
                    backgroundColor: ['#4CAF50', '#90CAF9']
                }]
            },
            options: chartOptions
        });

        // Income Categories Chart
        this.charts.categories = new Chart(document.getElementById('incomeCategoriesChart'), {
            type: 'radar',
            data: {
                labels: ['Salary', 'Freelance', 'Investments', 'Rental', 'Other'],
                datasets: [{
                    label: 'Income Distribution',
                    data: [80, 20, 12, 0, 0],
                    backgroundColor: 'rgba(76, 175, 80, 0.2)',
                    borderColor: '#4CAF50'
                }]
            },
            options: chartOptions
        });
    }

    updateCharts() {
        Object.values(this.charts).forEach(chart => chart.update());
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    updateDashboard() {
        // Update statistics
        document.getElementById('totalMonthlyIncome').textContent = this.formatCurrency(this.incomeData.monthlyStats.total);
        document.getElementById('recurringIncome').textContent = this.formatCurrency(this.incomeData.monthlyStats.recurring);
        document.getElementById('variableIncome').textContent = this.formatCurrency(this.incomeData.monthlyStats.variable);
        document.getElementById('ytdIncome').textContent = this.formatCurrency(this.incomeData.monthlyStats.ytd);

        // Update income sources table
        const tableBody = document.getElementById('incomeSourcesTable');
        tableBody.innerHTML = '';

        this.incomeData.sources.forEach(source => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${source.name}</td>
                <td>${this.capitalizeFirst(source.category)}</td>
                <td>${this.capitalizeFirst(source.type)}</td>
                <td>${this.capitalizeFirst(source.frequency)}</td>
                <td>${this.formatCurrency(source.amount)}</td>
                <td>${new Date(source.lastReceived).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-icon" onclick="income.showModal(${JSON.stringify(source)})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-icon" onclick="income.deleteIncome(${source.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    deleteIncome(id) {
        if (confirm('Are you sure you want to delete this income source?')) {
            // In a real app, this would be an API call
            this.incomeData.sources = this.incomeData.sources.filter(source => source.id !== id);
            this.updateDashboard();
            this.toast.show('Income source deleted successfully!', 'success');
        }
    }
}

// Toast notification class
class Toast {
    show(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => {
                    document.body.removeChild(toast);
                }, 300);
            }, 3000);
        }, 100);
    }
}
