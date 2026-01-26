const express = require('express');
const router = express.Router();
const Goal = require('../models/Goal');
const Task = require('../models/Task');
const { generateGoalPlan, generateDailyTasks } = require('../config/gemini');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware to all routes in this file
router.use(authMiddleware);

// [POST] Create a new Goal with AI Plan
router.post('/goals/generate', async (req, res) => {
  try {
    const { title, description, targetDate, dailyTime, goalType, skillLevel } = req.body;
    const userId = req.user.userId;
    
    // Calculate total days
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = Math.abs(target - today);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const generationParams = { title, targetDate, dailyTime, goalType, totalDays, skillLevel };
    console.log("[API] Generation Params:", JSON.stringify(generationParams));
    
    // 1. Generate Plan via Gemini
    const aiResponse = await generateGoalPlan(generationParams);
    console.log("[API] AI Response keys:", Object.keys(aiResponse));
    
    // 2. Save Goal
    const goalData = { 
      title: aiResponse.goalTitle || title, 
      description: description || `AI Generated ${goalType} Goal`,
      targetDate,
      dailyTime: aiResponse.dailyTime || dailyTime,
      goalType: aiResponse.goalType || goalType,
      skillLevel: aiResponse.skillLevel || skillLevel,
      totalDays: aiResponse.totalDays || totalDays,
      summary: aiResponse.summary,
      phases: aiResponse.phases || [],
      rules: aiResponse.rules || {},
      dailyTasks: aiResponse.dailyTasks || [],
      fullPlan: aiResponse.fullPlan || [],
      sop: aiResponse.sop || aiResponse.summary,
      totalTasks: (aiResponse.fullPlan || []).reduce((acc, d) => acc + (d.tasks ? d.tasks.length : 0), 0) || (aiResponse.dailyTasks || []).reduce((acc, d) => acc + (d.tasks ? d.tasks.length : 0), 0)
    };

    console.log("Attempting to save Goal to DB:", goalData.title);
    
    // Deactivate all other goals for this user
    await Goal.updateMany({ userId }, { isActive: false });

    // Set new goal as active
    goalData.isActive = true;
    goalData.userId = userId;
    const goal = new Goal(goalData);
    await goal.save();

    // 3. Save Today's Tasks (Day 1)
    const day1Tasks = (aiResponse.fullPlan || []).find(d => d.day === 1)?.tasks || (aiResponse.dailyTasks || []).find(d => d.day === 1)?.tasks || [];
    const tasksToSave = day1Tasks.map(t => ({
      title: t.title,
      goalId: goal._id,
      status: 'pending',
      time: t.time || 30,
      type: t.type || 'Practice',
      difficulty: t.difficulty || 'Easy',
      dayNumber: 1
    }));
    
    console.log(`Saving ${tasksToSave.length} tasks for Day 1...`);
    const savedTasks = await Task.insertMany(tasksToSave);

    console.log(`✅ SUCCESS: Goal "${goal.title}" saved with ID ${goal._id}`);
    res.status(201).json({ goal, tasks: savedTasks });
  } catch (error) {
    console.error("AI Route Error:", error);
    res.status(500).json({ error: "Failed to generate plan. Please try again later.", details: error.message });
  }
});

// [GET] Get all Goals
router.get('/goals', async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// [GET] Get a specific Goal by ID
router.get('/goals/:id', async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!goal) return res.status(404).json({ error: "Goal not found" });
    const tasks = await Task.find({ goalId: req.params.id });
    res.json({ goal, tasks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// [DELETE] Delete a Goal and its Tasks
router.delete('/goals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const goal = await Goal.findOneAndDelete({ _id: id, userId });
    
    if (!goal) return res.status(404).json({ error: "Goal not found" });
    await Task.deleteMany({ goalId: id });
    
    res.json({ message: "Goal deleted successfully", id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// [POST] Create a new Goal
router.post('/goals', async (req, res) => {
  try {
    const { title, description } = req.body;
    const goal = new Goal({ title, description, userId: req.user.userId });
    await goal.save();
    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// [GET] Get all Tasks for today
router.get('/tasks/today', async (req, res) => {
  try {
    const { mood } = req.query;
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let tasks = await Task.find({ date: todayStr });
    const activeGoals = await Goal.find({ userId: req.user.userId, isActive: true });
    
    // Filter tasks based on the user's active goals
    const goalIds = activeGoals.map(g => g._id.toString());
    tasks = tasks.filter(t => goalIds.includes(t.goalId.toString()));
    
    let coachMessage = "";
    for (const goal of activeGoals) {
      const goalTasks = tasks.filter(t => t.goalId.toString() === goal._id.toString());
      
      if (goalTasks.length === 0) {
        // 1. Calculate Yesterday's Status
        const yesterdayTasks = await Task.find({ 
          goalId: goal._id, 
          date: yesterdayStr 
        });
        const completedCount = yesterdayTasks.filter(t => t.status === 'completed').length;
        const totalCount = yesterdayTasks.length;
        const yesterdayStatus = totalCount > 0 && completedCount === totalCount ? 'completed' : 'skipped';

        // 2. Calculate Current Day & Phase
        const start = new Date(goal.createdAt);
        const today = new Date();
        const diff = Math.abs(today - start);
        const dayNum = Math.ceil(diff / (1000 * 60 * 60 * 24)) || 1;
        
        const currentPhase = (goal.phases || []).find(p => dayNum/7 >= p.weeks[0] && dayNum/7 <= p.weeks[1])?.phase || "In Progress";

        console.log(`AI Coaching needed for Goal: ${goal.title}, Day: ${dayNum}`);

        // 3. Generate Dynamic Tasks via AI
        const dailyCoachPlan = await generateDailyTasks({
          goalTitle: goal.title,
          goalType: goal.goalType,
          currentDay: dayNum,
          totalDays: goal.totalDays,
          dailyTime: goal.dailyTime,
          currentPhase,
          yesterdayStatus,
          mood
        });

        // 4. Save and return tasks
        if (dailyCoachPlan && dailyCoachPlan.tasks) {
          const newTasks = dailyCoachPlan.tasks.map(t => ({
            title: t.title,
            goalId: goal._id,
            status: 'pending',
            time: t.time || 30,
            type: t.type || 'Action',
            difficulty: t.difficulty || 'Medium',
            dayNumber: dayNum,
            date: todayStr
          }));
          const saved = await Task.insertMany(newTasks);
          
          if (!coachMessage) coachMessage = dailyCoachPlan.coachMessage;
          tasks = [...tasks, ...saved];
        }
      }
    }

    res.json({ tasks, coachMessage });
  } catch (error) {
    console.error("Fetch Today Tasks Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// [PATCH] Update Task status and Goal progress
router.patch('/tasks/:id/progress', async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findByIdAndUpdate(req.params.id, { status }, { new: true });
    
    // Update linked goal progress if task has goalId
    if (task && task.goalId) {
      const goal = await Goal.findOne({ _id: task.goalId, userId: req.user.userId });
      if (goal) {
        const completedCount = await Task.countDocuments({ goalId: task.goalId, status: 'completed' });
        await Goal.findByIdAndUpdate(task.goalId, { completedTasks: completedCount });
      }
    }
    
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// [GET] Get Analytics and Stats
router.get('/analytics/stats', async (req, res) => {
  try {
    const userId = req.user.userId;
    const userGoals = await Goal.find({ userId }).select('_id');
    const goalIds = userGoals.map(g => g._id);
    const tasks = await Task.find({ goalId: { $in: goalIds } }).sort({ date: -1 });
    
    // 1. Calculate 7-day history
    const history = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      history[dateStr] = { completed: 0, total: 0 };
    }

    tasks.forEach(t => {
      if (history[t.date]) {
        history[t.date].total++;
        if (t.status === 'completed') history[t.date].completed++;
      }
    });

    // 2. Calculate Streak
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    const uniqueDates = [...new Set(tasks.filter(t => t.status === 'completed').map(t => t.date))].sort().reverse();
    
    let checkDate = new Date();
    // If nothing today, check from yesterday
    let dateStr = checkDate.toISOString().split('T')[0];
    if (!uniqueDates.includes(dateStr)) {
        checkDate.setDate(checkDate.getDate() - 1);
        dateStr = checkDate.toISOString().split('T')[0];
    }

    for (let i = 0; i < uniqueDates.length; i++) {
      if (uniqueDates.includes(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
        dateStr = checkDate.toISOString().split('T')[0];
      } else {
        break;
      }
    }

    const totalCompleted = tasks.filter(t => t.status === 'completed').length;

    // 3. Check if yesterday was missed
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const missedYesterday = history[yesterdayStr] && history[yesterdayStr].total > 0 && history[yesterdayStr].completed < history[yesterdayStr].total;

    res.json({ 
      history: Object.keys(history).map(date => ({ date, ...history[date] })).reverse(),
      streak,
      totalCompleted,
      missedYesterday
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// [GET] Get AI Dashboard Summary
router.get('/analytics/summary', async (req, res) => {
  try {
    const userId = req.user.userId;
    const activeGoal = await Goal.findOne({ isActive: true, userId });
    
    // If no active goal but goals exist, activate the latest one
    if (!activeGoal) {
       const latest = await Goal.findOne({ userId }).sort({ createdAt: -1 });
       if (latest) {
          latest.isActive = true;
          await latest.save();
          return res.redirect('/api/analytics/summary'); // Retry
       }
       return res.status(404).json({ error: "No active goal found." });
    }

    const otherGoals = await Goal.find({ _id: { $ne: activeGoal._id }, userId }).select('title goalType totalDays completedTasks phases');

    const allTasks = await Task.find({ goalId: activeGoal._id });
    
    // 1. Progress Stats
    const totalDays = activeGoal.totalDays;
    const start = new Date(activeGoal.createdAt);
    const today = new Date();
    const dayNum = Math.ceil(Math.abs(today - start) / (1000 * 60 * 60 * 24)) || 1;
    
    const completedTasks = allTasks.filter(t => t.status === 'completed');
    const daysCompleted = new Set(completedTasks.map(t => t.date)).size;
    
    // 2. Weekly Rate (Last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weeklyTasks = allTasks.filter(t => new Date(t.createdAt) >= sevenDaysAgo);
    const weeklyCompleted = weeklyTasks.filter(t => t.status === 'completed').length;
    const weeklyRate = weeklyTasks.length > 0 ? Math.round((weeklyCompleted / weeklyTasks.length) * 100) : 0;

    // 3. Average Time
    const totalTime = completedTasks.reduce((acc, t) => acc + (t.time || 0), 0);
    const avgTime = daysCompleted > 0 ? `${Math.round(totalTime / daysCompleted)}m` : "0m";

    // 4. Streak & Today Status
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTasks = allTasks.filter(t => t.date === todayStr);
    const todayStatus = todayTasks.length > 0 && todayTasks.every(t => t.status === 'completed') ? 'completed' : 'pending';

    // 5. Current Phase
    const currentPhase = (activeGoal.phases || []).find(p => dayNum/7 >= p.weeks[0] && dayNum/7 <= p.weeks[1])?.phase || "Operational";

    // 6. Missed Days
    const tasksGroupedByDate = {};
    allTasks.forEach(t => {
      if (!tasksGroupedByDate[t.date]) tasksGroupedByDate[t.date] = [];
      tasksGroupedByDate[t.date].push(t);
    });
    const daysMissed = Object.keys(tasksGroupedByDate).filter(date => {
      if (date === todayStr) return false;
      return tasksGroupedByDate[date].some(t => t.status !== 'completed');
    }).length;

    // Generate Summary via AI
    const { generateDashboardSummary } = require('../config/gemini');
    const summary = await generateDashboardSummary({
      goalTitle: activeGoal.title,
      goalType: activeGoal.goalType,
      totalDays,
      currentDay: dayNum,
      daysCompleted: activeGoal.completedTasks || 0,
      daysMissed,
      currentStreak: daysCompleted, // Temporary: ideally use business logic streak
      weeklyRate,
      avgTime,
      currentPhase,
      todayStatus
    });

    res.json({ ...summary, goalId: activeGoal._id, otherGoals });
  } catch (error) {
    console.error("Dashboard Summary Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// [POST] Generate Smart Notification content
router.post('/notifications/generate', async (req, res) => {
  try {
    const { userName, mood, timeOfDay } = req.body;
    
    // Gather Context
    const userId = req.user.userId;
    const activeGoal = await Goal.findOne({ userId }).sort({ createdAt: -1 });
    if (!activeGoal) return res.json({ title: "Start a Mission! 🚀", body: "Set your first goal to begin the journey." });

    const allTasks = await Task.find({ goalId: activeGoal._id });
    const completedTasks = allTasks.filter(t => t.status === 'completed');
    const daysCompleted = new Set(completedTasks.map(t => t.date)).size;
    
    // Streak Calculation (simplified)
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTasks = allTasks.filter(t => t.date === todayStr);
    const todayStatus = todayTasks.length > 0 && todayTasks.every(t => t.status === 'completed') ? 'completed' : 
                        todayTasks.length > 0 ? 'in_progress' : 'not_started';
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const yesterdayTasks = allTasks.filter(t => t.date === yesterdayStr);
    const yesterdayStatus = yesterdayTasks.length > 0 && yesterdayTasks.every(t => t.status === 'completed') ? 'completed' : 'skipped';

    // Weekly Rate
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weeklyTasks = allTasks.filter(t => new Date(t.createdAt) >= sevenDaysAgo);
    const weeklyCompleted = weeklyTasks.filter(t => t.status === 'completed').length;
    const weeklyRate = weeklyTasks.length > 0 ? Math.round((weeklyCompleted / weeklyTasks.length) * 100) : 0;

    const start = new Date(activeGoal.createdAt);
    const today = new Date();
    const dayNum = Math.ceil(Math.abs(today - start) / (1000 * 60 * 60 * 24)) || 1;

    const { generateSmartNotification } = require('../config/gemini');
    
    const notification = await generateSmartNotification({
      userName,
      goalTitle: activeGoal.title,
      goalType: activeGoal.goalType,
      currentDay: dayNum,
      totalDays: activeGoal.totalDays,
      todayStatus,
      yesterdayStatus,
      currentStreak: daysCompleted, // using days completed as proxy for streak for now
      weeklyRate,
      timeOfDay: timeOfDay || 'morning',
      mood
    });

    res.json(notification);
  } catch (error) {
    console.error("Notification Route Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// [PATCH] Activate a Goal
router.patch('/goals/:id/activate', async (req, res) => {
  try {
    const userId = req.user.userId;
    await Goal.updateMany({ userId }, { isActive: false });
    const goal = await Goal.findOneAndUpdate({ _id: req.params.id, userId }, { isActive: true }, { new: true });
    if (!goal) return res.status(404).json({ error: "Goal not found" });
    res.json(goal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
