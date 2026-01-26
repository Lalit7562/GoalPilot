import React, { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Provider, useDispatch } from 'react-redux';
import { store } from './src/redux/store';
import { loadState } from './src/redux/slices/goalSlice';
import AppNavigator from './src/navigation/AppNavigator';

import { requestNotificationPermissions, scheduleDailyReminder } from './src/utils/notifications';

const AppContent = () => {
  const dispatch = useDispatch();
  
  useEffect(() => {
    dispatch(loadState());
    
    // Initialize Notifications
    const initNotifications = async () => {
      const granted = await requestNotificationPermissions();
      if (granted) {
        await scheduleDailyReminder();
      }
    };
    initNotifications();

    // Listen for notification responses (e.g., user clicks a notification)
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      // Handle the notification interaction here if needed
      console.log("Notification clicked:", response.notification.request.content.title);
    });

    // Listen for incoming notifications when app is in foreground
    const notificationSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log("Notification received in foreground:", notification.request.content.title);
    });

    return () => {
      responseSubscription.remove();
      notificationSubscription.remove();
    };
  }, []);

  return <AppNavigator />;
};

export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}
