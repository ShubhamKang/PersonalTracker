import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { api } from '../api/client';

/**
 * Requests notification permission, gets the Expo push token, and
 * registers it with the backend. Safe to call after login.
 * Returns the token string, or null if unavailable (e.g. simulator).
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    // Push tokens are not available on simulators/emulators.
    return null;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  const tokenResponse = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );
  const token = tokenResponse.data;

  const platform: 'ios' | 'android' =
    Platform.OS === 'ios' ? 'ios' : 'android';

  try {
    await api.registerPushToken(token, platform);
  } catch {
    // Non-fatal; token can be re-registered later.
  }

  return token;
}
