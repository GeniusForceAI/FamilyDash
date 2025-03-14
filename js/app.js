// Domain for API calls - using config from config.js
const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8000/api'
    : 'https://baker-finances-backend.up.railway.app/api';

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
    
    // Add secondary payment button handler
    const addPaymentBtn2 = document.getElementById('addPaymentBtn2');
    if (addPaymentBtn2) {
        addPaymentBtn2.addEventListener('click', openPaymentModal);
    }

    // Add bill button handlers
    const addBillBtn = document.getElementById('addBillBtn');
    if (addBillBtn) {
        addBillBtn.addEventListener('click', openBillModal);
    }
    
    // Add secondary bill button handler
    const addBillBtn2 = document.getElementById('addBillBtn2');
    if (addBillBtn2) {
        addBillBtn2.addEventListener('click', openBillModal);
    }
    
    // Edit income button handler
    const editIncomeBtn = document.getElementById('editIncomeBtn');
    if (editIncomeBtn) {
        editIncomeBtn.addEventListener('click', openIncomeModal);
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
    
    const incomeForm = document.getElementById('incomeForm');
    if (incomeForm) {
        incomeForm.addEventListener('submit', handleIncomeSubmit);
    }
}

// Load and update data
async function loadFinancialData() {
    try {
        console.log('Fetching financial data from /api/finances...');
        const response = await fetch(`${apiBaseUrl}/finances`, {
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

    // Use the biweekly income from state for calculations
    const biweeklyIncomeValue = state.income.biweekly;
    const billsPercentage = biweeklyIncomeValue > 0 ? (totalBills / biweeklyIncomeValue) * 100 : 0;
    
    const progressBar = document.querySelector('.progress');
    if (progressBar) {
        progressBar.style.width = `${Math.min(billsPercentage, 100)}%`;
    }
    
    const progressText = document.querySelector('.progress-text');
    if (progressText) {
        progressText.textContent = `${billsPercentage.toFixed(1)}% of Biweekly Income`;
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
        // Reset form for adding a new payment
        const form = document.getElementById('paymentForm');
        if (form) form.reset();
        
        // Set default date to today
        const dateInput = document.getElementById('paymentDate');
        if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
        
        // Reset edit mode
        const editModeInput = document.getElementById('paymentEditMode');
        if (editModeInput) editModeInput.value = 'add';
        
        const originalDateInput = document.getElementById('paymentOriginalDate');
        if (originalDateInput) originalDateInput.value = '';
        
        // Update submit button text
        const submitBtn = document.getElementById('paymentSubmitBtn');
        if (submitBtn) submitBtn.textContent = 'Add Payment';
        
        // Display modal
        modal.style.display = 'flex';
    }
}

function closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) {
        modal.style.display = 'none';
        // Reset form
        const form = document.getElementById('paymentForm');
        if (form) form.reset();
    }
}

function openBillModal() {
    const modal = document.getElementById('billModal');
    if (modal) {
        // Reset form for adding a new bill
        const form = document.getElementById('billForm');
        if (form) form.reset();
        
        // Reset edit mode
        const editModeInput = document.getElementById('billEditMode');
        if (editModeInput) editModeInput.value = 'add';
        
        const originalNameInput = document.getElementById('billOriginalName');
        if (originalNameInput) originalNameInput.value = '';
        
        // Update modal title and submit button text
        const modalTitle = document.getElementById('billModalTitle');
        if (modalTitle) modalTitle.textContent = 'Add Bill';
        
        const submitBtn = document.getElementById('billSubmitBtn');
        if (submitBtn) submitBtn.textContent = 'Add Bill';
        
        // Display modal
        modal.style.display = 'flex';
    }
}

function closeBillModal() {
    const modal = document.getElementById('billModal');
    if (modal) {
        modal.style.display = 'none';
        // Reset form
        const form = document.getElementById('billForm');
        if (form) form.reset();
    }
}

function openIncomeModal() {
    const modal = document.getElementById('incomeModal');
    if (modal) {
        // Pre-fill with current values
        const biweeklyInput = document.getElementById('biweeklyIncomeInput');
        const monthlyInput = document.getElementById('monthlyIncomeInput');
        
        if (biweeklyInput) biweeklyInput.value = state.income.biweekly;
        if (monthlyInput) monthlyInput.value = state.income.monthly;
        
        // Setup auto-calculation
        setupIncomeCalculation();
        
        modal.style.display = 'flex';
    }
}

function closeIncomeModal() {
    const modal = document.getElementById('incomeModal');
    if (modal) {
        modal.style.display = 'none';
        // Reset form
        const form = document.getElementById('incomeForm');
        if (form) form.reset();
    }
}

// Add event listeners for income inputs to auto-calculate
function setupIncomeCalculation() {
    const biweeklyInput = document.getElementById('biweeklyIncomeInput');
    const monthlyInput = document.getElementById('monthlyIncomeInput');
    
    if (biweeklyInput && monthlyInput) {
        // When biweekly income changes, update monthly income
        biweeklyInput.addEventListener('input', function() {
            const biweeklyValue = parseFloat(this.value) || 0;
            // Monthly is approximately 2.17 times biweekly (26 biweekly periods / 12 months)
            monthlyInput.value = (biweeklyValue * 26 / 12).toFixed(2);
        });
        
        // When monthly income changes, update biweekly income
        monthlyInput.addEventListener('input', function() {
            const monthlyValue = parseFloat(this.value) || 0;
            // Biweekly is approximately monthly divided by 2.17
            biweeklyInput.value = (monthlyValue * 12 / 26).toFixed(2);
        });
    }
}

// Edit functions
function editBill(billName) {
    // Find the bill in state
    const bill = state.bills.find(b => b.name === billName);
    if (!bill) return;
    
    // Set form values
    const nameInput = document.getElementById('billName');
    const categorySelect = document.getElementById('billCategory');
    const amountInput = document.getElementById('billAmount');
    const editModeInput = document.getElementById('billEditMode');
    const originalNameInput = document.getElementById('billOriginalName');
    const modalTitle = document.getElementById('billModalTitle');
    const submitBtn = document.getElementById('billSubmitBtn');
    
    if (nameInput) nameInput.value = bill.name;
    if (categorySelect) categorySelect.value = bill.category;
    if (amountInput) amountInput.value = bill.amount;
    if (editModeInput) editModeInput.value = 'edit';
    if (originalNameInput) originalNameInput.value = bill.name;
    if (modalTitle) modalTitle.textContent = 'Edit Bill';
    if (submitBtn) submitBtn.textContent = 'Update Bill';
    
    // Open the modal
    openBillModal();
}

function editPayment(paymentDate) {
    // Find the payment in state
    const payment = state.payments.find(p => p.date === paymentDate);
    if (!payment) return;
    
    // Set form values
    const dateInput = document.getElementById('paymentDate');
    const descriptionInput = document.getElementById('paymentDescription');
    const categorySelect = document.getElementById('paymentCategory');
    const amountInput = document.getElementById('paymentAmount');
    const editModeInput = document.getElementById('paymentEditMode');
    const originalDateInput = document.getElementById('paymentOriginalDate');
    const submitBtn = document.getElementById('paymentSubmitBtn');
    
    if (dateInput) dateInput.value = payment.date;
    if (descriptionInput) descriptionInput.value = payment.description;
    if (categorySelect) categorySelect.value = payment.category;
    if (amountInput) amountInput.value = payment.amount;
    if (editModeInput) editModeInput.value = 'edit';
    if (originalDateInput) originalDateInput.value = payment.date;
    
    // Update modal title and button
    const modalTitle = document.querySelector('#paymentModal .card-header h2');
    if (modalTitle) modalTitle.textContent = 'Edit Payment';
    if (submitBtn) submitBtn.textContent = 'Update Payment';
    
    // Open the modal
    const modal = document.getElementById('paymentModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Delete functions
function deleteBill(billName) {
    if (confirm(`Are you sure you want to delete the bill "${billName}"?`)) {
        // Remove the bill from state
        state.bills = state.bills.filter(bill => bill.name !== billName);
        
        // Update the server
        updateFinancialData();
    }
}

function deletePayment(paymentDate) {
    if (confirm('Are you sure you want to delete this payment?')) {
        // Remove the payment from state
        state.payments = state.payments.filter(payment => payment.date !== paymentDate);
        
        // Update the server
        updateFinancialData();
    }
}

// Helper function to update financial data
async function updateFinancialData() {
    const updatedData = {
        income: state.income,
        bills: state.bills,
        payments: state.payments
    };
    
    try {
        const response = await fetch(`${apiBaseUrl}/finances`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(updatedData)
        });
        
        if (!response.ok) throw new Error('Failed to update financial data');
        
        // Update UI
        updateDashboard();
    } catch (error) {
        console.error('Error updating financial data:', error);
    }
}

// Form handling
async function handlePaymentSubmit(e) {
    e.preventDefault();
    
    // Get form data
    const paymentDate = document.getElementById('paymentDate').value;
    const paymentDescription = document.getElementById('paymentDescription').value;
    const paymentCategory = document.getElementById('paymentCategory').value;
    const paymentAmount = parseFloat(document.getElementById('paymentAmount').value);
    
    // Check if we're editing or adding
    const editMode = document.getElementById('paymentEditMode')?.value === 'edit';
    const originalDate = document.getElementById('paymentOriginalDate')?.value;
    
    if (editMode && originalDate) {
        // Find and update the existing payment
        const index = state.payments.findIndex(p => p.date === originalDate);
        if (index !== -1) {
            state.payments[index] = {
                date: paymentDate,
                description: paymentDescription,
                category: paymentCategory,
                amount: paymentAmount
            };
        }
    } else {
        // Add new payment
        state.payments.push({
            date: paymentDate,
            description: paymentDescription,
            category: paymentCategory,
            amount: paymentAmount
        });
    }
    
    // Update server and UI
    await updateFinancialData();
    closePaymentModal();
}

async function handleBillSubmit(e) {
    e.preventDefault();
    
    // Get form data
    const billName = document.getElementById('billName').value;
    const billCategory = document.getElementById('billCategory').value;
    const billAmount = parseFloat(document.getElementById('billAmount').value);
    
    // Check if we're editing or adding
    const editMode = document.getElementById('billEditMode').value === 'edit';
    const originalName = document.getElementById('billOriginalName').value;
    
    if (editMode && originalName) {
        // Find and update the existing bill
        const index = state.bills.findIndex(b => b.name === originalName);
        if (index !== -1) {
            state.bills[index] = {
                name: billName,
                category: billCategory,
                amount: billAmount
            };
        }
    } else {
        // Add new bill
        state.bills.push({
            name: billName,
            category: billCategory,
            amount: billAmount
        });
    }
    
    // Update server and UI
    await updateFinancialData();
    closeBillModal();
}

async function handleIncomeSubmit(e) {
    e.preventDefault();
    
    // Get form data
    const biweeklyIncome = parseFloat(document.getElementById('biweeklyIncomeInput').value);
    const monthlyIncome = parseFloat(document.getElementById('monthlyIncomeInput').value);
    
    // Update state
    state.income.biweekly = biweeklyIncome;
    state.income.monthly = monthlyIncome;
    
    // Update server and UI
    await updateFinancialData();
    closeIncomeModal();
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded -  app');
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
