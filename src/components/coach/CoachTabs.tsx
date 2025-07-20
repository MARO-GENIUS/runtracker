
import React from 'react';
import { Brain, Sparkles, RefreshCw, Zap } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WeeklyCoachView from '../WeeklyCoachView';
import PersistentAIRecommendations from '../PersistentAIRecommendations';
import AIPersonalizedRecommendations from '../AIPersonalizedRecommendations';
import PersonalizedRecommendations from '../PersonalizedRecommendations';
import AIWorkoutGenerator from '../AIWorkoutGenerator';

interface CoachTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  persistentRecommendations: any[];
  aiRecommendations: any[];
  recommendations: any[];
  aiLoading: boolean;
  persistentLoading: boolean;
  onStartSession: (recommendation: any) => void;
  onRemoveRecommendation: (id: string) => void;
  onRecommendationUpdate: () => void;
}

export const CoachTabs: React.FC<CoachTabsProps> = ({
  activeTab,
  onTabChange,
  persistentRecommendations,
  aiRecommendations,
  recommendations,
  aiLoading,
  persistentLoading,
  onStartSession,
  onRemoveRecommendation,
  onRecommendationUpdate
}) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1 h-auto p-1">
        <TabsTrigger 
          value="ai-generator" 
          className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm min-h-12 sm:min-h-10"
        >
          <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="truncate">Séance IA</span>
        </TabsTrigger>
        <TabsTrigger 
          value="weekly-view" 
          className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm min-h-12 sm:min-h-10"
        >
          <Brain className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="truncate">Semaine</span>
        </TabsTrigger>
        <TabsTrigger 
          value="persistent-ai" 
          className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm min-h-12 sm:min-h-10 relative"
        >
          <Brain className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="truncate">Suivi IA</span>
          {persistentRecommendations.length > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs px-1 py-0.5 rounded-full absolute -top-1 -right-1 sm:static sm:ml-1">
              {persistentRecommendations.filter(r => r.status === 'pending').length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger 
          value="ai" 
          className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm min-h-12 sm:min-h-10 relative"
        >
          <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="truncate">Nouvelles</span>
          {aiRecommendations.length > 0 && (
            <span className="bg-purple-100 text-purple-800 text-xs px-1 py-0.5 rounded-full absolute -top-1 -right-1 sm:static sm:ml-1">
              {aiRecommendations.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger 
          value="basic" 
          className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm min-h-12 sm:min-h-10 relative col-span-2 sm:col-span-1"
        >
          <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="truncate">Basiques</span>
          {recommendations.length > 0 && (
            <span className="bg-gray-100 text-gray-800 text-xs px-1 py-0.5 rounded-full absolute -top-1 -right-1 sm:static sm:ml-1">
              {recommendations.length}
            </span>
          )}
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="ai-generator" className="mt-4 sm:mt-6">
        <div className="w-full">
          <AIWorkoutGenerator />
        </div>
      </TabsContent>
      
      <TabsContent value="weekly-view" className="mt-4 sm:mt-6">
        <div className="w-full">
          <WeeklyCoachView />
        </div>
      </TabsContent>
      
      <TabsContent value="persistent-ai" className="mt-4 sm:mt-6">
        <div className="w-full">
          <PersistentAIRecommendations 
            recommendations={persistentRecommendations}
            isLoading={persistentLoading}
            onRemoveRecommendation={onRemoveRecommendation}
            onRecommendationUpdate={onRecommendationUpdate}
          />
        </div>
      </TabsContent>
      
      <TabsContent value="ai" className="mt-4 sm:mt-6">
        <div className="w-full">
          <AIPersonalizedRecommendations 
            recommendations={aiRecommendations}
            onStartSession={onStartSession}
            isLoading={aiLoading}
          />
        </div>
      </TabsContent>
      
      <TabsContent value="basic" className="mt-4 sm:mt-6">
        <div className="w-full">
          <PersonalizedRecommendations 
            recommendations={recommendations}
            onStartSession={onStartSession}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
};
