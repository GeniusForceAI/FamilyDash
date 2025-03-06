// Domain for API calls
const domain = "http://localhost:8000";

// State Management
let state = {
    income: {
        biweekly: 0,
        monthly: 0
    },
    bills: [],
    payments: []
};

// DOM Elements
const menuToggle = document.getElementById('menuToggle');
const themeToggle = document.getElementById('themeToggle');
const sideNav = document.querySelector('.side-nav');
const dateDisplay = document.querySelector('.date-display');

// Theme handling
function toggleTheme() {
    const isDarkMode = document.body.classList.toggle('dark-mode');
    document.body.classList.toggle('light-mode', !isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
}

// Mobile menu handling
function toggleMenu() {
    document.body.classList.toggle('nav-open');
}

// Initialize event listeners
function initializeApp() {
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Apply saved theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.classList.toggle('dark-mode', savedTheme === 'dark');
    document.body.classList.toggle('light-mode', savedTheme === 'light');

    // Mobile menu toggle
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMenu);
    }

    // Format date in header
    const dateDisplay = document.querySelector('.date-display');
    if (dateDisplay) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateDisplay.textContent = new Date().toLocaleDateString('en-US', options);
    }

    // Add payment button handlers
    const addPaymentBtn = document.getElementById('addPaymentBtn');
    if (addPaymentBtn) {
        addPaymentBtn.addEventListener('click', openPaymentModal);
    }

    // Add bill button handlers
    const addBillBtn = document.getElementById('addBillBtn');
    if (addBillBtn) {
        addBillBtn.addEventListener('click', openBillModal);
    }

    // Form handlers
    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm) {
        paymentForm.addEventListener('submit', handlePaymentSubmit);
    }

    const billForm = document.getElementById('billForm');
    if (billForm) {
        billForm.addEventListener('submit', handleBillSubmit);
    }
}

// Load and update data
async function loadFinancialData() {
    try {
        console.log('Fetching financial data from /api/finances...');
        const response = await fetch(`${domain}/api/finances`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        if (!response.ok) {
            console.error('Server response not ok:', {
                status: response.status,
                statusText: response.statusText,
                url: response.url
            });
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`Failed to load financial data: ${response.status} ${response.statusText}`);
        }

        console.log('Successfully received response from server');
        const data = await response.json();
        console.log('Parsed financial data:', data);

        // Update state with new data
        state.income = data.income;
        state.bills = data.bills;
        state.payments = data.payments;
        
        console.log('Updated application state:', state);
        updateDashboard();
    } catch (error) {
        console.error('Error loading financial data:', error);
        // Show error in UI
        const dashboardError = document.getElementById('dashboardError');
        if (dashboardError) {
            dashboardError.textContent = 'Failed to load financial data. Please try refreshing the page.';
            dashboardError.style.display = 'block';
        }
    }
}

function updateDashboard() {
    // Update income display
    const biweeklyIncome = document.getElementById('biweeklyIncome');
    const monthlyIncomeElement = document.getElementById('monthlyIncome');
    if (biweeklyIncome) biweeklyIncome.textContent = formatCurrency(state.income.biweekly);
    if (monthlyIncomeElement) monthlyIncomeElement.textContent = formatCurrency(state.income.monthly);

    // Update bills table
    const billsTableBody = document.getElementById('billsTableBody');
    if (billsTableBody) {
        billsTableBody.innerHTML = state.bills.map(bill => `
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
    }

    // Update total bills and progress
    const totalBills = state.bills.reduce((sum, bill) => sum + bill.amount, 0);
    const totalBillsElement = document.getElementById('totalBills');
    if (totalBillsElement) {
        totalBillsElement.textContent = formatCurrency(totalBills);
    }

    // Use the monthly income from state for calculations
    const monthlyIncome = state.income.monthly;
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
        paymentsTableBody.innerHTML = state.payments.map(payment => `
            <tr>
                <td>${new Date(payment.date).toLocaleDateString()}</td>
                <td>${payment.description}</td>
                <td>${payment.category}</td>
                <td>${formatCurrency(payment.amount)}</td>
                <td>
                    <button class="action-button" onclick="editPayment('${payment.date}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-button" onclick="deletePayment('${payment.date}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(amount);
}

// Modal handling
function openPaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) {
        modal.style.display = 'flex';
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
        modal.style.display = 'flex';
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
    const form = e.target;
    const formData = new FormData(form);

    // Update state with new payment
    const newPayment = {
        date: formData.get('date'),
        description: formData.get('description'),
        category: formData.get('category'),
        amount: parseFloat(formData.get('amount'))
    };

    // Add new payment to state
    state.payments.push(newPayment);

    // Create updated data object
    const updatedData = {
        income: state.income,
        bills: state.bills,
        payments: state.payments
    };

    try {
        const response = await fetch(`${domain}/api/finances`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(updatedData)
        });

        if (!response.ok) throw new Error('Failed to update financial data');

        // Close modal and update UI
        closePaymentModal();
        updateDashboard();
    } catch (error) {
        console.error('Error updating financial data:', error);
        // Remove the payment we just added since the update failed
        state.payments.pop();
    }
}

async function handleBillSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    // Update state with new bill
    const newBill = {
        name: formData.get('name'),
        amount: parseFloat(formData.get('amount')),
        category: formData.get('category')
    };

    // Add new bill to state
    state.bills.push(newBill);

    // Create updated data object
    const updatedData = {
        income: state.income,
        bills: state.bills,
        payments: state.payments
    };

    try {
        const response = await fetch(`${domain}/api/finances`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(updatedData)
        });

        if (!response.ok) throw new Error('Failed to update financial data');

        // Close modal and update UI
        closeBillModal();
        updateDashboard();
    } catch (error) {
        console.error('Error updating financial data:', error);
        // Remove the bill we just added since the update failed
        state.bills.pop();
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded - initializing app');
    alert('DOM fully loaded - initializing app');
    initializeApp();
    
    // Explicitly call loadFinancialData to ensure API call is made
    console.log('Loading financial data...');
    loadFinancialData();
});

// Also try to load data immediately in case DOMContentLoaded already fired
console.log('Script loaded - checking if DOM is already loaded');
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('DOM already loaded - initializing app immediately');
    setTimeout(() => {
        initializeApp();
        loadFinancialData();
    }, 1);
}
