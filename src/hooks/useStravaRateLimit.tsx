
import React, { useState, useEffect } from 'react';

interface RateLimitState {
  requestsUsed: number;
  dailyLimit: number;
  canMakeRequest: boolean;
  resetTime: Date | null;
}

export const useStravaRateLimit = () => {
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>({
    requestsUsed: 0,
    dailyLimit: 2000,
    canMakeRequest: true,
    resetTime: null
  });

  // Charger l'état depuis localStorage au démarrage
  useEffect(() => {
    const stored = localStorage.getItem('strava_rate_limit');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const resetTime = parsed.resetTime ? new Date(parsed.resetTime) : null;
        
        // Vérifier si on doit réinitialiser (nouveau jour)
        const now = new Date();
        if (resetTime && now >= resetTime) {
          // Réinitialiser pour le nouveau jour
          const newResetTime = new Date();
          newResetTime.setDate(newResetTime.getDate() + 1);
          newResetTime.setHours(0, 0, 0, 0);
          
          setRateLimitState({
            requestsUsed: 0,
            dailyLimit: 2000,
            canMakeRequest: true,
            resetTime: newResetTime
          });
        } else {
          setRateLimitState({
            ...parsed,
            resetTime,
            canMakeRequest: parsed.requestsUsed < parsed.dailyLimit * 0.9 // 90% de sécurité
          });
        }
      } catch (error) {
        console.error('Error parsing rate limit state:', error);
      }
    } else {
      // Première utilisation, définir le reset pour demain
      const resetTime = new Date();
      resetTime.setDate(resetTime.getDate() + 1);
      resetTime.setHours(0, 0, 0, 0);
      
      setRateLimitState(prev => ({
        ...prev,
        resetTime
      }));
    }
  }, []);

  // Sauvegarder l'état dans localStorage
  useEffect(() => {
    localStorage.setItem('strava_rate_limit', JSON.stringify(rateLimitState));
  }, [rateLimitState]);

  const incrementRequests = (count: number = 1) => {
    setRateLimitState(prev => {
      const newRequestsUsed = prev.requestsUsed + count;
      return {
        ...prev,
        requestsUsed: newRequestsUsed,
        canMakeRequest: newRequestsUsed < prev.dailyLimit * 0.9 // Limite à 90% par sécurité
      };
    });
  };

  const getRemainingRequests = () => {
    return Math.max(0, Math.floor(rateLimitState.dailyLimit * 0.9) - rateLimitState.requestsUsed);
  };

  const getUsagePercentage = () => {
    return (rateLimitState.requestsUsed / (rateLimitState.dailyLimit * 0.9)) * 100;
  };

  return {
    ...rateLimitState,
    incrementRequests,
    getRemainingRequests,
    getUsagePercentage
  };
};
