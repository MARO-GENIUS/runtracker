
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
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Vue records */}
        {currentView === 'records' && (
          <div className="text-center">
            <h1 className="text-2xl sm:text-4xl font-bold mb-2 text-white drop-shadow-lg">Mes Records Personnels</h1>
            <p className="text-white/90 text-sm sm:text-lg font-medium">Historique complet de vos meilleures performances</p>
          </div>
        )}

        {/* Vue activities - Layout optimisé sur une ligne */}
        {currentView === 'activities' && (
          <div className="flex items-center justify-between">
            <Link 
              to="/"
              className="flex items-center gap-2 text-white/80 hover:text-white transition-all duration-200 hover:scale-105 min-h-[44px] min-w-[44px] p-2"
            >
              <ArrowLeft size={20} />
              <span className="font-medium hidden sm:inline">Retour au dashboard</span>
            </Link>
            
            <h1 className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg">ACTIVITÉS</h1>
            
            {/* Espace vide pour équilibrer le layout */}
            <div className="w-[44px]"></div>
          </div>
        )}

        {/* Vue coach */}
        {currentView === 'coach' && (
          <div className="flex items-center justify-between">
            <Link 
              to="/"
              className="flex items-center gap-2 text-white/80 hover:text-white transition-all duration-200 hover:scale-105 min-h-[44px] min-w-[44px] p-2"
            >
              <ArrowLeft size={20} />
              <span className="font-medium hidden sm:inline">Retour au dashboard</span>
            </Link>
            
            <h1 className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg">COACH IA</h1>
            
            {/* Espace vide pour équilibrer le layout */}
            <div className="w-[44px]"></div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
