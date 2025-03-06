// State Management
let state = {
    income: {
        biweekly: 0,
        monthly: 0
    },
    bills: [],
    payments: [],
    currentPage: 'dashboard'
};

// DOM Elements
const menuToggle = document.getElementById('menuToggle');
const themeToggle = document.getElementById('themeToggle');
const sideNav = document.querySelector('.side-nav');
const navLinks = document.querySelectorAll('.nav-links a');
const pages = document.querySelectorAll('.page');
const dateDisplay = document.querySelector('.date-display');
const addPaymentBtn = document.getElementById('addPaymentBtn');
const paymentModal = document.getElementById('paymentModal');
const paymentForm = document.getElementById('paymentForm');

// Initialize App
async function initializeApp() {
    await loadData();
    setupEventListeners();
    updateUI();
    displayCurrentDate();
}

// Event Listeners
function setupEventListeners() {
    // Theme Toggle
    themeToggle.addEventListener('click', toggleTheme);

    // Mobile Menu
    menuToggle.addEventListener('click', () => {
        document.body.classList.toggle('nav-open');
    });

    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = e.currentTarget.getAttribute('href').substring(1);
            navigateToPage(targetPage);
        });
    });

    // Payment Form
    addPaymentBtn?.addEventListener('click', () => {
        paymentModal.style.display = 'block';
    });

    // Add click handler for the second add payment button
    const addPaymentBtn2 = document.getElementById('addPaymentBtn2');
    addPaymentBtn2?.addEventListener('click', () => {
        paymentModal.style.display = 'block';
    });

    paymentForm?.addEventListener('submit', handlePaymentSubmit);

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === paymentModal) {
            closePaymentModal();
        }
    });

    // Load theme preference
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.className = savedTheme + '-mode';
    updateThemeIcon();
}

// Navigation
function navigateToPage(pageName) {
    state.currentPage = pageName;
    
    // Update active states
    pages.forEach(page => {
        page.classList.toggle('active', page.id === pageName);
    });
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href').substring(1);
        link.parentElement.classList.toggle('active', linkPage === pageName);
    });

    // Close mobile menu after navigation
    document.body.classList.remove('nav-open');
}

// Theme Toggle
function toggleTheme() {
    const body = document.body;
    if (body.classList.contains('dark-mode')) {
        body.classList.remove('dark-mode');
        body.classList.add('light-mode');
        localStorage.setItem('theme', 'light');
    } else {
        body.classList.remove('light-mode');
        body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
    }
    updateThemeIcon();
}

function updateThemeIcon() {
    const icon = themeToggle.querySelector('i');
    if (document.body.classList.contains('dark-mode')) {
        icon.className = 'fas fa-moon';
    } else {
        icon.className = 'fas fa-sun';
    }
}

// Data Management
async function loadData() {
    try {
        const response = await fetch('http://localhost:3000/api/finances');
        if (!response.ok) throw new Error('Failed to load data');
        const data = await response.json();
        
        state.income = data.income || { biweekly: 0, monthly: 0 };
        state.bills = data.bills || [];
        state.payments = data.payments || [];
        
        updateUI();
    } catch (error) {
        console.error('Error loading data:', error);
        showError('Failed to load data. Please try again.');
    }
}

async function saveData() {
    try {
        const response = await fetch('http://localhost:3000/api/finances', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(state)
        });
        
        if (!response.ok) throw new Error('Failed to save data');
    } catch (error) {
        console.error('Error saving data:', error);
        showError('Failed to save data. Please try again.');
    }
}

// UI Updates
function updateUI() {
    updateIncomeDisplay();
    updateBillsTable();
    updatePaymentsTable();
    updateBillsProgress();
    updatePaymentStats();
}

function updateIncomeDisplay() {
    const biweeklyElement = document.getElementById('biweeklyIncome');
    const monthlyElement = document.getElementById('monthlyIncome');
    
    if (biweeklyElement) {
        biweeklyElement.textContent = formatCurrency(state.income.biweekly);
    }
    if (monthlyElement) {
        monthlyElement.textContent = formatCurrency(state.income.monthly);
    }
}

function updateBillsTable() {
    const tbody = document.getElementById('billsTableBody');
    const tbody2 = document.getElementById('billsTableBody2');
    if (!tbody && !tbody2) return;

    const billsHTML = state.bills.map((bill, index) => `
        <tr>
            <td>${bill.name}</td>
            <td>${formatCurrency(bill.amount)}</td>
            <td>${bill.category}</td>
            <td>
                <button onclick="editBill(${index})" class="edit-button">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteBill(${index})" class="cancel-button">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');

    if (tbody) tbody.innerHTML = billsHTML;
    if (tbody2) tbody2.innerHTML = billsHTML;

    updateBillsTotal();
}

function updateBillsTotal() {
    const totalElement = document.getElementById('totalBills');
    if (!totalElement) return;

    const total = state.bills.reduce((sum, bill) => sum + bill.amount, 0);
    totalElement.textContent = formatCurrency(total);
}

function updatePaymentsTable() {
    const tbody = document.getElementById('paymentsTableBody');
    if (!tbody) return;

    tbody.innerHTML = state.payments.map((payment, index) => `
        <tr>
            <td>${formatDate(payment.date)}</td>
            <td>${payment.description}</td>
            <td>${payment.category}</td>
            <td>${formatCurrency(payment.amount)}</td>
            <td>
                <button onclick="deletePayment(${index})" class="cancel-button">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function updateBillsProgress() {
    const progressBar = document.querySelector('.progress');
    const progressText = document.querySelector('.progress-text');
    if (!progressBar || !progressText) return;

    const totalBills = state.bills.reduce((sum, bill) => sum + bill.amount, 0);
    const monthlyIncome = state.income.monthly;
    const percentage = monthlyIncome ? (totalBills / monthlyIncome) * 100 : 0;

    progressBar.style.width = `${Math.min(percentage, 100)}%`;
    progressText.textContent = `${percentage.toFixed(1)}% of Monthly Income`;
}

function updatePaymentStats() {
    const totalPayments = document.getElementById('totalPayments');
    const remainingBudget = document.getElementById('remainingBudget');
    if (!totalPayments || !remainingBudget) return;

    const currentMonthPayments = state.payments.filter(payment => {
        const paymentDate = new Date(payment.date);
        const currentDate = new Date();
        return paymentDate.getMonth() === currentDate.getMonth() &&
               paymentDate.getFullYear() === currentDate.getFullYear();
    });

    const totalAmount = currentMonthPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const remaining = state.income.monthly - totalAmount;

    totalPayments.textContent = formatCurrency(totalAmount);
    remainingBudget.textContent = formatCurrency(remaining);
}

// Payment Management
async function handlePaymentSubmit(e) {
    e.preventDefault();
    
    const payment = {
        date: document.getElementById('paymentDate').value,
        description: document.getElementById('paymentDescription').value,
        category: document.getElementById('paymentCategory').value,
        amount: parseFloat(document.getElementById('paymentAmount').value)
    };

    state.payments.unshift(payment);
    await saveData();
    updateUI();
    closePaymentModal();
    e.target.reset();
}

// Bill Management
async function editBill(index) {
    const bill = state.bills[index];
    const newAmount = prompt('Enter new amount:', bill.amount);
    if (newAmount === null) return;

    const amount = parseFloat(newAmount);
    if (isNaN(amount)) {
        showError('Please enter a valid number');
        return;
    }

    state.bills[index].amount = amount;
    await saveData();
    updateUI();
}

async function deleteBill(index) {
    if (!confirm('Are you sure you want to delete this bill?')) return;
    
    state.bills.splice(index, 1);
    await saveData();
    updateUI();
}

async function deletePayment(index) {
    if (!confirm('Are you sure you want to delete this payment?')) return;
    
    state.payments.splice(index, 1);
    await saveData();
    updateUI();
}

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function displayCurrentDate() {
    if (!dateDisplay) return;
    
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    dateDisplay.textContent = new Date().toLocaleDateString('en-US', options);
}

function showError(message) {
    // You can enhance this with a proper toast/notification system
    alert(message);
}

// Modal Management
function closePaymentModal() {
    if (paymentModal) {
        paymentModal.style.display = 'none';
        paymentForm.reset();
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', initializeApp);
