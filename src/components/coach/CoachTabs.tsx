
import React from 'react';
import { Brain, Sparkles, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WeeklyCoachView from '../WeeklyCoachView';
import PersistentAIRecommendations from '../PersistentAIRecommendations';
import AIPersonalizedRecommendations from '../AIPersonalizedRecommendations';
import PersonalizedRecommendations from '../PersonalizedRecommendations';

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
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="weekly-view" className="flex items-center gap-2">
          <Brain className="h-4 w-4" />
          Vue Semaine
        </TabsTrigger>
        <TabsTrigger value="persistent-ai" className="flex items-center gap-2">
          <Brain className="h-4 w-4" />
          Suivi IA
          {persistentRecommendations.length > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
              {persistentRecommendations.filter(r => r.status === 'pending').length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="ai" className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Nouvelles IA
          {aiRecommendations.length > 0 && (
            <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full">
              {aiRecommendations.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="basic" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Basiques
          {recommendations.length > 0 && (
            <span className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded-full">
              {recommendations.length}
            </span>
          )}
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="weekly-view" className="mt-6">
        <div className="max-w-6xl mx-auto">
          <WeeklyCoachView />
        </div>
      </TabsContent>
      
      <TabsContent value="persistent-ai" className="mt-6">
        <div className="max-w-4xl mx-auto">
          <PersistentAIRecommendations 
            recommendations={persistentRecommendations}
            isLoading={persistentLoading}
            onRemoveRecommendation={onRemoveRecommendation}
            onRecommendationUpdate={onRecommendationUpdate}
          />
        </div>
      </TabsContent>
      
      <TabsContent value="ai" className="mt-6">
        <div className="max-w-4xl mx-auto">
          <AIPersonalizedRecommendations 
            recommendations={aiRecommendations}
            onStartSession={onStartSession}
            isLoading={aiLoading}
          />
        </div>
      </TabsContent>
      
      <TabsContent value="basic" className="mt-6">
        <div className="max-w-4xl mx-auto">
          <PersonalizedRecommendations 
            recommendations={recommendations}
            onStartSession={onStartSession}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
};
