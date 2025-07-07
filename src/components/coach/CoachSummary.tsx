
import React from 'react';

interface CoachSummaryProps {
  settings: any;
  analysisData: any;
  persistentRecommendations: any[];
}

export const CoachSummary: React.FC<CoachSummaryProps> = ({
  settings,
  analysisData,
  persistentRecommendations
}) => {
  const daysSinceLastActivity = analysisData?.daysSinceLastActivity;
  const weeksUntilRace = analysisData?.weeksUntilRace;

  return (
    <div className="text-center text-sm text-gray-500 pt-4 border-t">
      <p>
        Objectif actuel : <span className="font-medium">{
          settings.targetRace === '5k' ? '5 kilomètres' :
          settings.targetRace === '10k' ? '10 kilomètres' :
          settings.targetRace === 'semi' ? 'Semi-marathon' :
          settings.targetRace === 'marathon' ? 'Marathon' :
          'Récupération/Forme'
        }</span>
        {weeksUntilRace && (
          <span className="text-purple-600 font-medium">
            {' '}dans {weeksUntilRace} semaine{weeksUntilRace > 1 ? 's' : ''}
          </span>
        )}
        {' • '}
        <span className="font-medium">{settings.weeklyFrequency} séances/semaine</span>
        {persistentRecommendations.length > 0 && (
          <>
            {' • '}
            <span className="text-blue-600 font-medium">
              IA: {persistentRecommendations.filter(r => r.status === 'completed').length}/{persistentRecommendations.length} réalisées
            </span>
          </>
        )}
        {daysSinceLastActivity !== undefined && (
          <>
            {' • '}
            <span className="text-orange-600 font-medium">
              Dernière séance: il y a {daysSinceLastActivity} jour{daysSinceLastActivity > 1 ? 's' : ''}
            </span>
          </>
        )}
        {analysisData?.fatigueScore && (
          <>
            {' • '}
            <span className="text-purple-600 font-medium">
              Fatigue: {analysisData.fatigueScore}/10
            </span>
          </>
        )}
      </p>
    </div>
  );
};
