const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const User = require('./models/User');
const Expense = require('./models/Expense');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Connected to MongoDB Atlas Successfully"))
    .catch((err) => console.error("❌ Connection Error:", err));

// Auth Routes
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const newUser = new User({ username, email, password });
        await newUser.save();
        res.status(201).json({ message: "User registered successfully!" });
    } catch (err) {
        res.status(400).json({ error: "Email or Username already exists." });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, password });
        if (user) res.json({ userId: user._id, username: user.username });
        else res.status(401).json({ error: "Invalid email or password" });
    } catch (err) { res.status(500).json({ error: "Server error" }); }
});

// Expense Routes
app.post('/api/expenses', async (req, res) => {
    try {
        const { description, amount, userId } = req.body;
        const newExpense = new Expense({ user: userId, description, amount });
        await newExpense.save();
        res.status(201).json(newExpense);
    } catch (err) { res.status(500).json({ error: "Failed to save" }); }
});

app.get('/api/expenses/:userId', async (req, res) => {
    try {
        const expenses = await Expense.find({ user: req.params.userId }).sort({ date: -1 });
        res.json(expenses);
    } catch (err) { res.status(500).json({ error: "Failed to fetch" }); }
});

app.delete('/api/expenses/:id', async (req, res) => {
    try {
        await Expense.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted" });
    } catch (err) { res.status(500).json({ error: "Failed to delete" }); }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server is running on http://localhost:${PORT}`));