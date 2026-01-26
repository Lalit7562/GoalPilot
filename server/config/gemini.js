const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// Manage multiple API Keys
const apiKeys = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2
].filter(key => key && key.trim().length > 0);

let currentKeyIndex = 0;

console.log(`[AI-CORE] Initialized with ${apiKeys.length} API Keys.`);

// Helper to get a ready-to-use Gemini Model with automatic rotation
const getAIModel = (modelName = "gemini-2.5-flash") => {
  const genAI = new GoogleGenerativeAI(apiKeys[currentKeyIndex]);
  return genAI.getGenerativeModel({ model: modelName });
};

// Wrapper to retry with another key if rate limited (429)
const callWithRotation = async (operation, retryCount = 0) => {
  try {
    return await operation(getAIModel());
  } catch (error) {
    // Check for Rate Limit (429) or Quota errors
    const isRateLimit = error.status === 429 || error.message?.includes('429') || error.message?.includes('quota');
    
    if (isRateLimit && retryCount < apiKeys.length - 1) {
      currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
      console.warn(`⚠️ [AI-ROTATION] Rate limit hit. Switching to Key #${currentKeyIndex + 1}...`);
      return await callWithRotation(operation, retryCount + 1);
    }
    
    throw error;
  }
};

const generateGoalPlan = async (details) => {
  const { title, targetDate, dailyTime, goalType, totalDays, skillLevel } = details;
  
  return await callWithRotation(async (model) => {
    // Ensure totalDays is at least 1
    const safeTotalDays = Math.max(1, totalDays);

    const prompt = `
      You are the "GoalPilot Mission Commander". Create a 100% COMPLETE execution plan for a user's goal.
      User Goal: "${title}"
      Duration: ${safeTotalDays} days
      Daily Time: ${dailyTime}
      Level: ${skillLevel}

      Rules:
      1. Tone: Hinglish (supportive, mission commander).
      2. Comprehensive: Every day from Day 1 to Day ${safeTotalDays} must be logically mapped.
      3. Format: Return a JSON object with "fullPlan" array. 
         Each item: { "day": number, "theme": "string", "tasks": [{ "title": "string", "time": number }] }

      JSON Structure:
      {
        "goalTitle": "${title}",
        "totalDays": ${safeTotalDays},
        "summary": "Strategic vision in Hinglish...",
        "fullPlan": [
          { "day": 1, "theme": "Kickoff", "tasks": [{"title": "Initial Setup", "time": 30}] }
        ],
        "phases": [{ "phase": "Phase Name", "weeks": [1, 2], "focus": "Focus Area" }],
        "rules": { "bufferDaysPerWeek": 1, "maxTasksPerDay": 3, "skipLogic": "Hinglish advice" }
      }
      CRITICAL: Return ONLY valid JSON.
    `;

    console.log(`[AI] Generating plan for ${title} using Key #${currentKeyIndex + 1}...`);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) text = jsonMatch[0];

    return JSON.parse(text);
  }).catch(error => {
    console.error("Gemini Goal Plan Error:", error);
    return {
      goalTitle: title,
      totalDays: totalDays,
      summary: `Abhi roadmap generate nahi ho paya, but aapka target set hai! 🚀`,
      fullPlan: [{ day: 1, theme: "Self-Start", tasks: [{ title: `Research basics of ${title}`, time: 30 }] }],
      phases: [{ phase: "Kickoff", weeks: [1, 1], focus: "Fundamentals" }],
      rules: { bufferDaysPerWeek: 1, maxTasksPerDay: 3, skipLogic: "Stay consistent." }
    };
  });
};

const generateDailyTasks = async (context) => {
  const { goalTitle, goalType, currentDay, totalDays, dailyTime, currentPhase, yesterdayStatus, mood } = context;
  
  return await callWithRotation(async (model) => {
    const prompt = `
      You are the "GoalPilot Mission Commander". guide the user daily.
      Based on the user's plan and mood, generate TODAY's actionable mission.
      Tone: Hinglish. Specificity: High.
      
      User Goal: ${goalTitle} (Day ${currentDay}/${totalDays})
      Mood: ${mood || 'Neutral'}
      Time: ${dailyTime}

      Return JSON:
      {
        "day": ${currentDay},
        "focus": "Brief focus in Hinglish",
        "microHabit": "Tiny 2-min win",
        "tasks": [
          { "title": "Action Verb + Result", "time": 20, "type": "Practice", "difficulty": "Easy" }
        ],
        "coachMessage": "Short message in Hinglish"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(text);
  }).catch(error => {
    console.error("Daily Generation Error:", error);
    return {
      day: currentDay,
      focus: "Keep moving forward",
      tasks: [{ title: `Continue work on ${goalTitle}`, time: 30, type: "Practice", difficulty: "Medium" }],
      coachMessage: "One small step today, one giant leap tomorrow! 🚀"
    };
  });
};

const generateDashboardSummary = async (context) => {
  const { goalTitle, totalDays, currentDay, daysCompleted, daysMissed, currentStreak, weeklyRate, avgTime, currentPhase, todayStatus } = context;
  
  return await callWithRotation(async (model) => {
    const prompt = `
      You are the "GoalPilot Mission Commander". Analyze user cockpit. Tone: Analytical & Hinglish.
      Goal: ${goalTitle}
      Completed: ${daysCompleted}/${totalDays}
      Streak: ${currentStreak} days
      
      Return JSON:
      {
        "goalTitle": "${goalTitle}",
        "progressPercentage": ${Math.round((daysCompleted / totalDays) * 100)},
        "dayStatusText": "Day ${currentDay} ka safar",
        "streakText": "${currentStreak} Day Streak",
        "aiInsight": "Insight in supportive Hinglish...",
        "primaryAction": "Next win..."
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(text);
  }).catch(error => {
    console.error("Summary Generation Error:", error);
    return {
      goalTitle,
      progressPercentage: 0,
      aiInsight: "You're doing great! Keep it up. 🚀",
      primaryAction: "Complete today's priority task."
    };
  });
};

const generateSmartNotification = async (context) => {
  const { userName, goalTitle, currentDay, mood } = context;
  
  return await callWithRotation(async (model) => {
    const prompt = `
      Generate ONE short mission notification. Tone: Friendly, Hinglish, Not robotic.
      User: ${userName}, Goal: ${goalTitle}, Day: ${currentDay}, Mood: ${mood}
      Return JSON: { "title": "str", "message": "str", "cta": "str" }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(text);
  }).catch(error => {
    return { title: "Keep Going! 🚀", message: `Time to work on ${goalTitle}.`, cta: "Open App" };
  });
};

module.exports = { generateGoalPlan, generateDailyTasks, generateDashboardSummary, generateSmartNotification };
