// auth.js

// --- Configuration ---
const API_URL = window.location.origin + "/api/auth";

// --- State Management ---
let isLoginMode = true;

/**
 * Toggles between Login and Signup UI
 */
function toggleForm() {
    isLoginMode = !isLoginMode;
    const title = document.getElementById("formTitle");
    const toggleText = document.querySelector(".toggle");
    const usernameInput = document.getElementById("username");

    if (isLoginMode) {
        title.innerText = "Login";
        toggleText.innerText = "Don't have an account? Sign up";
        usernameInput.style.display = "none";
    } else {
        title.innerText = "Sign Up";
        toggleText.innerText = "Already have an account? Login";
        usernameInput.style.display = "block";
    }
}

/**
 * Handles both Login and Signup requests
 */
async function handleAuth() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const username = document.getElementById("username").value;

    if (!email || !password) {
        alert("Please fill in all fields");
        return;
    }

    const endpoint = isLoginMode ? "/login" : "/signup";
    const payload = isLoginMode 
        ? { email, password } 
        : { username, email, password };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            if (isLoginMode) {
                localStorage.setItem("userId", data.userId);
                localStorage.setItem("username", data.username);
                window.location.href = "dashboard.html";
            } else {
                alert("Account created! Please login.");
                toggleForm();
            }
        } else {
            alert(data.error || "Authentication failed");
        }
    } catch (err) {
        console.error("Auth Error:", err);
        alert("Server error. Try again later.");
    }
}