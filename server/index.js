const express = require('express');
console.log('--- MISSION START: GoalPilot Server is initializing ---');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Database Connection
const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
  console.error('❌ FATAL ERROR: MONGO_URI is not defined in environment variables.');
  process.exit(1);
}

console.log('Connecting to MongoDB Atlas...');
mongoose.connect(mongoURI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => {
    console.log('❌ MongoDB Connection Error:', err.message);
    if (err.message.includes('authentication failed')) {
      console.log('👉 TIP: Please check if user "Lalit" has correct permissions in MongoDB Atlas.');
    }
  });

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api', require('./routes/api'));

app.get('/', (req, res) => {
  res.send('GoalPilot API is running...');
});

app.listen(PORT, () => {
  console.log(`🚀 MISSION LIVE: Running on port ${PORT}`);
});
