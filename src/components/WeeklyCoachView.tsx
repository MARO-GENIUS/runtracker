import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Activity, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DaySessionDetail } from './DaySessionDetail';
import LastSessionTypeSelector from './LastSessionTypeSelector';
import { useStravaLast30Days } from '@/hooks/useStravaLast30Days';

interface WeeklyActivity {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  start_date_local: string;
  average_speed: number | null;
  effort_rating: number | null;
  effort_notes: string | null;
  session_type?: string | null;
}

interface AIRecommendation {
  id: string;
  recommendation_data: any;
  generated_at: string;
  status: string;
  matching_activity_id: number | null;
}

const WeeklyCoachView: React.FC = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - mondayOffset);
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  const [weekActivities, setWeekActivities] = useState<WeeklyActivity[]>([]);
  const [weekRecommendations, setWeekRecommendations] = useState<AIRecommendation[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const stravaData = useStravaLast30Days();

  const getDaysOfWeek = (weekStart: Date) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeekStart(newWeekStart);
    setSelectedDay(null);
  };

  const formatWeekRange = (weekStart: Date) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const startStr = weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    const endStr = weekEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    
    return `${startStr} - ${endStr}`;
  };

  const getDayActivities = (date: Date) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return weekActivities.filter(activity => {
      const activityDate = new Date(activity.start_date_local);
      return activityDate >= startOfDay && activityDate <= endOfDay;
    });
  };

  const getDayRecommendations = (date: Date) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return weekRecommendations.filter(rec => {
      const recDate = new Date(rec.generated_at);
      return recDate >= startOfDay && recDate <= endOfDay && !rec.matching_activity_id;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const hasSessions = (date: Date) => {
    return getDayActivities(date).length > 0 || getDayRecommendations(date).length > 0;
  };

  const fetchWeekData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(currentWeekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      // Fetch activities for the week - incluant le session_type
      const { data: activities, error: activitiesError } = await supabase
        .from('strava_activities')
        .select('id, name, distance, moving_time, start_date_local, average_speed, effort_rating, effort_notes, session_type')
        .eq('user_id', user.id)
        .in('type', ['Run', 'VirtualRun'])
        .gte('start_date_local', currentWeekStart.toISOString())
        .lte('start_date_local', weekEnd.toISOString())
        .order('start_date_local', { ascending: true });

      if (activitiesError) {
        console.error('Error fetching activities:', activitiesError);
      } else {
        setWeekActivities(activities || []);
      }

      // Fetch AI recommendations for the week
      const { data: recommendations, error: recommendationsError } = await supabase
        .from('ai_recommendations')
        .select('id, recommendation_data, generated_at, status, matching_activity_id')
        .eq('user_id', user.id)
        .gte('generated_at', currentWeekStart.toISOString())
        .lte('generated_at', weekEnd.toISOString())
        .order('generated_at', { ascending: true });

      if (recommendationsError) {
        console.error('Error fetching recommendations:', recommendationsError);
      } else {
        setWeekRecommendations(recommendations || []);
      }

    } catch (error) {
      console.error('Error fetching week data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivityUpdate = () => {
    fetchWeekData();
  };

  useEffect(() => {
    fetchWeekData();
  }, [currentWeekStart, user]);

  const daysOfWeek = getDaysOfWeek(currentWeekStart);
  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <div className="space-y-4">
      {/* Sélecteur de type de dernière séance en haut */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <LastSessionTypeSelector
          currentType={stravaData.lastSessionType}
          onTypeChange={stravaData.updateLastSessionType}
        />
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateWeek('prev')}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <span className="font-semibold text-gray-900">
              {formatWeekRange(currentWeekStart)}
            </span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateWeek('next')}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {loading && (
          <div className="text-sm text-gray-600">Chargement...</div>
        )}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-2">
        {daysOfWeek.map((day, index) => {
          const dayActivities = getDayActivities(day);
          const dayRecommendations = getDayRecommendations(day);
          const hasData = hasSessions(day);
          const isSelected = selectedDay && day.toDateString() === selectedDay.toDateString();

          return (
            <Card
              key={day.toISOString()}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                isSelected 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : hasData 
                    ? 'bg-white border-blue-200 hover:bg-blue-50' 
                    : 'bg-gray-50 hover:bg-gray-100'
              } ${isToday(day) ? 'border-blue-400 border-2' : ''}`}
              onClick={() => setSelectedDay(isSelected ? null : day)}
            >
              <CardContent className="p-3 text-center">
                <div className="text-xs font-medium text-gray-600 mb-1">
                  {dayNames[index]}
                </div>
                <div className={`text-lg font-bold mb-2 ${
                  isToday(day) ? 'text-blue-600' : 'text-gray-900'
                }`}>
                  {day.getDate()}
                </div>
                
                {/* Activity indicators */}
                <div className="space-y-1">
                  {dayActivities.length > 0 && (
                    <div className="flex items-center justify-center gap-1">
                      <Activity className="h-3 w-3 text-green-600" />
                      <span className="text-xs text-green-600 font-medium">
                        {dayActivities.length}
                      </span>
                    </div>
                  )}
                  {dayRecommendations.length > 0 && (
                    <div className="flex items-center justify-center gap-1">
                      <Brain className="h-3 w-3 text-purple-600" />
                      <span className="text-xs text-purple-600 font-medium">
                        IA
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selected Day Details */}
      {selectedDay && (
        <DaySessionDetail
          date={selectedDay}
          activities={getDayActivities(selectedDay)}
          recommendations={getDayRecommendations(selectedDay)}
          onClose={() => setSelectedDay(null)}
          onActivityUpdate={handleActivityUpdate}
        />
      )}
    </div>
  );
};

export default WeeklyCoachView;
