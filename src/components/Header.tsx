import { Calendar, Trophy, ArrowLeft, User, LogOut } from 'lucide-react';
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
    <header className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 text-white shadow-lg animate-fade-in">
      <div className="max-w-6xl mx-auto p-6">
        {/* Ligne supérieure avec navigation */}
        <div className="flex items-center justify-between mb-6">
          {(currentView === 'records' || currentView === 'activities') ? (
            <button 
              onClick={() => onViewChange('dashboard')}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-all duration-200 hover:scale-105"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Retour au dashboard</span>
            </button>
          ) : (
            <div className="flex items-center gap-4">
              <img 
                src="/lovable-uploads/734bc265-5a79-4eb5-abe6-747a6f0b6e12.png" 
                alt="RunTracker Pro Logo" 
                className="h-16 w-16 drop-shadow-lg"
              />
            </div>
          )}
          
          <div className="flex items-center gap-3">
            {currentView === 'dashboard' && (
              <>
                <button 
                  onClick={() => onViewChange('activities')}
                  className="flex items-center gap-3 bg-white/15 hover:bg-white/25 backdrop-blur-sm px-4 py-2.5 rounded-xl transition-all duration-200 hover:scale-105 border border-white/20"
                >
                  <img 
                    src="/lovable-uploads/a2cee3cb-da89-44da-abe5-71ec896d51a9.png" 
                    alt="Carnet de sport" 
                    className="h-5 w-5 filter brightness-0 invert"
                  />
                  <span className="font-medium">Mes Performances</span>
                </button>
              </>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-white hover:bg-white/20 border border-white/20 backdrop-blur-sm">
                  <User size={20} />
                  <span className="ml-2 font-medium">{user.email}</span>
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
