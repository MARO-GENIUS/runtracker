
import { useAuth } from '@/hooks/useAuth';
import { useGlobalSync } from '@/hooks/useGlobalSync';
import { Navigate, useLocation } from 'react-router-dom';
import TopNavigation from './TopNavigation';
import Header from './Header';
import StravaConnect from './StravaConnect';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, loading, signOut } = useAuth();
  const location = useLocation();
  const { isGlobalSyncing, syncProgress } = useGlobalSync();

  // Détermine la vue actuelle basée sur l'URL
  const getCurrentView = () => {
    const path = location.pathname;
    if (path === '/activities') return 'activities';
    if (path === '/records') return 'records';
    if (path === '/coach') return 'coach';
    return 'dashboard';
  };

  const currentView = getCurrentView();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center mobile-container">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-running-blue mx-auto mb-4"></div>
          <p className="text-gray-600 mobile-text-hierarchy">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 mobile-scroll-smooth">
      {/* Navigation supérieure sticky et responsive */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <TopNavigation 
          currentView={currentView} 
          user={user}
          onSignOut={signOut}
        />
      </div>
      
      {/* Header principal responsive */}
      <Header 
        currentView={currentView} 
        user={user}
        onSignOut={signOut}
      />
      
      {/* Barre d'informations responsive - uniquement sur le dashboard */}
      {currentView === 'dashboard' && (
        <div className="bg-white border-b border-gray-100 py-3 sm:py-4">
          <div className="max-w-6xl mx-auto mobile-container flex items-center justify-end">
            <StravaConnect />
          </div>
        </div>
      )}
      
      {/* Contenu principal responsive avec espacement mobile optimisé */}
      <main className="max-w-6xl mx-auto mobile-container mobile-section space-y-4 sm:space-y-6 lg:space-y-8">
        {children}
      </main>
      
      {/* Footer responsive */}
      <footer className="bg-white border-t border-gray-100 mt-8 sm:mt-12 lg:mt-16 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto mobile-container text-center text-gray-600">
          <p className="mobile-text-hierarchy">
            RunTracker Pro - Votre compagnon de course personnalisé
          </p>
          <p className="text-xs mt-2 text-gray-500">
            Visualisez vos performances • Suivez vos progrès • Atteignez vos objectifs
          </p>
          {isGlobalSyncing && (
            <p className="text-xs mt-2 text-blue-600 flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
              <span className="mobile-text-hierarchy">Synchronisation automatique en cours...</span>
            </p>
          )}
        </div>
      </footer>
    </div>
  );
};

export default Layout;
