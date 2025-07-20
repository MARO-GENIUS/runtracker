
import React from 'react';
import { Brain, Zap } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WeeklyCoachView from '../WeeklyCoachView';
import AIWorkoutGenerator from '../AIWorkoutGenerator';

interface CoachTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const CoachTabs: React.FC<CoachTabsProps> = ({
  activeTab,
  onTabChange
}) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-2 gap-1 h-auto p-1">
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
    </Tabs>
  );
};
