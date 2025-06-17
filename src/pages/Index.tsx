
import { useState } from 'react';
import Header from '../components/Header';
import WeeklySummary from '../components/WeeklySummary';
import RecordsSlider from '../components/RecordsSlider';
import MonthlyStats from '../components/MonthlyStats';
import RecordsTable from '../components/RecordsTable';

const Index = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'records'>('dashboard');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentView={currentView} onViewChange={setCurrentView} />
      
      <main className="max-w-6xl mx-auto p-6 space-y-8">
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
