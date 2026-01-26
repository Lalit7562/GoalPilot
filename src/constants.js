export const theme = {
  colors: {
    primary: '#0F172A', // Slate Blue/Black
    secondary: '#3B82F6', // Vibrant Blue
    accent: '#F97316', // Orange
    background: '#F8FAFC',
    card: '#FFFFFF',
    text: '#1E293B',
    textSecondary: '#64748B',
    white: '#FFFFFF',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    border: '#E2E8F0',
  },
  shadows: {
    soft: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
    },
    deep: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 10,
    }
  }
};

export const todayTasks = [
  { id: 1, title: "Watch React Hooks video", done: false },
  { id: 2, title: "Practice useEffect", done: false },
  { id: 3, title: "Build GoalPilot UI", done: true },
];
