
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import Header from '../components/Header';
import WeeklySummary from '../components/WeeklySummary';
import RecordsSlider from '../components/RecordsSlider';
import MonthlyStats from '../components/MonthlyStats';
import RecordsTable from '../components/RecordsTable';
import StravaConnect from '../components/StravaConnect';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'records'>('dashboard');

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
      
      <main className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Strava Connection Card */}
        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardHeader>
            <CardTitle className="text-orange-800">Connecter Strava</CardTitle>
            <CardDescription className="text-orange-700">
              Synchronisez vos activités de course automatiquement depuis Strava
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StravaConnect />
          </CardContent>
        </Card>

        {currentView === 'dashboard' ? (
          <>
            <WeeklySummary />
            <RecordsSlider />
            <MonthlyStats />
          </>
        ) : (
          <RecordsTable />
        )}
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
