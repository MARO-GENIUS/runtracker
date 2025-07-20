
import React from 'react';
import { Brain, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TrainingSettings from '../TrainingSettings';

interface TrainingSettingsData {
  targetRace: 'recuperation' | '5k' | '10k' | 'semi' | 'marathon';
  targetDate?: Date;
  targetTimeMinutes?: number;
  weeklyFrequency: number;
  preferredDays: string[];
  availableTimeSlots: string[];
  maxIntensity: 'low' | 'medium' | 'high';
}

interface CoachHeaderProps {
  analysisData: any;
  settings: TrainingSettingsData;
  aiLoading: boolean;
  onUpdateSettings: (settings: TrainingSettingsData) => Promise<boolean>;
  onAIAnalysis: () => void;
  onRefresh: () => void;
}

export const CoachHeader: React.FC<CoachHeaderProps> = ({
  analysisData,
  settings,
  aiLoading,
  onUpdateSettings,
  onAIAnalysis,
  onRefresh
}) => {
  const daysSinceLastActivity = analysisData?.daysSinceLastActivity;
  const raceGoal = analysisData?.raceGoal;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg">
          <Brain className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Coach IA Adaptatif
          </h2>
          <p className="text-gray-600 text-sm">
            Analyse intelligente de vos {analysisData?.totalActivities || 'dernières'} courses
            {daysSinceLastActivity !== undefined && (
              <span className="ml-2 text-orange-600 font-medium">
                • {daysSinceLastActivity} jour{daysSinceLastActivity > 1 ? 's' : ''} depuis la dernière séance
              </span>
            )}
            {raceGoal && (
              <span className="ml-2 text-purple-600 font-medium">
                • {raceGoal}
              </span>
            )}
            {analysisData?.fatigueScore && (
              <span className="ml-2 text-blue-600">
                • Fatigue: {analysisData.fatigueScore}/10
              </span>
            )}
            {analysisData?.workoutBalance && (
              <span className="ml-2 text-gray-600">
                • {analysisData.workoutBalance}
              </span>
            )}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <TrainingSettings 
          settings={settings}
          onUpdateSettings={onUpdateSettings}
        />
        <Button 
          onClick={onAIAnalysis}
          disabled={aiLoading}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {aiLoading ? 'Analyse adaptative...' : 'Analyser avec l\'IA'}
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onRefresh}
          className="text-gray-500 hover:text-gray-700"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>
    </div>
  );
};
