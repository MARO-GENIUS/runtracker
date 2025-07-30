
import { ArrowLeft } from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { Link } from 'react-router-dom';
import { TruncatedText } from '@/components/ui/truncated-text';

interface HeaderProps {
  currentView: 'dashboard' | 'records' | 'activities' | 'coach';
  user: SupabaseUser;
  onSignOut: () => void;
}

const Header = ({ currentView }: HeaderProps) => {
  return (
    <header className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 text-white shadow-lg animate-fade-in mobile-no-overflow">
      <div className="max-w-6xl mx-auto mobile-adaptive-container mobile-section-spacing">
        {/* Vue records */}
        {currentView === 'records' && (
          <div className="text-center mobile-content-container">
            <h1 className="mobile-text-responsive-base sm:text-2xl lg:text-4xl font-bold mb-2 text-white drop-shadow-lg mobile-text-readable mobile-prevent-overflow">
              Mes Records Personnels
            </h1>
            <p className="text-white/90 mobile-text-hierarchy font-medium mobile-prevent-overflow">
              Historique complet de vos meilleures performances
            </p>
          </div>
        )}

        {/* Vue activities - Layout optimisé responsive */}
        {currentView === 'activities' && (
          <div className="mobile-flex-container items-center justify-between gap-2 sm:gap-4">
            <Link 
              to="/"
              className="flex items-center gap-2 text-white/80 hover:text-white mobile-smooth-transition hover:scale-105 mobile-touch-target-sm rounded-lg px-2 py-2 flex-shrink-0"
              aria-label="Retour au dashboard"
            >
              <ArrowLeft size={18} className="sm:w-5 sm:h-5 flex-shrink-0" />
              <TruncatedText
                text="Retour"
                maxLength={6}
                useFallbackAt={4}
                fallbackIcon={null}
                className="font-medium mobile-text-responsive hidden xs:inline mobile-prevent-overflow"
                showTooltip={false}
              />
            </Link>
            
            <h1 className="mobile-text-responsive-sm sm:text-xl lg:text-2xl font-bold text-white drop-shadow-lg mobile-text-readable text-center mobile-flex-item min-w-0">
              <TruncatedText
                text="ACTIVITÉS"
                maxLength={12}
                className="block mobile-prevent-overflow"
                showTooltip={false}
              />
            </h1>
            
            {/* Espace équilibré */}
            <div className="mobile-touch-target-sm flex-shrink-0 w-12"></div>
          </div>
        )}

        {/* Vue coach */}
        {currentView === 'coach' && (
          <div className="mobile-flex-container items-center justify-between gap-2 sm:gap-4">
            <Link 
              to="/"
              className="flex items-center gap-2 text-white/80 hover:text-white mobile-smooth-transition hover:scale-105 mobile-touch-target-sm rounded-lg px-2 py-2 flex-shrink-0"
              aria-label="Retour au dashboard"
            >
              <ArrowLeft size={18} className="sm:w-5 sm:h-5 flex-shrink-0" />
              <TruncatedText
                text="Retour"
                maxLength={6}
                useFallbackAt={4}
                fallbackIcon={null}
                className="font-medium mobile-text-responsive hidden xs:inline mobile-prevent-overflow"
                showTooltip={false}
              />
            </Link>
            
            <h1 className="mobile-text-responsive-sm sm:text-xl lg:text-2xl font-bold text-white drop-shadow-lg mobile-text-readable text-center mobile-flex-item min-w-0">
              <TruncatedText
                text="COACH IA"
                maxLength={10}
                className="block mobile-prevent-overflow"
                showTooltip={false}
              />
            </h1>
            
            {/* Espace équilibré */}
            <div className="mobile-touch-target-sm flex-shrink-0 w-12"></div>
          </div>
        )}

        {/* Vue dashboard */}
        {currentView === 'dashboard' && (
          <div className="text-center mobile-content-container">
            <h1 className="mobile-text-responsive-base sm:text-2xl lg:text-4xl font-bold mb-2 text-white drop-shadow-lg mobile-text-readable mobile-prevent-overflow">
              RunTracker Pro
            </h1>
            <p className="text-white/90 mobile-text-hierarchy font-medium mobile-prevent-overflow">
              Votre compagnon de course personnalisé
            </p>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
