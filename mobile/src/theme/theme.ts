/**
 * Central design tokens for the app. Screens and shared components should
 * reference these instead of hardcoding colors/spacing so the UI stays
 * consistent and is easy to retheme in one place.
 */

export const colors = {
  // Brand / accent
  primary: '#2563eb',
  primaryDark: '#1e293b',
  primaryDisabled: '#93c5fd',

  // Semantic
  success: '#22c55e',
  successDark: '#16a34a',
  danger: '#dc2626',
  dangerSoft: '#ef4444',
  warning: '#f97316',

  // Ink / text
  ink: '#0f172a',
  text: '#334155',
  muted: '#64748b',
  faint: '#94a3b8',
  disabledText: '#cbd5e1',

  // Surfaces
  background: '#ffffff',
  surface: '#f8fafc',
  surfaceAlt: '#f1f5f9',
  border: '#e2e8f0',
  borderStrong: '#cbd5e1',
  divider: '#eef2f7',

  // On-dark
  onDark: '#ffffff',
  onDarkMuted: '#94a3b8',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 12,
  xl: 16,
  pill: 999,
} as const;

export const typography = {
  screenTitle: { fontSize: 32, fontWeight: '700' as const },
  sectionTitle: { fontSize: 18, fontWeight: '700' as const },
  body: { fontSize: 16 },
  label: { fontSize: 15, fontWeight: '600' as const },
  small: { fontSize: 13 },
  overline: {
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 1,
  },
} as const;

export const theme = { colors, spacing, radius, typography };
export type Theme = typeof theme;
