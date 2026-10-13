export const Colors = {
  // Brand colors
  primary: '#10B981', // Emerald 500
  primaryDark: '#059669', // Emerald 600
  primaryLight: '#34D399', // Emerald 400
  accent: '#06B6D4', // Cyan 500
  
  // Backgrounds
  background: '#0F172A', // Slate 900
  card: '#1E293B', // Slate 800
  cardHover: '#334155', // Slate 700
  cardBorder: '#334155',
  
  // Typography
  textPrimary: '#F8FAFC', // Slate 50
  textSecondary: '#94A3B8', // Slate 400
  textMuted: '#64748B', // Slate 500
  textLight: '#CBD5E1', // Slate 300
  
  // Cleanliness Hygiene Grades
  gradeA: '#10B981', // Emerald 90+
  gradeB: '#3B82F6', // Blue 80-89
  gradeC: '#F59E0B', // Amber 70-79
  gradeD: '#EF4444', // Red <70
  gradeNotAssessed: '#64748B', // Slate
  
  // Severity Levels
  severityCritical: '#EF4444',
  severityHigh: '#F97316',
  severityMedium: '#F59E0B',
  severityLow: '#3B82F6',
  
  // Statuses
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
};

export const getGradeColor = (grade?: string | null): string => {
  if (!grade) return Colors.gradeNotAssessed;
  switch (grade.toUpperCase()) {
    case 'A':
      return Colors.gradeA;
    case 'B':
      return Colors.gradeB;
    case 'C':
      return Colors.gradeC;
    case 'D':
      return Colors.gradeD;
    default:
      return Colors.gradeNotAssessed;
  }
};

export const getSeverityColor = (severity: string): string => {
  switch (severity.toLowerCase()) {
    case 'critical':
      return Colors.severityCritical;
    case 'high':
      return Colors.severityHigh;
    case 'medium':
      return Colors.severityMedium;
    case 'low':
      return Colors.severityLow;
    default:
      return Colors.info;
  }
};
