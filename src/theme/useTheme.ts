import { useColorScheme } from 'react-native';

export interface ThemeColors {
  isDark: boolean;
  background: string;
  surface: string;
  card: string;
  cardBorder: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryLight: string;
  primaryBorder: string;
  accent: string;
  accentLight: string;
  accentBorder: string;
  warning: string;
  warningLight: string;
  success: string;
  successLight: string;
  danger: string;
  headerBackground: string;
  headerTintColor: string;
  statusBarStyle: 'light' | 'dark';
}

export const useTheme = (): ThemeColors => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return {
    isDark,
    background: isDark ? '#020617' : '#F8FAFC',
    surface: isDark ? '#0F172A' : '#FFFFFF',
    card: isDark ? '#0F172A' : '#FFFFFF',
    cardBorder: isDark ? '#1E293B' : '#E2E8F0',
    text: isDark ? '#F8FAFC' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#475569',
    textMuted: isDark ? '#64748B' : '#94A3B8',
    primary: '#0284C7', // sky-600
    primaryLight: isDark ? 'rgba(2, 132, 199, 0.15)' : 'rgba(2, 132, 199, 0.10)',
    primaryBorder: isDark ? 'rgba(56, 189, 248, 0.35)' : 'rgba(2, 132, 199, 0.25)',
    accent: '#06B6D4', // cyan-500
    accentLight: isDark ? 'rgba(6, 182, 212, 0.15)' : 'rgba(6, 182, 212, 0.10)',
    accentBorder: isDark ? 'rgba(6, 182, 212, 0.35)' : 'rgba(6, 182, 212, 0.25)',
    warning: '#F59E0B',
    warningLight: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.10)',
    success: '#10B981',
    successLight: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.10)',
    danger: '#EF4444',
    headerBackground: isDark ? '#020617' : '#FFFFFF',
    headerTintColor: isDark ? '#F8FAFC' : '#0F172A',
    statusBarStyle: isDark ? 'light' : 'dark',
  };
};
