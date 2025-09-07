// DOM Elements
const transactionForm = document.getElementById('transactionForm');
const transactionsList = document.getElementById('transactionsList');
const balanceElement = document.getElementById('balance');
const incomeElement = document.getElementById('income');
const expensesElement = document.getElementById('expenses');
const typeIncome = document.getElementById('typeIncome');
const typeExpense = document.getElementById('typeExpense');
const incomeFields = document.getElementById('incomeFields');
const expenseFields = document.getElementById('expenseFields');
const addIncomeBtn = document.getElementById('addIncomeBtn');
const addExpenseBtn = document.getElementById('addExpenseBtn');
const separateToggle = document.getElementById('separateToggle');
let editingTransactionId = null;

// Initialize transactions from localStorage or empty array
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

// Function to parse a date string in YYYY-MM-DD format to a local date
function parseLocalDate(dateString) {
    if (!dateString) return new Date();
    
    // Split the date string into components
    const [year, month, day] = dateString.split('-').map(Number);
    
    // Create a date in local timezone (time will be 00:00:00 local time)
    // Note: Month is 0-indexed in JavaScript Date (0 = January, 11 = December)
    return new Date(year, month - 1, day);
}

// Function to format a date as YYYY-MM-DD in local time
function formatLocalDate(date) {
    if (!(date instanceof Date)) {
        // If it's already a properly formatted string, return it
        if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return date;
        }
        // Otherwise, try to parse it
        date = new Date(date);
    }
    
    // If the date is invalid, return today's date
    if (isNaN(date.getTime())) {
        console.warn('Invalid date provided to formatLocalDate, using current date');
        date = new Date();
    }
    
    // Get local date components
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

// Function to get current date in YYYY-MM-DD format in local time
function getCurrentDateString() {
    return formatLocalDate(new Date());
}

// Function to format date for storage (ensures YYYY-MM-DD format)
function formatDateForStorage(dateString) {
    if (!dateString) return getCurrentDateString();
    
    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
    }
    
    // Otherwise, parse and format
    const date = parseLocalDate(dateString);
    return formatLocalDate(date);
}

// Function to get month/year info from a date string (YYYY-MM-DD)
function getMonthYearFromDate(dateString) {
    const date = parseLocalDate(dateString);
    
    // Debug log to verify the values
    console.log('getMonthYearFromDate - Input:', dateString, 'Parsed date:', date);
    console.log('Local date string:', date.toLocaleDateString());
    
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 1-12
    
    return {
        month: month,
        monthName: date.toLocaleString('default', { month: 'long' }),
        year: year,
        monthYear: `${year}-${String(month).padStart(2, '0')}`
    };
}

// Function to format date for display
function formatDisplayDate(dateString) {
    if (!dateString) return '';
    
    const date = parseLocalDate(dateString);
    return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Set up event listeners
    setupEventListeners();
    
    // Set today's date as default
    const today = getCurrentDateString();
    document.getElementById('incomeDate').value = today;
    document.getElementById('date').value = today;
    
    // Set up event delegation
    setupEventDelegation();
    
    // Initial render
    renderTransactions();
    updateTotals();
});

function setupEventDelegation() {
    // Handle edit and delete button clicks using event delegation
    document.addEventListener('click', function(e) {
        // Handle delete button clicks
        const deleteBtn = e.target.closest('.delete-btn');
        if (deleteBtn) {
            e.preventDefault();
            const id = deleteBtn.dataset.id;
            if (id) {
                deleteTransaction(id);
            }
            return;
        }
        
        // Handle edit button clicks
        const editBtn = e.target.closest('.edit-btn');
        if (editBtn) {
            e.preventDefault();
            const id = editBtn.dataset.id;
            if (id) {
                editTransaction(id);
            }
            return;
        }
    });
}

function setupEventListeners() {
    // Toggle between income and expense forms
    if (typeIncome && typeExpense) {
        typeIncome.addEventListener('change', toggleTransactionType);
        typeExpense.addEventListener('change', toggleTransactionType);
    }
    
    // Form submission
    if (addIncomeBtn) {
        addIncomeBtn.addEventListener('click', addIncome);
    }
    
    if (addExpenseBtn) {
        addExpenseBtn.addEventListener('click', addExpense);
    }
    
    // Export buttons
    if (document.getElementById('exportPdfBtn')) {
        document.getElementById('exportPdfBtn').addEventListener('click', exportToPdf);
    }
    
    if (document.getElementById('exportCsvBtn')) {
        document.getElementById('exportCsvBtn').addEventListener('click', exportToCsv);
    }
    
    if (separateToggle) {
        separateToggle.addEventListener('change', renderTransactions);
    }
}

function toggleTransactionType() {
    if (typeIncome.checked) {
        incomeFields.style.display = 'block';
        expenseFields.style.display = 'none';
    } else {
        incomeFields.style.display = 'none';
        expenseFields.style.display = 'block';
    }
}

function addIncome(e) {
    e.preventDefault();
    
    const amountInput = document.getElementById('amount');
    const noteInput = document.getElementById('note');
    const dateInput = document.getElementById('incomeDate');
    
    const amount = parseFloat(amountInput.value);
    const note = noteInput.value.trim();
    const date = formatDateForStorage(dateInput.value); // Format the date for storage
    
    if (!amount || isNaN(amount) || !date) {
        alert('Please fill in all required fields');
        return;
    }
    
    const monthYear = getMonthYearFromDate(date);
    
    if (editingTransactionId) {
        // Update existing transaction
        const index = transactions.findIndex(t => t.id === editingTransactionId);
        if (index !== -1) {
            transactions[index] = {
                ...transactions[index],
                amount: amount.toFixed(2),
                date: date,
                description: note || '',  // Use note as description if provided
                note: '',  // Clear note since it's now the description
                ...monthYear
            };
        }
    } else {
        // Add new transaction
        const transaction = {
            id: Date.now().toString(),
            type: 'income',
            amount: amount.toFixed(2),
            date: date,
            description: note || '',  // Use note as description if provided
            note: '',  // Clear note since it's now the description
            ...monthYear
        };
        transactions.unshift(transaction);
    }
    
    // Save and update UI
    saveTransactions();
    resetForm();
    renderTransactions();
    updateTotals();
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('addTransactionModal'));
    if (modal) modal.hide();
}

function addExpense(e) {
    e.preventDefault();
    
    const amountInput = document.getElementById('expenseAmount');
    const descriptionInput = document.getElementById('description');
    const categorySelect = document.getElementById('category');
    const noteInput = document.getElementById('expenseNote');
    const dateInput = document.getElementById('date');
    
    const amount = parseFloat(amountInput.value);
    const description = descriptionInput.value.trim();
    const category = categorySelect.value;
    const note = noteInput.value.trim();
    const date = formatDateForStorage(dateInput.value); // Format the date for storage
    
    // Only amount, category, and date are required
    if (!amount || isNaN(amount) || !category || !date) {
        alert('Please fill in all required fields: amount, category, and date');
        return;
    }
    
    const monthYear = getMonthYearFromDate(date);
    
    if (editingTransactionId) {
        // Update existing transaction
        const index = transactions.findIndex(t => t.id === editingTransactionId);
        if (index !== -1) {
            transactions[index] = {
                ...transactions[index],
                amount: amount.toFixed(2),
                date: date,
                description: description || 'Expense', // Default description if empty
                category: category,
                note: note || '',
                ...monthYear
            };
        }
    } else {
        // Add new transaction
        const transaction = {
            id: Date.now().toString(),
            type: 'expense',
            amount: amount.toFixed(2),
            date: date,
            description: description || 'Expense', // Default description if empty
            category: category,
            note: note || '',
            ...monthYear
        };
        transactions.unshift(transaction);
    }
    
    // Save and update UI
    saveTransactions();
    resetForm();
    renderTransactions();
    updateTotals();
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('addTransactionModal'));
    if (modal) modal.hide();
}

function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

function renderTransactions() {
    if (!transactionsList) return;
    
    const separateByType = separateToggle.checked;
    
    if (transactions.length === 0) {
        transactionsList.innerHTML = `
            <div class="text-center py-5 text-muted">
                <i class="bi bi-receipt" style="font-size: 2.5rem;"></i>
                <p class="mt-2 mb-0">No transactions yet</p>
                <small>Click "Add Transaction" to get started</small>
            </div>
        `;
        return;
    }
    
    // Clear existing content
    transactionsList.innerHTML = '';
    
    if (separateByType) {
        // Separate by type
        const incomeTransactions = transactions.filter(t => t.type === 'income');
        const expenseTransactions = transactions.filter(t => t.type === 'expense');
        
        // Render income section
        if (incomeTransactions.length > 0) {
            const incomeSection = document.createElement('div');
            incomeSection.className = 'transaction-section income';
            incomeSection.innerHTML = `
                <h6>Income</h6>
                <div class="income-transactions"></div>
            `;
            transactionsList.appendChild(incomeSection);
            incomeTransactions.forEach(transaction => {
                addTransactionToDOM(transaction, incomeSection.querySelector('.income-transactions'));
            });
        }
        
        // Render expense section
        if (expenseTransactions.length > 0) {
            const expenseSection = document.createElement('div');
            expenseSection.className = 'transaction-section expense';
            expenseSection.innerHTML = `
                <h6>Expenses</h6>
                <div class="expense-transactions"></div>
            `;
            transactionsList.appendChild(expenseSection);
            expenseTransactions.forEach(transaction => {
                addTransactionToDOM(transaction, expenseSection.querySelector('.expense-transactions'));
            });
        }
    } else {
        // Original rendering (mixed)
        const sortedTransactions = [...transactions].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );
        sortedTransactions.forEach(transaction => {
            addTransactionToDOM(transaction, transactionsList);
        });
    }
}

function addTransactionToDOM(transaction, container = transactionsList) {
    if (!container) return;
    
    const transactionElement = document.createElement('div');
    transactionElement.className = `transaction-item ${transaction.type} mb-3 p-3 border rounded`;
    transactionElement.dataset.id = transaction.id;
    
    const formattedDate = formatDisplayDate(transaction.date);
    const amountSign = transaction.type === 'income' ? '' : '-';
    const amountClass = transaction.type === 'income' ? 'text-success' : 'text-danger';
    const typeLabel = transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1);
    
    transactionElement.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
            <div class="flex-grow-1 pe-3">
                <div class="d-flex align-items-baseline gap-2 mb-1">
                    <span class="fw-bold text-uppercase small" style="letter-spacing: 0.5px;">${typeLabel}</span>
                    <span class="text-muted small">${formattedDate}</span>
                </div>
                ${transaction.category || transaction.description ? `
                    <div class="d-flex flex-column gap-1 mb-1">
                        ${transaction.category ? `
                            <span class="badge bg-light text-dark" style="display: inline-block; text-align: left; padding: 0.25em 0.6em; font-size: 0.85em; font-weight: 400; line-height: 1.2; white-space: normal; vertical-align: baseline; border-radius: 0.25rem; border: 1px solid #dee2e6; margin-right: auto;">${transaction.category}</span>
                        ` : ''}
                        ${transaction.description ? `
                            <span class="text-muted small">${transaction.description}</span>
                        ` : ''}
                    </div>
                ` : ''}
                ${transaction.note ? `
                    <div class="small text-muted">${transaction.note}</div>
                ` : ''}
            </div>
            <div class="text-end">
                <div class="fw-bold ${amountClass}">
                    ${amountSign}${formatCurrency(transaction.amount)}
                </div>
                <div class="mt-2">
                    <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${transaction.id}">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${transaction.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    container.appendChild(transactionElement);
}

function deleteTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        transactions = transactions.filter(t => t.id !== id);
        saveTransactions();
        renderTransactions();
        updateTotals();
    }
}

function editTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    
    editingTransactionId = id;
    
    // Show the appropriate tab and form
    if (transaction.type === 'income') {
        typeIncome.checked = true;
        typeExpense.checked = false;
        incomeFields.style.display = 'block';
        expenseFields.style.display = 'none';
        
        // Populate income form
        document.getElementById('amount').value = transaction.amount;
        document.getElementById('note').value = transaction.note || '';
        document.getElementById('incomeDate').value = transaction.date;
        
        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('addTransactionModal'));
        modal.show();
    } else {
        typeExpense.checked = true;
        typeIncome.checked = false;
        expenseFields.style.display = 'block';
        incomeFields.style.display = 'none';
        
        // Populate expense form
        document.getElementById('expenseAmount').value = transaction.amount;
        document.getElementById('expenseNote').value = transaction.note || '';
        document.getElementById('expenseCategory').value = transaction.category || '';
        document.getElementById('expenseDescription').value = transaction.description || '';
        document.getElementById('date').value = transaction.date;
        
        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('addTransactionModal'));
        modal.show();
    }
}

function resetForm() {
    // Reset form fields
    document.getElementById('amount').value = '';
    document.getElementById('note').value = '';
    document.getElementById('expenseAmount').value = '';
    document.getElementById('description').value = '';
    document.getElementById('category').value = '';
    document.getElementById('expenseNote').value = '';
    
    // Reset date inputs
    const today = getCurrentDateString();
    document.getElementById('incomeDate').value = today;
    document.getElementById('date').value = today;
    
    // Reset button texts
    addIncomeBtn.textContent = 'Add Income';
    addExpenseBtn.textContent = 'Add Expense';
    
    // Reset editing state
    editingTransactionId = null;
}

function updateTotals() {
    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        
    const expenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        
    const balance = income - expenses;
    
    // Update the UI
    if (balanceElement) {
        balanceElement.textContent = formatCurrency(balance);
        // Update balance color: black for positive, red for negative
        balanceElement.className = balance >= 0 ? 'text-dark' : 'text-danger';
    }
    
    if (incomeElement) {
        incomeElement.textContent = formatCurrency(income);
        // Keep income text color as green
        incomeElement.className = 'text-success';
    }
    
    if (expensesElement) {
        expensesElement.textContent = formatCurrency(expenses);
        // Keep expenses text color as red
        expensesElement.className = 'text-danger';
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function exportToPdf() {
    const separateByType = separateToggle.checked;
    
    // Group transactions by month and year
    const grouped = {};
    
    // Only include months that have transactions
    transactions.forEach(transaction => {
        const { monthYear, monthName, year } = getMonthYearFromDate(transaction.date);
        if (!grouped[monthYear]) {
            grouped[monthYear] = {
                monthName,
                year,
                transactions: []
            };
        }
        grouped[monthYear].transactions.push(transaction);
    });
    
    // Sort months in descending order (newest first) and filter out empty months
    const sortedMonths = Object.entries(grouped)
        .filter(([_, data]) => data.transactions.length > 0)
        .sort(([a], [b]) => b.localeCompare(a));
    
    // If no transactions, show a message
    if (sortedMonths.length === 0) {
        alert('No transactions to export');
        return;
    }
    
    // Create HTML content for PDF with improved styling
    let htmlContent = `
        <style>
            body { 
                font-family: Arial, sans-serif; 
                padding: 20px;
                color: #333;
            }
            h1 { 
                color: #2c3e50; 
                text-align: center; 
                margin-bottom: 5px;
                font-size: 24px;
            }
            .subtitle {
                text-align: center;
                color: #7f8c8d;
                margin-bottom: 20px;
                font-size: 14px;
            }
            .month-header {
                color: #2c3e50;
                background-color: #f8f9fa;
                padding: 8px 15px;
                margin: 25px 0 15px 0;
                border-radius: 4px;
                font-size: 18px;
                font-weight: bold;
                border-left: 4px solid #3498db;
            }
            .section-header {
                color: #2c3e50;
                font-size: 16px;
                font-weight: 600;
                margin: 20px 0 10px 0;
                padding-bottom: 5px;
                border-bottom: 2px solid #eee;
            }
            .income-section .section-header { color: #198754; }
            .expense-section .section-header { color: #dc3545; }
            table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-bottom: 30px;
                font-size: 13px;
            }
            th { 
                background-color: #f8f9fa;
                color: #2c3e50;
                font-weight: 600;
                padding: 10px;
                text-align: left;
                border-bottom: 2px solid #dee2e6;
            }
            td { 
                padding: 10px;
                border-bottom: 1px solid #eee;
                vertical-align: top;
            }
            .income { 
                color: #27ae60;
                font-weight: 500;
            }
            .expense { 
                color: #e74c3c;
                font-weight: 500;
            }
            .total-row { 
                font-weight: bold;
                background-color: #f8f9fa;
            }
            .net-total {
                font-size: 15px;
                padding: 12px 10px;
            }
            .text-end {
                text-align: right;
            }
            .category {
                display: inline-block;
                background: #f0f0f0;
                color: #495057;
                padding: 0.25em 0.6em;
                font-size: 0.85em;
                font-weight: 400;
                line-height: 1.2;
                text-align: center;
                white-space: normal;
                vertical-align: baseline;
                border-radius: 0.25rem;
                border: 1px solid #dee2e6;
            }
        </style>
        <h1>Expense Report</h1>
        <div class="subtitle">
            Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            ${separateByType ? '• Transactions Separated by Type' : ''}
        </div>
    `;
    
    // Add transactions grouped by month
    sortedMonths.forEach(([monthYear, data]) => {
        const { monthName, year, transactions } = data;
        
        // Add month/year header
        htmlContent += `<div class="month-header">${monthName} ${year}</div>`;
        
        if (separateByType) {
            // Separate transactions by type
            const incomeTransactions = transactions.filter(t => t.type === 'income');
            const expenseTransactions = transactions.filter(t => t.type === 'expense');
            
            // Income section
            if (incomeTransactions.length > 0) {
                htmlContent += `
                    <div class="income-section">
                        <div class="section-header">Income</div>
                        ${renderTransactionTable(incomeTransactions, false)}
                    </div>
                `;
            }
            
            // Expense section
            if (expenseTransactions.length > 0) {
                htmlContent += `
                    <div class="expense-section">
                        <div class="section-header">Expenses</div>
                        ${renderTransactionTable(expenseTransactions, false)}
                    </div>
                `;
            }
        } else {
            // Original combined view
            htmlContent += renderTransactionTable(transactions, true);
        }
        
        // Add monthly totals
        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
            
        const totalExpenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
            
        const net = totalIncome - totalExpenses;
        
        htmlContent += `
            <table>
                <tbody>
                    <tr class="total-row">
                        <td colspan="4" class="text-end">Total Income:</td>
                        <td class="text-end income">+${formatCurrency(totalIncome)}</td>
                    </tr>
                    <tr class="total-row">
                        <td colspan="4" class="text-end">Total Expenses:</td>
                        <td class="text-end expense">-${formatCurrency(totalExpenses)}</td>
                    </tr>
                    <tr class="total-row net-total">
                        <td colspan="4" class="text-end">Net Total for ${monthName}:</td>
                        <td class="text-end ${net >= 0 ? 'income' : 'expense'}">
                            ${net >= 0 ? '+' : ''}${formatCurrency(Math.abs(net))}
                        </td>
                    </tr>
                </tbody>
            </table>
        `;
    });
    
    // Create a new window with the HTML content
    const win = window.open('', '_blank');
    win.document.write(`
        <html>
            <head>
                <title>Expense Report</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body>
                ${htmlContent}
                <script>
                    // Auto-print when the PDF is loaded
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                        }, 500);
                    };
                </script>
            </body>
        </html>
    `);
    win.document.close();
    
    // Helper function to render transaction table
    function renderTransactionTable(transactions, showTypeColumn) {
        const typeColumn = showTypeColumn ? '<th>Type</th>' : '';
        let tableHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        ${typeColumn}
                        <th>Description</th>
                        <th>Category</th>
                        <th>Note</th>
                        <th class="text-end">Amount</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        // Add transactions
        transactions.forEach(transaction => {
            const typeCell = showTypeColumn 
                ? `<td>${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</td>` 
                : '';
                
            tableHTML += `
                <tr>
                    <td>${formatDisplayDate(transaction.date)}</td>
                    ${typeCell}
                    <td>${transaction.description || 'N/A'}</td>
                    <td>${transaction.category ? `<span class="category">${transaction.category}</span>` : 'N/A'}</td>
                    <td>${transaction.note || ''}</td>
                    <td class="text-end ${transaction.type}">
                        ${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}
                    </td>
                </tr>
            `;
        });
        
        tableHTML += `
                </tbody>
            </table>
        `;
        
        return tableHTML;
    }
}

function exportToCsv() {
    // Create CSV header
    let csvContent = 'Date,Type,Description,Category,Note,Amount\n';
    
    // Sort transactions by date (newest first)
    const sortedTransactions = [...transactions].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    
    // Add transactions to CSV
    sortedTransactions.forEach(transaction => {
        const row = [
            `"${transaction.date}"`,
            `"${transaction.type}"`,
            `"${(transaction.description || '').replace(/"/g, '""')}"`,
            `"${(transaction.category || '').replace(/"/g, '""')}"`,
            `"${(transaction.note || '').replace(/"/g, '""')}"`,
            transaction.amount
        ];
        csvContent += row.join(',') + '\n';
    });
    
    // Create a Blob with the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Create a link to download the file
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `expense-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    // Add the link to the document and trigger the download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

const transactionModal = document.getElementById('addTransactionModal');
if (transactionModal) {
    transactionModal.addEventListener('hidden.bs.modal', function () {
        resetForm();
    });
}
