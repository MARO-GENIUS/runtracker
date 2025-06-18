
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import Header from '../components/Header';
import WeeklySummary from '../components/WeeklySummary';
import RecordsSlider from '../components/RecordsSlider';
import MonthlyStats from '../components/MonthlyStats';
import RecordsTable from '../components/RecordsTable';
import ActivitiesView from '../components/ActivitiesView';
import StravaConnect from '../components/StravaConnect';

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'records' | 'activities'>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
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
      <Header 
        currentView={currentView} 
        onViewChange={setCurrentView}
        user={user}
        onSignOut={signOut}
      />
      
      {/* Barre d'informations dans la zone blanche */}
      {currentView === 'dashboard' && (
        <div className="bg-white border-b border-gray-100 py-4">
          <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 p-2 rounded-lg">
                <Calendar size={20} className="text-gray-600" />
              </div>
              <div>
                <p className="text-gray-700 text-sm font-medium">Semaine du 10-16 Juin 2024</p>
              </div>
            </div>
            
            <StravaConnect />
          </div>
        </div>
      )}
      
      <main className="max-w-6xl mx-auto p-6 space-y-8">
        {currentView === 'dashboard' && (
          <>
            <WeeklySummary />
            <RecordsSlider />
            <MonthlyStats />
          </>
        )}
        
        {currentView === 'records' && <RecordsTable />}
        
        {currentView === 'activities' && <ActivitiesView />}
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-16 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-gray-600">
          <p className="text-sm">
            RunTracker Pro - Votre compagnon de course personnalisé
          </p>
          <p className="text-xs mt-2 text-gray-500">
            Visualisez vos performances • Suivez vos progrès • Atteignez vos objectifs
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
