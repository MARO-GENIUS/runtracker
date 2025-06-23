
import { Calendar, Trophy, ArrowLeft, User, LogOut, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface HeaderProps {
  currentView: 'dashboard' | 'records' | 'activities';
  onViewChange: (view: 'dashboard' | 'records' | 'activities') => void;
  user: SupabaseUser;
  onSignOut: () => void;
}

const Header = ({ currentView, onViewChange, user, onSignOut }: HeaderProps) => {
  return (
    <header className="bg-gradient-running text-white animate-fade-in">
      <div className="max-w-6xl mx-auto p-6">
        {/* Ligne supérieure avec navigation */}
        <div className="flex items-center justify-between mb-6">
          {(currentView === 'records' || currentView === 'activities') ? (
            <button 
              onClick={() => onViewChange('dashboard')}
              className="flex items-center gap-2 text-white/90 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Retour au dashboard</span>
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <img 
                src="/lovable-uploads/c2ca1ccc-74df-4162-90d2-15a2f47241a8.png" 
                alt="RunTracker Pro Logo" 
                className="h-8 w-8 opacity-90"
              />
            </div>
          )}
          
          <div className="flex items-center gap-4">
            {currentView === 'dashboard' && (
              <>
                <button 
                  onClick={() => onViewChange('activities')}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105"
                >
                  <Activity size={18} />
                  <span>📊 Mes Performances</span>
                </button>
                <button 
                  onClick={() => onViewChange('records')}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105"
                >
                  <Trophy size={18} />
                  <span>📜 Voir tous mes records</span>
                </button>
              </>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-white hover:bg-white/20">
                  <User size={20} />
                  <span className="ml-2">{user.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onSignOut}>
                  <LogOut className="mr-2" size={16} />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Titre principal pour les vues spécifiques */}
        {currentView === 'dashboard' && (
          <div>
            <h1 className="text-3xl font-bold mb-2">RunTracker Pro</h1>
            <p className="text-white/80">Votre compagnon de course personnalisé</p>
          </div>
        )}

        {currentView === 'records' && (
          <div>
            <h1 className="text-3xl font-bold mb-2">Mes Records Personnels</h1>
            <p className="text-white/80">Historique complet de vos meilleures performances</p>
          </div>
        )}

        {currentView === 'activities' && (
          <div>
            <h1 className="text-3xl font-bold mb-2">Mes Performances</h1>
            <p className="text-white/80">Toutes vos activités de course synchronisées depuis Strava</p>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
