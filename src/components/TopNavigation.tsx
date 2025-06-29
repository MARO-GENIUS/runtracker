
import { User, LogOut, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { User as SupabaseUser } from '@supabase/supabase-js';
import MobileMenu from './MobileMenu';

interface TopNavigationProps {
  currentView: 'dashboard' | 'records' | 'activities' | 'coach';
  onViewChange: (view: 'dashboard' | 'records' | 'activities' | 'coach') => void;
  user: SupabaseUser;
  onSignOut: () => void;
}

const TopNavigation = ({ currentView, onViewChange, user, onSignOut }: TopNavigationProps) => {
  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo à gauche */}
          <div className="flex items-center">
            <img 
              src="/lovable-uploads/734bc265-5a79-4eb5-abe6-747a6f0b6e12.png" 
              alt="RunTracker Pro Logo" 
              className="h-8 w-8 sm:h-10 sm:w-10"
            />
            <span className="ml-2 sm:ml-3 text-lg sm:text-xl font-bold text-gray-900 hidden sm:block">
              RunTracker Pro
            </span>
          </div>

          {/* Navigation centrale - Cachée sur mobile */}
          <div className="hidden md:flex space-x-8">
            <button
              onClick={() => onViewChange('dashboard')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'dashboard'
                  ? 'text-running-blue bg-running-blue/10'
                  : 'text-gray-700 hover:text-running-blue hover:bg-gray-50'
              }`}
            >
              Dashboard
            </button>
            
            <button
              onClick={() => onViewChange('activities')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'activities'
                  ? 'text-running-blue bg-running-blue/10'
                  : 'text-gray-700 hover:text-running-blue hover:bg-gray-50'
              }`}
            >
              <img 
                src="/lovable-uploads/a2cee3cb-da89-44da-abe5-71ec896d51a9.png" 
                alt="Mes performances" 
                className="h-4 w-4"
              />
              Mes performances
            </button>

            <button
              onClick={() => onViewChange('records')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'records'
                  ? 'text-running-blue bg-running-blue/10'
                  : 'text-gray-700 hover:text-running-blue hover:bg-gray-50'
              }`}
            >
              Records
            </button>

            <button
              onClick={() => onViewChange('coach')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'coach'
                  ? 'text-running-blue bg-running-blue/10'
                  : 'text-gray-700 hover:text-running-blue hover:bg-gray-50'
              }`}
            >
              <Brain className="h-4 w-4" />
              Coach IA
            </button>
          </div>

          {/* Section droite */}
          <div className="flex items-center gap-2">
            {/* Menu hamburger mobile */}
            <MobileMenu 
              currentView={currentView}
              onViewChange={onViewChange}
              user={user}
              onSignOut={onSignOut}
            />

            {/* Menu profil desktop */}
            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="flex items-center gap-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <User size={18} />
                    <span className="hidden lg:block font-medium">Profil</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-sm text-gray-600 truncate">{user.email}</p>
                  </div>
                  <DropdownMenuItem onClick={onSignOut} className="text-red-600 hover:text-red-700">
                    <LogOut className="mr-2" size={16} />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default TopNavigation;
