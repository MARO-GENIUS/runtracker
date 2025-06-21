
export const getCurrentMonthName = (): string => {
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  
  const currentMonth = new Date().getMonth();
  return monthNames[currentMonth];
};

export const getDaysRemainingInMonth = (): number => {
  const now = new Date();
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return lastDayOfMonth.getDate() - now.getDate();
};

export const getDaysPassedInMonth = (): number => {
  const now = new Date();
  return now.getDate();
};

export const getDailyAverageNeeded = (remainingKm: number, daysRemaining: number): number => {
  if (daysRemaining <= 0) return 0;
  return remainingKm / daysRemaining;
};

export const getProgressColor = (percentage: number, daysPassedRatio: number): string => {
  // Si on est en avance par rapport au rythme nécessaire
  if (percentage >= daysPassedRatio * 100) {
    return 'text-running-green';
  }
  // Si on est un peu en retard mais récupérable
  else if (percentage >= (daysPassedRatio * 100) * 0.7) {
    return 'text-orange-500';
  }
  // Si on est très en retard
  else {
    return 'text-red-500';
  }
};

export const getProgressBarColor = (percentage: number, daysPassedRatio: number): string => {
  if (percentage >= daysPassedRatio * 100) {
    return 'from-running-green to-running-green-light';
  } else if (percentage >= (daysPassedRatio * 100) * 0.7) {
    return 'from-orange-400 to-orange-300';
  } else {
    return 'from-red-400 to-red-300';
  }
};
