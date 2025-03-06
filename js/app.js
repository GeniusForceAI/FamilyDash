// Theme handling
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

// API endpoints
const API_BASE = 'http://localhost:8000';  // FastAPI server port
const API = {
    GET_FINANCIAL_DATA: `${API_BASE}/api/finances`,
    UPDATE_FINANCIAL_DATA: `${API_BASE}/api/finances`
};

// Check for saved theme preference
const savedTheme = localStorage.getItem('theme') || 'dark';
body.className = `${savedTheme}-mode`;

themeToggle.addEventListener('click', () => {
    const newTheme = body.className.includes('dark') ? 'light' : 'dark';
    body.className = `${newTheme}-mode`;
    localStorage.setItem('theme', newTheme);
});

// Data management
let financialData = null;
let currentEditItem = null;

async function loadFinancialData() {
    try {
        const response = await fetch(API.GET_FINANCIAL_DATA, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            mode: 'cors'
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        financialData = await response.json();
        updateUI();
    } catch (error) {
        console.error('Error loading financial data:', error);
        document.getElementById('errorMessage').textContent = `Failed to load data: ${error.message}`;
    }
}

function updateUI() {
    if (!financialData) return;

    // Update income display
    document.getElementById('biweeklyIncome').textContent = formatCurrency(financialData.income.biweekly);
    document.getElementById('monthlyIncome').textContent = formatCurrency(financialData.income.monthly);

    // Update bills table
    const billsTableBody = document.getElementById('billsTableBody');
    billsTableBody.innerHTML = '';

    let totalBills = 0;

    financialData.bills.forEach((bill, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${bill.name}</td>
            <td>${formatCurrency(bill.amount)}</td>
            <td>${bill.category}</td>
            <td class="action-buttons">
                <button class="edit-button" onclick="editBill(${index})">✏️</button>
            </td>
        `;
        billsTableBody.appendChild(row);
        totalBills += bill.amount;
    });

    document.getElementById('totalBills').textContent = formatCurrency(totalBills);
}

// Form handling
const addBillForm = document.getElementById('addBillForm');

addBillForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const newBill = {
        name: document.getElementById('billName').value,
        amount: parseFloat(document.getElementById('billAmount').value),
        category: document.getElementById('billCategory').value
    };

    financialData.bills.push(newBill);
    
    await saveFinancialData();
    addBillForm.reset();

    // Add animation to the new row
    const lastRow = document.getElementById('billsTableBody').lastElementChild;
    lastRow.style.animation = 'fadeIn 0.5s ease-in';
});

// Edit functionality
const modal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const editAmountInput = document.getElementById('editAmount');

function editIncome(type) {
    currentEditItem = { type: 'income', incomeType: type };
    const currentAmount = financialData.income[type];
    editAmountInput.value = currentAmount;
    openModal();
}

function editBill(index) {
    currentEditItem = { type: 'bill', index };
    const bill = financialData.bills[index];
    editAmountInput.value = bill.amount;
    openModal();
}

function openModal() {
    modal.classList.add('active');
    editAmountInput.focus();
}

function closeModal() {
    modal.classList.remove('active');
    currentEditItem = null;
}

editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newAmount = parseFloat(editAmountInput.value);

    if (currentEditItem.type === 'income') {
        financialData.income[currentEditItem.incomeType] = newAmount;
        if (currentEditItem.incomeType === 'biweekly') {
            financialData.income.monthly = newAmount * 2;
        }
    } else if (currentEditItem.type === 'bill') {
        financialData.bills[currentEditItem.index].amount = newAmount;
    }

    await saveFinancialData();
    closeModal();
});

// Save functionality
async function saveFinancialData() {
    try {
        const response = await fetch(API.UPDATE_FINANCIAL_DATA, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            mode: 'cors',
            body: JSON.stringify(financialData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to save data');
        }
        
        const savedData = await response.json();
        financialData = savedData;
        updateUI();
    } catch (error) {
        console.error('Error saving financial data:', error);
        document.getElementById('errorMessage').textContent = `Failed to save changes: ${error.message}`;
    }
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Add some animations
document.querySelectorAll('.floating-card').forEach(card => {
    card.style.animation = 'float 6s ease-in-out infinite';
});

// Initialize the application
loadFinancialData();

// Close modal when clicking outside
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});
