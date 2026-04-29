// dashboard.js

const BASE_URL = window.location.origin;

let total = 0;
let budget = localStorage.getItem("userBudget") ? parseFloat(localStorage.getItem("userBudget")) : 0;
let myChart;
let allExpenses = [];

const userId = localStorage.getItem("userId");
const username = localStorage.getItem("username");

window.onload = function() {
    if (!userId) { window.location.href = "auth.html"; return; }
    document.getElementById("welcomeMessage").innerText = `Welcome back, ${username}!`;
    document.getElementById("currentBudgetText").innerText = `Current Budget: ₹${budget}`;
    
    const ctx = document.getElementById('expenseChart').getContext('2d');
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: { labels: [], datasets: [{ data: [], backgroundColor: ['#6366f1','#f43f5e','#10b981','#f59e0b','#8b5cf6','#ec4899','#06b6d4','#f97316'], borderWidth: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, cutout: '75%' }
    });

    fetchExpenses();
};

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
    } catch (error) { console.error(error); }
}

async function addExpense() {
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
    } catch (error) { alert("Error"); }
}

async function deleteExpense(id) {
    if (!confirm("Delete?")) return;

    try {
        const response = await fetch(`${BASE_URL}/api/expenses/${id}`, { method: 'DELETE' });
        if (response.ok) fetchExpenses();
    } catch (error) { alert("Error"); }
}

// (बाकी code SAME रहेगा — no change needed)