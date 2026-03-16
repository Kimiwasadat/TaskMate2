import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Set exactly how notifications behave when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Requests permission and gets the Expo Push Token for the specific device
 */
export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }
    
    // Get the token that uniquely identifies this device
    try {
      const projectId = "d87ed535-6aa5-46aa-bcbb-cbff67f2e140"; // Use actual project ID if available, otherwise it falls back
      const pushTokenObject = await Notifications.getExpoPushTokenAsync({ projectId });
      token = pushTokenObject.data;
      console.log("EXPO PUSH TOKEN:", token);
    } catch (e) {
      console.log("Error getting push token", e);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

/**
 * Schedules a local reminder on the device
 * @param {string} taskName 
 * @param {number} delaySeconds (Defaults to 30 seconds for testing)
 * @returns {string} notificationId
 */
export async function scheduleIdleReminder(taskName, delaySeconds = 30) {
  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Stay on Track! 🕒",
        body: `Are you still working on "${taskName}"?`,
        sound: true,
      },
      trigger: {
        seconds: delaySeconds, // 30 seconds for testing as requested
      },
    });
    return identifier;
  } catch (error) {
    console.error("Error scheduling reminder:", error);
    return null;
  }
}

/**
 * Cancels a specific scheduled local reminder
 * @param {string} notificationId 
 */
export async function cancelReminder(notificationId) {
  if (notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error("Error canceling reminder:", error);
    }
  }
}

/**
 * Sends a push notification to another user's device via Expo servers
 * @param {string} expoPushToken 
 * @param {string} title 
 * @param {string} body 
 */
export async function sendPushNotification(expoPushToken, title, body) {
  if (!expoPushToken) return;

  const message = {
    to: expoPushToken,
    sound: 'default',
    title: title,
    body: body,
    data: { someData: 'goes here' },
  };

  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
  } catch (error) {
    console.error("Error sending push to Expo:", error);
  }
}
