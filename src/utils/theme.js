import { theme } from '../constants';

export const getMoodTheme = (currentMood) => {
    switch (currentMood) {
      case 'Great':
        return {
          gradient: ['#ECFDF5', '#D1FAE5', '#A7F3D0'], // Emerald
          primary: '#10B981',
          secondary: '#34D399',
          accent: '#059669',
          cardBg: 'rgba(255,255,255,0.9)',
          darkStart: '#065F46', // Dark emerald for cards
        };
      case 'Good':
        return {
           gradient: ['#FFFBEB', '#FEF3C7', '#FDE68A'], // Amber
           primary: '#F59E0B',
           secondary: '#FBBF24',
           accent: '#D97706',
           cardBg: 'rgba(255,255,255,0.9)',
           darkStart: '#B45309',
        };
      case 'Tired':
        return {
           gradient: ['#F8FAFC', '#E2E8F0', '#CBD5E1'], // Slate
           primary: '#64748B',
           secondary: '#94A3B8',
           accent: '#475569',
           cardBg: 'rgba(255,255,255,0.9)',
           darkStart: '#334155',
        };
      case 'Epic':
         return {
            gradient: ['#FEF2F2', '#FEE2E2', '#FECACA'], // Red
            primary: '#EF4444',
            secondary: '#F87171',
            accent: '#DC2626',
            cardBg: 'rgba(255,255,255,0.9)',
            darkStart: '#991B1B',
         };
      default:
        return {
           gradient: ['#F8FAFC', '#F1F5F9', '#E2E8F0'],
           primary: theme.colors.primary,
           secondary: theme.colors.secondary,
           accent: theme.colors.accent,
           cardBg: '#FFFFFF',
           darkStart: theme.colors.primary,
        };
    }
};
