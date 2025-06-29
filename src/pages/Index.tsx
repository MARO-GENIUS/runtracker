
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useGlobalSync } from '@/hooks/useGlobalSync';
import { Navigate } from 'react-router-dom';
import TopNavigation from '../components/TopNavigation';
import Header from '../components/Header';
import WeeklySummary from '../components/WeeklySummary';
import RecordsSlider from '../components/RecordsSlider';
import MonthlyStats from '../components/MonthlyStats';
import RecordsTable from '../components/RecordsTable';
import ActivitiesView from '../components/ActivitiesView';
import CoachView from '../components/CoachView';
import StravaConnect from '../components/StravaConnect';
import RunningCalendar from '../components/RunningCalendar';

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'records' | 'activities' | 'coach'>('dashboard');
  const { isGlobalSyncing, syncProgress } = useGlobalSync();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-running-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation supérieure responsive */}
      <TopNavigation 
        currentView={currentView} 
        onViewChange={setCurrentView}
        user={user}
        onSignOut={signOut}
      />
      
      {/* Header principal responsive */}
      <Header 
        currentView={currentView} 
        onViewChange={setCurrentView}
        user={user}
        onSignOut={signOut}
      />
      
      {/* Barre d'informations responsive */}
      {currentView === 'dashboard' && (
        <div className="bg-white border-b border-gray-100 py-3 sm:py-4">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-end">
            <StravaConnect />
          </div>
        </div>
      )}
      
      {/* Contenu principal responsive */}
      <main className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
        {currentView === 'dashboard' && (
          <>
            <WeeklySummary />
            <RunningCalendar />
            <RecordsSlider />
            <MonthlyStats />
          </>
        )}
        
        {currentView === 'records' && <RecordsTable />}
        
        {currentView === 'activities' && <ActivitiesView />}
        
        {currentView === 'coach' && <CoachView />}
      </main>
      
      {/* Footer responsive */}
      <footer className="bg-white border-t border-gray-100 mt-12 sm:mt-16 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center text-gray-600">
          <p className="text-sm">
            RunTracker Pro - Votre compagnon de course personnalisé
          </p>
          <p className="text-xs mt-2 text-gray-500">
            Visualisez vos performances • Suivez vos progrès • Atteignez vos objectifs
          </p>
          {isGlobalSyncing && (
            <p className="text-xs mt-2 text-blue-600 flex items-center justify-center gap-1">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
              Synchronisation automatique en cours...
            </p>
          )}
        </div>
      </footer>
    </div>
  );
};

export default Index;
