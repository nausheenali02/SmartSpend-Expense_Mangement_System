// dashboard.js

const BASE_URL = window.location.origin;

let total = 0;
let budget = localStorage.getItem("userBudget") ? parseFloat(localStorage.getItem("userBudget")) : 0;
let myChart;
let allExpenses = [];

const userId = localStorage.getItem("userId");
const username = localStorage.getItem("username");

// ---------------- INIT ----------------
window.onload = function() {
    if (!userId) { 
        window.location.href = "auth.html"; 
        return; 
    }

    document.getElementById("welcomeMessage").innerText = `Welcome back, ${username}!`;
    document.getElementById("currentBudgetText").innerText = `Current Budget: ₹${budget}`;
    
    const ctx = document.getElementById('expenseChart').getContext('2d');
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: ['#6366f1','#f43f5e','#10b981','#f59e0b','#8b5cf6','#ec4899','#06b6d4','#f97316'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } },
            cutout: '75%'
        }
    });

    fetchExpenses();
};

// ---------------- FETCH ----------------
async function fetchExpenses() {
    try {
        const response = await fetch(`${BASE_URL}/api/expenses/${userId}`);
        allExpenses = await response.json();
        
        total = 0;
        const chartMap = {};
        const list = document.getElementById("expenseList");
        list.innerHTML = "";

        allExpenses.forEach(exp => {
            updateUIList(exp.description, exp.amount, exp._id);
            total += exp.amount;
            chartMap[exp.description] = (chartMap[exp.description] || 0) + exp.amount;
        });

        document.getElementById("total").innerText = total;

        myChart.data.labels = Object.keys(chartMap);
        myChart.data.datasets[0].data = Object.values(chartMap);
        myChart.update();

        updateRemaining();

    } catch (error) {
        console.error(error);
    }
}

// ---------------- ADD EXPENSE ----------------
window.addExpense = async function() {
    const desc = document.getElementById("desc").value;
    const amount = parseFloat(document.getElementById("amount").value);

    if (!desc || isNaN(amount)) return;

    try {
        const response = await fetch(`${BASE_URL}/api/expenses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description: desc, amount, userId })
        });

        if (response.ok) {
            document.getElementById("input-container").style.display = "none";
            document.getElementById("success-container").style.display = "block";
            fetchExpenses();
        }
    } catch (error) {
        alert("Error adding expense");
    }
};

// ---------------- DELETE ----------------
window.deleteExpense = async function(id) {
    if (!confirm("Delete?")) return;

    try {
        const response = await fetch(`${BASE_URL}/api/expenses/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) fetchExpenses();

    } catch (error) {
        alert("Error deleting");
    }
};

// ---------------- UI ----------------
function updateUIList(desc, amount, id) {
    const list = document.getElementById("expenseList");

    const li = document.createElement("li");
    li.innerHTML = `
        <div class="exp-details">
            <span class="exp-name">${desc}</span>
            <span class="exp-price">₹${amount}</span>
        </div>
        <button class="delete-btn-red" onclick="deleteExpense('${id}')">Delete</button>
    `;

    list.appendChild(li);
}

// ---------------- FORM RESET ----------------
window.resetAddForm = function() {
    document.getElementById("desc").value = "";
    document.getElementById("amount").value = "";
    document.getElementById("input-container").style.display = "block";
    document.getElementById("success-container").style.display = "none";
};

// ---------------- BUDGET ----------------
window.setBudget = function() {
    const val = parseFloat(document.getElementById("budgetInput").value);

    if (isNaN(val) || val <= 0) return;

    budget = val;
    localStorage.setItem("userBudget", budget);

    document.getElementById("currentBudgetText").innerText = `Current Budget: ₹${budget}`;
    updateRemaining();

    alert("Budget Updated!");
};

window.resetBudget = function() {
    budget = 0;
    localStorage.removeItem("userBudget");

    document.getElementById("currentBudgetText").innerText = `Current Budget: ₹0`;
    document.getElementById("remaining").innerText = "Set Budget First";
};

// ---------------- REMAINING ----------------
function updateRemaining() {
    const remDisplay = document.getElementById("remaining");

    if (budget > 0) {
        const rem = budget - total;
        remDisplay.innerText = `₹${rem}`;
        remDisplay.style.color = rem < 0 ? "#f43f5e" : "#6366f1";
    } else {
        remDisplay.innerText = "Set Budget First";
    }
}

// ---------------- NAVIGATION ----------------
window.showSection = function(sectionId) {
    if (sectionId === 'add-expense') resetAddForm();
    if (sectionId === 'history' || sectionId === 'overview') fetchExpenses();

    document.querySelectorAll(".section").forEach(sec => sec.style.display = "none");
    document.getElementById(sectionId).style.display = "block";

    document.querySelectorAll(".sidebar li").forEach(li => li.classList.remove("active"));
    document.getElementById(`nav-${sectionId}`).classList.add("active");
};

// ---------------- LOGOUT ----------------
window.logout = function() {
    localStorage.clear();
    window.location.href = "auth.html";
};

// ---------------- 50-30-20 RULE ----------------
window.calculateSmartBudget = function() {
    const income = parseFloat(document.getElementById("incomeInput").value);
    const suggestion = document.getElementById("smart-suggestion-text");

    if (income > 0) {
        const needs = (income * 0.5).toFixed(0);
        const wants = (income * 0.3).toFixed(0);
        const savings = (income * 0.2).toFixed(0);

        suggestion.innerHTML = 
            `Based on ₹${income}: Spend <b>₹${needs}</b> on Needs, 
             <b>₹${wants}</b> on Wants, and save <b>₹${savings}</b>.`;
    } else {
        suggestion.innerText = "Enter valid income.";
    }
};

// ---------------- PDF EXPORT ----------------
window.exportToPDF = function() {
    if (!window.jspdf) {
        alert("PDF library not loaded");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("SmartSpend Financial Report", 20, 20);

    doc.setFontSize(12);
    doc.text(`User: ${username}`, 20, 30);
    doc.text(`Total Spend: ₹${total}`, 20, 40);

    const tableData = allExpenses.map(exp => [
        exp.description,
        `₹${exp.amount}`,
        new Date(exp.date).toLocaleDateString()
    ]);

    doc.autoTable({
        head: [['Description', 'Amount', 'Date']],
        body: tableData
    });

    doc.save("SmartSpend_Report.pdf");
};
