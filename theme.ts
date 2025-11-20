export const theme = {
  colors: {
    primary: '#4fc3f7', // Sky Blue
    secondary: '#2ecc71', // Emerald Green
    accent: '#b39ddb', // Soft Lavender
    neutralLight: '#fafafa', // Snow White
    neutralDark: '#263238', // Charcoal Gray
    textMuted: 'rgba(255,255,255,0.7)',
  },
  typography: {
    heading: 'Poppins',
    body: 'Inter',
  },
  layout: {
    radius: 12,
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
  },
} as const

export type Theme = typeof theme



