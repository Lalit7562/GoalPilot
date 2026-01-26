const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'skipped'],
    default: 'pending',
  },
  time: Number, // in minutes
  type: String, // e.g. Learn, Practice
  difficulty: String, // Easy, Medium, Hard
  dayNumber: Number,
  date: {
    type: String, // YYYY-MM-DD
    default: () => new Date().toISOString().split('T')[0],
  },
  goalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
  },
});

module.exports = mongoose.model('Task', TaskSchema);
