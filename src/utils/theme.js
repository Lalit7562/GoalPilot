import { theme } from '../constants';

export const getMoodTheme = (currentMood) => {
    switch (currentMood) {
      case 'Relaxed':
        return {
          gradient: ['#ECFDF5', '#D1FAE5', '#A7F3D0'], // Emerald
          primary: '#10B981',
          secondary: '#34D399',
          accent: '#059669',
          cardBg: 'rgba(16, 185, 129, 0.08)',
          darkStart: '#064E3B', 
        };
      case 'Energized':
        return {
           gradient: ['#FFFBEB', '#FEF3C7', '#FDE68A'], // Amber
           primary: '#F59E0B',
           secondary: '#FBBF24',
           accent: '#D97706',
           cardBg: 'rgba(245, 158, 11, 0.08)',
           darkStart: '#78350F',
        };
      case 'Focused':
        return {
           gradient: ['#F0F9FF', '#E0F2FE', '#BAE6FD'], // Blue
           primary: '#0EA5E9',
           secondary: '#38BDF8',
           accent: '#0284C7',
           cardBg: 'rgba(14, 165, 233, 0.08)',
           darkStart: '#0C4A6E',
        };
      case 'Anxious':
         return {
            gradient: ['#FEF2F2', '#FEE2E2', '#FECACA'], // Red
            primary: '#EF4444',
            secondary: '#F87171',
            accent: '#DC2626',
            cardBg: 'rgba(239, 68, 68, 0.08)',
            darkStart: '#7F1D1D',
         };
      case 'Neutral':
      default:
        return {
           gradient: ['#F8FAFC', '#F1F5F9', '#E2E8F0'],
           primary: theme.colors.primary,
           secondary: theme.colors.secondary,
           accent: theme.colors.accent,
           cardBg: 'rgba(15, 23, 42, 0.05)',
           darkStart: '#0F172A',
        };
    }
};
