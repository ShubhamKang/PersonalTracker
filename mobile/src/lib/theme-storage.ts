import * as SecureStore from 'expo-secure-store';
import type { ThemePreference } from '../theme/theme-context';

const THEME_KEY = 'pt_theme_preference';

export async function saveThemePreference(pref: ThemePreference): Promise<void> {
  await SecureStore.setItemAsync(THEME_KEY, pref);
}

export async function getThemePreference(): Promise<ThemePreference | null> {
  const value = await SecureStore.getItemAsync(THEME_KEY);
  return value === 'light' || value === 'dark' || value === 'system' ? value : null;
}
