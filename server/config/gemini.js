const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateGoalPlan = async (details) => {
  const { title, targetDate, dailyTime, goalType, totalDays, skillLevel } = details;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
      3. Strategy: 
         - If duration <= 14 days: List EVERY day individually in "fullPlan".
         - If duration > 14 days: Group consecutive days with similar tasks (e.g. "Day 5-7") but ensure the "day" field in JSON correctly marks the start of that group.
      4. Format: Return a JSON object with "fullPlan" array. 
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
      
      CRITICAL: Return ONLY valid JSON. No markdown, no extra text.
    `;

    console.log(`[AI] Generating plan for ${title} (${safeTotalDays} days)...`);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Improved JSON extraction
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }

    try {
      const parsed = JSON.parse(text);
      console.log(`[AI] Successfully generated ${parsed.fullPlan?.length} plan segments.`);
      return parsed;
    } catch (parseError) {
      console.error("[AI] JSON Parse Error. Raw text snippet:", text.substring(0, 100));
      throw parseError;
    }
  } catch (error) {
    console.error("Gemini Goal Plan Error:", error);
    return {
      goalTitle: title,
      totalDays: totalDays,
      summary: `Abhi roadmap generate nahi ho paya, but aapka target set hai! 🚀`,
      fullPlan: [{ day: 1, theme: "Self-Start", tasks: [{ title: `Research basics of ${title}`, time: 30 }] }],
      phases: [{ phase: "Kickoff", weeks: [1, 1], focus: "Fundamentals" }],
      rules: { bufferDaysPerWeek: 1, maxTasksPerDay: 3, skipLogic: "Stay consistent." }
    };
  }
};

const generateDailyTasks = async (context) => {
  const { goalTitle, goalType, currentDay, totalDays, dailyTime, currentPhase, yesterdayStatus, mood } = context;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are the "GoalPilot Mission Commander". Your job is to guide the user daily.
      Based on the user's plan and mood, generate TODAY's actionable mission.

      Tone Rules:
      1. Use "Hinglish" to make it feel more personal and relatable (e.g. "Aaj ka mission ready hai", "Pareshan mat ho", "Chalo shuru karte hain").
      2. Be highly specific. No generic tasks like "Practice". Use "Draft 1 page", "Complete 5 pushups", "Watch 1 video on X".

      Execution Rules:
      1. Focus ONLY on today.
      2. If user mood is 'Tired' or 'Stressed', keep tasks very asaan (easy) and reduce time.
      3. If user mood is 'Energetic' or 'Motivated', give a "Bonus Challenge".
      4. Total time must NOT exceed: ${dailyTime}.
      5. Maximum 3 tasks.
      6. Define a "Micro-Habit": a 2-minute tiny task (e.g., "Just open your book & read 1 sentence").
      7. Define a "Main Mission": the single most important task.

      User Context:
      - Goal: ${goalTitle}
      - Type: ${goalType}
      - Day: ${currentDay} of ${totalDays}
      - Time Available: ${dailyTime}
      - Phase: ${currentPhase}
      - Yesterday's Status: ${yesterdayStatus}
      - User's Mood Today: ${mood || 'Neutral'}

      Return output as JSON (NO Markdown):
      {
        "day": ${currentDay},
        "focus": "Brief focus in Hinglish",
        "microHabit": "Tiny 2-min win",
        "tasks": [
          {
            "title": "[Specific Action Verb] + [Result]",
            "time": 20,
            "type": "Learn | Practice | Revise | Main Mission",
            "difficulty": "Easy | Medium | Hard"
          }
        ],
        "coachMessage": "Short friendly message in Hinglish based on mood"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Daily Generation Error:", error);
    return {
      day: currentDay,
      focus: "Keep moving forward",
      tasks: [{ title: `Continue work on ${goalTitle}`, time: 30, type: "Practice", difficulty: "Medium" }],
      coachMessage: "One small step today, one giant leap tomorrow! 🚀"
    };
  }
};

const generateDashboardSummary = async (context) => {
  const { goalTitle, goalType, totalDays, currentDay, daysCompleted, daysMissed, currentStreak, weeklyRate, avgTime, currentPhase, todayStatus } = context;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are the "GoalPilot Mission Commander". Your job is to analyze the user's cockpit (dashboard).
      Your tone should be analytical, supportive, and Hinglish-based.

      Rules:
      1. DASHBOARD summary should INSPIRE, like a mission briefing.
      2. Hinglish ka sahi use karein (e.g. "Aapki performance asaan nahi rahi, but progress badiya hai").
      3. Focus on the WIN of the last few days.
      4. If performance is low, encourage recovery.

      Context:
      - Goal: ${goalTitle}
      - Completed: ${daysCompleted}/${totalDays}
      - Streak: ${currentStreak} days
      - Completion Rate: ${weeklyRate}%
      - Average Daily Time: ${avgTime}
      - Status Today: ${todayStatus}

      Output JSON format:
      {
        "goalTitle": "${goalTitle}",
        "progressPercentage": ${Math.round((daysCompleted / totalDays) * 100)},
        "dayStatusText": "Day ${currentDay} ka safar",
        "streakText": "Superb! ${currentStreak} dino ka streak",
        "phaseStatus": "Phase: ${currentPhase}",
        "quickStats": {
          "tasksCompleted": ${daysCompleted},
          "daysMissed": ${daysMissed},
          "averageTime": "${avgTime}"
        },
        "aiInsight": "Analytical insight in supportive Hinglish...",
        "primaryAction": "The single most important next win..."
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Summary Generation Error:", error);
    return {
      goalTitle,
      progressPercentage: 0,
      dayStatusText: `Day ${currentDay} of ${totalDays}`,
      streakText: `${currentStreak} Day Streak`,
      phaseStatus: currentPhase,
      quickStats: {
        tasksCompleted: daysCompleted,
        daysMissed: daysMissed,
        averageTime: avgTime || "0m"
      },
      aiInsight: "You're doing great! Keep the momentum going. 🚀",
      primaryAction: "Complete today's priority task."
    };
  }
};

const generateSmartNotification = async (context) => {
  const { userName, goalTitle, goalType, currentDay, totalDays, todayStatus, yesterdayStatus, currentStreak, weeklyRate, timeOfDay, mood } = context;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are a smart notification coach for a goal-tracking app.

      Your task is to generate ONE short, high-impact notification message
      that motivates the user to take action today.

      IMPORTANT RULES:
      1. Notification must encourage ACTION, not guilt.
      2. Message must be short (max 2 lines).
      3. Use friendly, supportive, human tone.
      4. Do NOT sound robotic or generic.
      5. Do NOT repeat the same message daily.
      6. Focus on TODAY only.
      7. No emojis overload (max 1 emoji).
      8. Never mention "AI", "algorithm", or "system".

      You must decide the notification TYPE based on user context:
      - Daily start
      - Incomplete reminder
      - Streak celebration
      - Missed day recovery
      - Milestone achievement
      - Insight-based motivation

      User Context:
      - User Name: ${userName || 'Friend'}
      - Goal Title: ${goalTitle}
      - Goal Type: ${goalType}
      - Current Day: ${currentDay}
      - Total Days: ${totalDays}
      - Today Status: ${todayStatus} (not_started / in_progress / completed)
      - Yesterday Status: ${yesterdayStatus} (completed / skipped)
      - Current Streak: ${currentStreak}
      - Weekly Completion Rate: ${weeklyRate}%
      - Time of Day: ${timeOfDay} (morning / evening)
      - User Mood (if available): ${mood || 'Neutral'}

      Output format MUST be valid JSON.
      Do NOT add explanations outside JSON.

      JSON structure:
      {
        "notificationType": "string",
        "title": "string",
        "message": "string",
        "cta": "string"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Notification Generation Error:", error);
    return {
      notificationType: "Fallback",
      title: "Keep Going! 🚀",
      message: `Time to work on ${goalTitle}. You got this!`,
      cta: "Open App"
    };
  }
};

module.exports = { generateGoalPlan, generateDailyTasks, generateDashboardSummary, generateSmartNotification };
