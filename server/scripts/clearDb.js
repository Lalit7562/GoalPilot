require('dotenv').config();
const mongoose = require('mongoose');
const Goal = require('../models/Goal');
const Task = require('../models/Task');

const clearData = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected.");

    console.log("Clearing Goals...");
    await Goal.deleteMany({});
    
    console.log("Clearing Tasks...");
    await Task.deleteMany({});

    console.log("✅ Database cleared successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Error clearing DB:", error);
    process.exit(1);
  }
};

clearData();
