
import { ArrowLeft } from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface HeaderProps {
  currentView: 'dashboard' | 'records' | 'activities';
  onViewChange: (view: 'dashboard' | 'records' | 'activities') => void;
  user: SupabaseUser;
  onSignOut: () => void;
}

const Header = ({ currentView, onViewChange }: HeaderProps) => {
  return (
    <header className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 text-white shadow-lg animate-fade-in">
      <div className="max-w-6xl mx-auto p-6">
        {/* Ligne supérieure avec navigation de retour si nécessaire */}
        {(currentView === 'records' || currentView === 'activities') && (
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={() => onViewChange('dashboard')}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-all duration-200 hover:scale-105"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Retour au dashboard</span>
            </button>
          </div>
        )}
        
        {/* Titre principal pour les vues spécifiques */}
        {currentView === 'dashboard' && (
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2 text-white drop-shadow-lg">RunTracker Pro</h1>
            <p className="text-white/90 text-lg font-medium">Votre compagnon de course personnalisé</p>
          </div>
        )}

        {currentView === 'records' && (
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2 text-white drop-shadow-lg">Mes Records Personnels</h1>
            <p className="text-white/90 text-lg font-medium">Historique complet de vos meilleures performances</p>
          </div>
        )}

        {currentView === 'activities' && (
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2 text-white drop-shadow-lg">ACTIVITÉS</h1>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
