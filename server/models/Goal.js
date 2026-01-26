const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  description: String,
  totalTasks: {
    type: Number,
    default: 1,
  },
  completedTasks: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  targetDate: String,
  dailyTime: String,
  goalType: String,
  skillLevel: String, // Beginner, Intermediate, Advanced
  totalDays: Number,
  summary: String,
  phases: Array, // [{ phase, weeks, focus }]
  rules: Object,  // { bufferDaysPerWeek, maxTasksPerDay, skipLogic }
  dailyTasks: Array, // Full AI generated roadmap [ { day, tasks: [...] } ]
  fullPlan: Array, // 100% complete day-wise plan [ { day, theme, tasks: [...] } ]
  sop: {
    type: String, // Full AI generated plan/SOP
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Goal', GoalSchema);
