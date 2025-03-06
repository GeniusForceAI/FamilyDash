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

// Theme handling
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    document.body.classList.toggle('light-mode');
}

// Mobile menu handling
function toggleMenu() {
    document.body.classList.toggle('nav-open');
}

// Navigation handling
function navigateToPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    const activeNavItem = document.querySelector(`.nav-item a[href="#${pageId}"]`)?.parentElement;
    if (activeNavItem) {
        activeNavItem.classList.add('active');
    }

    // Close mobile menu if open
    document.body.classList.remove('nav-open');
}

// Initialize event listeners
function initializeApp() {
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Mobile menu toggle
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMenu);
    }

    // Navigation
    document.querySelectorAll('.nav-item a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.getAttribute('href').substring(1);
            navigateToPage(pageId);
            // Update URL hash without triggering scroll
            history.pushState(null, '', `#${pageId}`);
        });
    });

    // Handle initial page load based on URL hash
    const initialPage = window.location.hash.substring(1) || 'dashboard';
    navigateToPage(initialPage);

    // Handle browser back/forward
    window.addEventListener('popstate', () => {
        const pageId = window.location.hash.substring(1) || 'dashboard';
        navigateToPage(pageId);
    });

    // Format date in header
    const dateDisplay = document.querySelector('.date-display');
    if (dateDisplay) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateDisplay.textContent = new Date().toLocaleDateString('en-US', options);
    }

    // Add payment button handlers
    const addPaymentBtn = document.getElementById('addPaymentBtn');
    const addPaymentBtn2 = document.getElementById('addPaymentBtn2');
    [addPaymentBtn, addPaymentBtn2].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', openPaymentModal);
        }
    });

    // Add bill button handlers
    const addBillBtn = document.getElementById('addBillBtn');
    const addBillBtn2 = document.getElementById('addBillBtn2');
    [addBillBtn, addBillBtn2].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', openBillModal);
        }
    });

    // Form handlers
    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm) {
        paymentForm.addEventListener('submit', handlePaymentSubmit);
    }

    // Load initial data
    loadFinancialData();
}

// Financial data handling
let financialData = {
    income: {
        biweekly: 0,
        monthly: 0
    },
    bills: [],
    payments: []
};

async function loadFinancialData() {
    try {
        const response = await fetch('/api/finances');
        if (!response.ok) throw new Error('Failed to load financial data');
        financialData = await response.json();
        updateDashboard();
    } catch (error) {
        console.error('Error loading financial data:', error);
    }
}

function updateDashboard() {
    // Update income display
    document.getElementById('biweeklyIncome').textContent = formatCurrency(financialData.income.biweekly);
    document.getElementById('monthlyIncome').textContent = formatCurrency(financialData.income.monthly);

    // Update bills table
    const billsTableBody = document.getElementById('billsTableBody');
    const billsTableBody2 = document.getElementById('billsTableBody2');
    const billsHTML = financialData.bills.map(bill => `
        <tr>
            <td>${bill.name}</td>
            <td>${formatCurrency(bill.amount)}</td>
            <td>${bill.category}</td>
            <td>
                <button class="action-button" onclick="editBill('${bill.name}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-button" onclick="deleteBill('${bill.name}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');

    if (billsTableBody) billsTableBody.innerHTML = billsHTML;
    if (billsTableBody2) billsTableBody2.innerHTML = billsHTML;

    // Update total bills and progress
    const totalBills = financialData.bills.reduce((sum, bill) => sum + bill.amount, 0);
    document.getElementById('totalBills').textContent = formatCurrency(totalBills);

    const monthlyIncome = financialData.income.monthly;
    const billsPercentage = monthlyIncome > 0 ? (totalBills / monthlyIncome) * 100 : 0;
    
    const progressBar = document.querySelector('.progress');
    if (progressBar) {
        progressBar.style.width = `${Math.min(billsPercentage, 100)}%`;
    }
    
    const progressText = document.querySelector('.progress-text');
    if (progressText) {
        progressText.textContent = `${billsPercentage.toFixed(1)}% of Monthly Income`;
    }

    // Update payments table
    const paymentsTableBody = document.getElementById('paymentsTableBody');
    if (paymentsTableBody) {
        paymentsTableBody.innerHTML = financialData.payments.map(payment => `
            <tr>
                <td>${new Date(payment.date).toLocaleDateString()}</td>
                <td>${payment.description}</td>
                <td>${payment.category}</td>
                <td>${formatCurrency(payment.amount)}</td>
                <td>
                    <button class="action-button" onclick="deletePayment('${payment.date}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // Update payment statistics
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    const monthlyPayments = financialData.payments
        .filter(payment => {
            const paymentDate = new Date(payment.date);
            return paymentDate.getMonth() === thisMonth && paymentDate.getFullYear() === thisYear;
        })
        .reduce((sum, payment) => sum + payment.amount, 0);

    document.getElementById('totalPayments').textContent = formatCurrency(monthlyPayments);
    document.getElementById('remainingBudget').textContent = formatCurrency(monthlyIncome - monthlyPayments);
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Modal handling
function openPaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function openBillModal() {
    const modal = document.getElementById('billModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeBillModal() {
    const modal = document.getElementById('billModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Form handling
async function handlePaymentSubmit(e) {
    e.preventDefault();
    const formData = {
        date: document.getElementById('paymentDate').value,
        description: document.getElementById('paymentDescription').value,
        category: document.getElementById('paymentCategory').value,
        amount: parseFloat(document.getElementById('paymentAmount').value)
    };

    try {
        const response = await fetch('/api/finances', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'payment',
                data: formData
            })
        });

        if (!response.ok) throw new Error('Failed to save payment');
        
        await loadFinancialData();
        closePaymentModal();
        e.target.reset();
    } catch (error) {
        console.error('Error saving payment:', error);
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', initializeApp);
