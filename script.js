// ============================================
// Expense Tracker Data Management
// ============================================

let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let savingsGoals = JSON.parse(localStorage.getItem('savingsGoals')) || [];
let subscriptions = JSON.parse(localStorage.getItem('subscriptions')) || [];

// ============================================
// Navigation & Section Switching
// ============================================

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.getAttribute('data-section');
        switchSection(section);
    });
});

function switchSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    // Show selected section
    document.getElementById(sectionName).classList.add('active');

    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === sectionName) {
            link.classList.add('active');
        }
    });

    // Scroll to top
    window.scrollTo(0, 0);
}

// ============================================
// Format Currency
// ============================================

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

// ============================================
// Budget Calculator
// ============================================

function calculateBudget() {
    const income = parseFloat(document.getElementById('monthlyIncome').value) || 0;

    let totalExpenses = 0;
    const expensesByCategory = {};

    document.querySelectorAll('.expense-input').forEach(input => {
        const amount = parseFloat(input.value) || 0;
        const category = input.getAttribute('data-category');
        totalExpenses += amount;
        expensesByCategory[category] = amount;
    });

    const remainingBalance = income - totalExpenses;

    // Update results
    document.getElementById('totalIncome').textContent = formatCurrency(income);
    document.getElementById('totalExpenses').textContent = formatCurrency(totalExpenses);
    document.getElementById('remainingBalance').textContent = formatCurrency(remainingBalance);

    // Update remaining balance color
    const balanceCard = document.querySelector('.balance-card .result-value');
    if (remainingBalance < 0) {
        balanceCard.style.color = '#ef4444';
    } else {
        balanceCard.style.color = '#10b981';
    }

    // Show results
    document.getElementById('budgetResults').classList.remove('hidden');

    // Generate chart
    generateBudgetChart(expensesByCategory, income);
}

function generateBudgetChart(expenses, income) {
    const chartDiv = document.getElementById('budgetChart');
    chartDiv.innerHTML = '';

    const categoryNames = {
        rent: '🏠 Rent/Mortgage',
        utilities: '⚡ Utilities',
        insurance: '🛡️ Insurance',
        groceries: '🛒 Groceries',
        transportation: '🚗 Transportation',
        entertainment: '🎬 Entertainment'
    };

    const sortedExpenses = Object.entries(expenses)
        .filter(([_, amount]) => amount > 0)
        .sort((a, b) => b[1] - a[1]);

    sortedExpenses.forEach(([category, amount]) => {
        const percentage = (amount / income) * 100;
        const categoryName = categoryNames[category] || category;

        const chartItem = document.createElement('div');
        chartItem.className = 'chart-item';
        chartItem.innerHTML = `
            <div class="chart-label">${categoryName}</div>
            <div class="chart-bar" style="width: ${Math.min(percentage, 100)}%">
                <div class="chart-value">${formatCurrency(amount)} (${percentage.toFixed(1)}%)</div>
            </div>
        `;
        chartDiv.appendChild(chartItem);
    });

    if (sortedExpenses.length === 0) {
        chartDiv.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No expenses to display</p>';
    }
}

// ============================================
// Expense Tracker
// ============================================

function addExpense() {
    const description = document.getElementById('expenseDescription').value;
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const category = document.getElementById('expenseCategory').value;
    const date = document.getElementById('expenseDate').value;

    if (!description || !amount || !date) {
        alert('Please fill in all fields');
        return;
    }

    const expense = {
        id: Date.now(),
        description,
        amount,
        category,
        date
    };

    expenses.unshift(expense);
    localStorage.setItem('expenses', JSON.stringify(expenses));

    // Clear inputs
    document.getElementById('expenseDescription').value = '';
    document.getElementById('expenseAmount').value = '';
    document.getElementById('expenseDate').value = '';

    updateExpenseTracker();
}

function deleteExpense(id) {
    expenses = expenses.filter(exp => exp.id !== id);
    localStorage.setItem('expenses', JSON.stringify(expenses));
    updateExpenseTracker();
}

function clearAllExpenses() {
    if (confirm('Are you sure you want to delete all expenses?')) {
        expenses = [];
        localStorage.setItem('expenses', JSON.stringify(expenses));
        updateExpenseTracker();
    }
}

function updateExpenseTracker() {
    const expenseList = document.getElementById('expenseList');
    const totalSpent = document.getElementById('totalSpent');
    const expenseCount = document.getElementById('expenseCount');
    const avgExpense = document.getElementById('avgExpense');

    // Update stats
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const count = expenses.length;
    const average = count > 0 ? total / count : 0;

    totalSpent.textContent = formatCurrency(total);
    expenseCount.textContent = count;
    avgExpense.textContent = formatCurrency(average);

    // Update expense list
    if (expenses.length === 0) {
        expenseList.innerHTML = '<tr class="empty-row"><td colspan="5">No expenses yet. Start by adding one!</td></tr>';
    } else {
        expenseList.innerHTML = expenses.map(exp => `
            <tr>
                <td>${new Date(exp.date).toLocaleDateString()}</td>
                <td>${exp.description}</td>
                <td>${getCategoryEmoji(exp.category)} ${exp.category.charAt(0).toUpperCase() + exp.category.slice(1)}</td>
                <td>${formatCurrency(exp.amount)}</td>
                <td>
                    <button class="delete-btn" onclick="deleteExpense(${exp.id})">Delete</button>
                </td>
            </tr>
        `).join('');
    }

    // Update category chart
    updateCategoryChart();
}

function getCategoryEmoji(category) {
    const emojis = {
        food: '🍔',
        transportation: '🚗',
        entertainment: '🎬',
        shopping: '🛍️',
        utilities: '⚡',
        health: '🏥',
        education: '📚',
        other: '📌'
    };
    return emojis[category] || '📌';
}

function updateCategoryChart() {
    const categoryChart = document.getElementById('categoryChart');
    categoryChart.innerHTML = '';

    const categoryTotals = {};
    expenses.forEach(exp => {
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });

    const total = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);

    const sortedCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1]);

    sortedCategories.forEach(([category, amount]) => {
        const percentage = (amount / total) * 100;
        const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);

        const chartItem = document.createElement('div');
        chartItem.className = 'chart-item';
        chartItem.innerHTML = `
            <div class="chart-label">${getCategoryEmoji(category)} ${categoryLabel}</div>
            <div class="chart-bar" style="width: ${Math.min(percentage, 100)}%">
                <div class="chart-value">${formatCurrency(amount)} (${percentage.toFixed(1)}%)</div>
            </div>
        `;
        categoryChart.appendChild(chartItem);
    });

    if (sortedCategories.length === 0) {
        categoryChart.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No expenses to display</p>';
    }
}

// ============================================
// Savings Goals
// ============================================

function addSavingsGoal() {
    const name = document.getElementById('goalName').value;
    const target = parseFloat(document.getElementById('goalTarget').value);
    const current = parseFloat(document.getElementById('goalCurrent').value) || 0;
    const date = document.getElementById('goalDate').value;

    if (!name || !target || !date) {
        alert('Please fill in all required fields');
        return;
    }

    const goal = {
        id: Date.now(),
        name,
        target,
        current: Math.min(current, target),
        date
    };

    savingsGoals.push(goal);
    localStorage.setItem('savingsGoals', JSON.stringify(savingsGoals));

    // Clear inputs
    document.getElementById('goalName').value = '';
    document.getElementById('goalTarget').value = '';
    document.getElementById('goalCurrent').value = '';
    document.getElementById('goalDate').value = '';

    updateSavingsGoals();
}

function updateSavingsGoal(id, newAmount) {
    const goal = savingsGoals.find(g => g.id === id);
    if (goal) {
        goal.current = Math.min(newAmount, goal.target);
        localStorage.setItem('savingsGoals', JSON.stringify(savingsGoals));
        updateSavingsGoals();
    }
}

function removeSavingsGoal(id) {
    savingsGoals = savingsGoals.filter(g => g.id !== id);
    localStorage.setItem('savingsGoals', JSON.stringify(savingsGoals));
    updateSavingsGoals();
}

function updateSavingsGoals() {
    const goalsList = document.getElementById('goalsList');

    if (savingsGoals.length === 0) {
        goalsList.innerHTML = '<div class="empty-state"><p>No savings goals yet. Create one to get started!</p></div>';
        return;
    }

    goalsList.innerHTML = savingsGoals.map(goal => {
        const percentage = (goal.current / goal.target) * 100;
        const daysLeft = Math.ceil((new Date(goal.date) - new Date()) / (1000 * 60 * 60 * 24));

        return `
            <div class="goal-card">
                <h4>${goal.name}</h4>
                <div class="goal-info">
                    <span>Current:</span>
                    <span class="goal-amount">${formatCurrency(goal.current)}</span>
                </div>
                <div class="goal-info">
                    <span>Target:</span>
                    <span class="goal-amount">${formatCurrency(goal.target)}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percentage}%"></div>
                </div>
                <div class="progress-text">${percentage.toFixed(1)}% Complete</div>
                <div class="goal-info" style="margin-top: 0.5rem;">
                    <span>Target Date:</span>
                    <span>${new Date(goal.date).toLocaleDateString()}</span>
                </div>
                <div class="goal-info" style="color: ${daysLeft < 30 ? '#ef4444' : 'var(--text-secondary)'}">
                    <span>Days Left:</span>
                    <span>${Math.max(daysLeft, 0)}</span>
                </div>
                <div class="goal-actions">
                    <button class="update-btn" onclick="openUpdateGoal(${goal.id})">Update</button>
                    <button class="remove-goal-btn" onclick="removeSavingsGoal(${goal.id})">Remove</button>
                </div>
            </div>
        `;
    }).join('');
}

function openUpdateGoal(id) {
    const goal = savingsGoals.find(g => g.id === id);
    if (goal) {
        const newAmount = prompt(`Update current amount for "${goal.name}":\n\nCurrent: ${formatCurrency(goal.current)}\nTarget: ${formatCurrency(goal.target)}`, goal.current);
        if (newAmount !== null) {
            updateSavingsGoal(id, parseFloat(newAmount) || goal.current);
        }
    }
}

// ============================================
// Subscriptions Manager
// ============================================

function addSubscription() {
    const name = document.getElementById('subName').value;
    const cost = parseFloat(document.getElementById('subCost').value);
    const billingCycle = document.getElementById('subBillingCycle').value;
    const billingDate = document.getElementById('subBillingDate').value;

    if (!name || !cost || !billingDate) {
        alert('Please fill in all fields');
        return;
    }

    const subscription = {
        id: Date.now(),
        name,
        cost,
        billingCycle,
        billingDate
    };

    subscriptions.push(subscription);
    localStorage.setItem('subscriptions', JSON.stringify(subscriptions));

    // Clear inputs
    document.getElementById('subName').value = '';
    document.getElementById('subCost').value = '';
    document.getElementById('subBillingCycle').value = 'monthly';
    document.getElementById('subBillingDate').value = '';

    updateSubscriptions();
}

function deleteSubscription(id) {
    subscriptions = subscriptions.filter(sub => sub.id !== id);
    localStorage.setItem('subscriptions', JSON.stringify(subscriptions));
    updateSubscriptions();
}

function clearAllSubscriptions() {
    if (confirm('Are you sure you want to delete all subscriptions?')) {
        subscriptions = [];
        localStorage.setItem('subscriptions', JSON.stringify(subscriptions));
        updateSubscriptions();
    }
}

function updateSubscriptions() {
    const subList = document.getElementById('subList');
    const monthlyCostEl = document.getElementById('monthlyCost');
    const annualCostEl = document.getElementById('annualCost');
    const subCountEl = document.getElementById('subCount');

    // Calculate costs
    let monthlyCost = 0;
    subscriptions.forEach(sub => {
        if (sub.billingCycle === 'monthly') {
            monthlyCost += sub.cost;
        } else if (sub.billingCycle === 'quarterly') {
            monthlyCost += sub.cost / 3;
        } else if (sub.billingCycle === 'annual') {
            monthlyCost += sub.cost / 12;
        }
    });

    const annualCost = monthlyCost * 12;

    monthlyCostEl.textContent = formatCurrency(monthlyCost);
    annualCostEl.textContent = formatCurrency(annualCost);
    subCountEl.textContent = subscriptions.length;

    // Update subscription list
    if (subscriptions.length === 0) {
        subList.innerHTML = '<div class="empty-state"><p>No subscriptions added yet. Start tracking them!</p></div>';
    } else {
        subList.innerHTML = subscriptions.map(sub => {
            const daysUntilBilling = Math.ceil((new Date(sub.billingDate) - new Date()) / (1000 * 60 * 60 * 24));
            const isUpcoming = daysUntilBilling <= 7 && daysUntilBilling > 0;

            return `
                <div class="subscription-card">
                    <h5>${sub.name}</h5>
                    <div class="subscription-details">
                        <p><strong>Billing Cycle:</strong> ${sub.billingCycle.charAt(0).toUpperCase() + sub.billingCycle.slice(1)}</p>
                        <p><strong>Next Billing:</strong> ${new Date(sub.billingDate).toLocaleDateString()}</p>
                        ${isUpcoming ? `<p style="color: var(--warning-color); font-weight: 600;">⚠️ Billing in ${daysUntilBilling} days</p>` : ''}
                    </div>
                    <div class="subscription-cost">${formatCurrency(sub.cost)}</div>
                    <div class="subscription-actions">
                        <button class="delete-sub-btn" onclick="deleteSubscription(${sub.id})">Remove</button>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// ============================================
// Set Today's Date as Default
// ============================================

function setDefaultDate(inputId) {
    const today = new Date().toISOString().split('T')[0];
    const input = document.getElementById(inputId);
    if (input && !input.value) {
        input.value = today;
    }
}

// Initialize date inputs
document.addEventListener('DOMContentLoaded', () => {
    setDefaultDate('expenseDate');
    setDefaultDate('subBillingDate');

    // Initialize all data
    updateExpenseTracker();
    updateSavingsGoals();
    updateSubscriptions();
});

// ============================================
// Add Enter Key Support for Inputs
// ============================================

document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        if (document.activeElement.id === 'expenseDescription' ||
            document.activeElement.id === 'expenseAmount' ||
            document.activeElement.id === 'expenseCategory' ||
            document.activeElement.id === 'expenseDate') {
            addExpense();
        }
        if (document.activeElement.id === 'goalName' ||
            document.activeElement.id === 'goalTarget' ||
            document.activeElement.id === 'goalCurrent' ||
            document.activeElement.id === 'goalDate') {
            addSavingsGoal();
        }
        if (document.activeElement.id === 'subName' ||
            document.activeElement.id === 'subCost' ||
            document.activeElement.id === 'subBillingDate') {
            addSubscription();
        }
    }
});
