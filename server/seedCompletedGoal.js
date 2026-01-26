const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Goal = require('./models/Goal');
const Task = require('./models/Task');

const seedData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    
    // 1. Create a Completed Goal
    const completedGoal = new Goal({
      title: "Master MERN Stack Development",
      description: "Path to becoming a full-stack engineer.",
      totalTasks: 10,
      completedTasks: 10,
      targetDate: "2026-06-30",
      dailyTime: "1 hr",
      goalType: "Career",
      skillLevel: "Beginner",
      totalDays: 10,
      summary: "Mission Accomplished! You have successfully mastered React, Node, Express, and MongoDB. You are now ready to build production-scale applications.",
      sop: "CONGRATULATIONS REPORT:\n\n1. Foundation Phase: Mastered JS ES6+ and Basic CSS/HTML.\n2. Backend Phase: Built robust APIs with Node & Express. Learned MongoDB modeling.\n3. Frontend Phase: Mastered React Hooks, Context API, and State Management.\n4. Final Project: Successfully deployed a full-stack application.\n\nYou have shown incredible consistency over the last 10 days. Keep this momentum for your next career milestone!",
      phases: [
        { phase: "Foundation", weeks: [1, 2], focus: "JavaScript & HTML/CSS Excellence" },
        { phase: "Backend", weeks: [3, 5], focus: "Node.js & MongoDB database architecture" },
        { phase: "Final Stage", weeks: [6, 10], focus: "Full-stack integration & Deployment" }
      ],
      rules: {
        bufferDaysPerWeek: 1,
        maxTasksPerDay: 3,
        skipLogic: "You never skipped a day! Perfect execution."
      }
    });

    const savedGoal = await completedGoal.save();
    console.log('✅ Goal Created:', savedGoal.title);

    // 2. Create 10 Completed Tasks (one for each of the last 10 days)
    const tasks = [];
    for (let i = 0; i < 10; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];

        tasks.push({
            title: `Completed Milestone Day ${10 - i}`,
            status: 'completed',
            time: 60,
            type: 'Action',
            difficulty: 'Medium',
            dayNumber: 10 - i,
            date: dateStr,
            goalId: savedGoal._id
        });
    }

    await Task.insertMany(tasks);
    console.log('✅ 10 Completed Tasks added.');
    console.log('✨ Static "Goal Achieved" report generated successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
