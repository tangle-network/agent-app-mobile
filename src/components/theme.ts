import { StyleSheet } from 'react-native'

export const colors = {
  background: '#ffffff',
  card: '#f8f8fa',
  text: '#0d0d0d',
  muted: '#625f6b',
  border: '#e4e4e7',
  primary: '#6252d9',
  primaryText: '#ffffff',
  assistant: '#f8f8fa',
  user: '#f0edff',
  success: '#0a7a56',
  successTint: '#e3f7ee',
  warning: '#a36500',
  warningTint: '#fff1cf',
  error: '#b91c1c',
  errorTint: '#ffe4e4',
  mutedTint: '#ececf0',
}

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
}

export const sharedStyles = StyleSheet.create({
  roundedMd: {
    borderRadius: radii.md,
    borderCurve: 'continuous',
  },
  roundedLg: {
    borderRadius: radii.lg,
    borderCurve: 'continuous',
  },
  roundedXl: {
    borderRadius: radii.xl,
    borderCurve: 'continuous',
  },
})
