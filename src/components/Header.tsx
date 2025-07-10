
import { ArrowLeft } from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { Link } from 'react-router-dom';

interface HeaderProps {
  currentView: 'dashboard' | 'records' | 'activities' | 'coach';
  user: SupabaseUser;
  onSignOut: () => void;
}

const Header = ({ currentView }: HeaderProps) => {
  return (
    <header className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 text-white shadow-lg animate-fade-in">
      <div className="max-w-6xl mx-auto mobile-container mobile-section-spacing">
        {/* Vue records */}
        {currentView === 'records' && (
          <div className="text-center">
            <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold mb-2 text-white drop-shadow-lg mobile-text-readable">
              Mes Records Personnels
            </h1>
            <p className="text-white/90 mobile-text-hierarchy font-medium">
              Historique complet de vos meilleures performances
            </p>
          </div>
        )}

        {/* Vue activities - Layout optimisé responsive */}
        {currentView === 'activities' && (
          <div className="flex items-center justify-between gap-4">
            <Link 
              to="/"
              className="flex items-center gap-2 text-white/80 hover:text-white mobile-smooth-transition hover:scale-105 mobile-touch-target rounded-lg px-2 py-2"
            >
              <ArrowLeft size={20} />
              <span className="font-medium hidden sm:inline mobile-text-hierarchy">Retour au dashboard</span>
            </Link>
            
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white drop-shadow-lg mobile-text-readable text-center flex-1">
              ACTIVITÉS
            </h1>
            
            {/* Espace équilibré */}
            <div className="mobile-touch-target"></div>
          </div>
        )}

        {/* Vue coach */}
        {currentView === 'coach' && (
          <div className="flex items-center justify-between gap-4">
            <Link 
              to="/"
              className="flex items-center gap-2 text-white/80 hover:text-white mobile-smooth-transition hover:scale-105 mobile-touch-target rounded-lg px-2 py-2"
            >
              <ArrowLeft size={20} />
              <span className="font-medium hidden sm:inline mobile-text-hierarchy">Retour au dashboard</span>
            </Link>
            
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white drop-shadow-lg mobile-text-readable text-center flex-1">
              COACH IA
            </h1>
            
            {/* Espace équilibré */}
            <div className="mobile-touch-target"></div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
