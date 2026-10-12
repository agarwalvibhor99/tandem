import { Appearance, Platform } from 'react-native';
import type { ColorScheme } from '@/constants/theme';

export type ThemePreference = 'system' | ColorScheme;

const key = 'tandem.theme.preference';

function webStorage() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  try { return window.localStorage; } catch { return null; }
}

export function getThemePreference(): ThemePreference {
  const value = webStorage()?.getItem(key);
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
}

export function resolveThemePreference(preference: ThemePreference): ColorScheme {
  if (preference === 'light' || preference === 'dark') return preference;
  return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
}

export function applyThemePreference(preference: ThemePreference) {
  webStorage()?.setItem(key, preference);
}

export function reloadForThemeChange() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') window.location.reload();
}
