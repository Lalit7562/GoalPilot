const mongoose = require('mongoose');
const Goal = require('./models/Goal');
const Task = require('./models/Task');

const pass = 'Lalit@7562';
const mongoURI = `mongodb+srv://GoalPilot:${encodeURIComponent(pass)}@cluster0.ql42rro.mongodb.net/goalpilot?retryWrites=true&w=majority`;

async function seedData() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to DB for seeding...');

    // Clear existing data
    await Goal.deleteMany({});
    await Task.deleteMany({});

    // Create a Goal
    const goal = await Goal.create({
      title: 'Master React Native',
      description: 'Learn navigation, state management and APIs',
      totalTasks: 3,
      completedTasks: 0
    });

    // Create Tasks for Today
    const today = new Date().toISOString().split('T')[0];
    
    await Task.create([
      { title: 'Learn React Hooks', status: 'pending', date: today, goalId: goal._id },
      { title: 'Setup Redux Toolkit', status: 'pending', date: today, goalId: goal._id },
      { title: 'Connect to MongoDB', status: 'completed', date: today, goalId: goal._id },
    ]);

    console.log('✅ Dummy data added successfully!');
    process.exit();
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedData();
