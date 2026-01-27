import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Helper to fetch smart content
const fetchSmartNotification = async (token) => {
  try {
    // Current server IP and Port (5002)
    const response = await fetch('http://172.20.10.14:5002/api/notifications/generate', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        userName: "Pilot", 
        timeOfDay: new Date().getHours() < 12 ? 'morning' : 'evening',
      })
    });
    return await response.json();
  } catch (error) {
    console.log("Failed to fetch smart notification:", error);
    return null;
  }
};

export const requestNotificationPermissions = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
};

export const scheduleDailyReminder = async (token) => {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission || !token) return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  const content = await fetchSmartNotification(token);
  
  const title = content?.title || "GoalPilot Check-in! 🚀";
  const body = content?.message || "Your daily goals are waiting. Let's make progress!";

  // Schedule for 9 AM
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { url: '/home', type: content?.notificationType },
    },
    trigger: {
      hour: 9,
      minute: 0,
      repeats: true,
    },
  });
  console.log("Smart Daily Reminder scheduled with content:", title);
};

// sendTestNotification function removed to prevent testing spam.
// Proper notifications are scheduled via scheduleDailyReminder().
