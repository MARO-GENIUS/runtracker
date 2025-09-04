
import { User, LogOut, Brain, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { Link } from 'react-router-dom';
import MobileMenu from './MobileMenu';
import AuthButton from './AuthButton';

interface TopNavigationProps {
  currentView: 'dashboard' | 'records' | 'activities' | 'coach' | 'settings';
  user: SupabaseUser;
  onSignOut: () => void;
}

const TopNavigation = ({ currentView, user, onSignOut }: TopNavigationProps) => {
  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto mobile-container">
        <div className="flex justify-between items-center h-8 sm:h-9">
          {/* Logo à gauche - plus compact */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center mobile-touch-target-sm mobile-smooth-transition hover:scale-105">
              <img 
                src="/lovable-uploads/734bc265-5a79-4eb5-abe6-747a6f0b6e12.png" 
                alt="RunTracker Pro Logo" 
                className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5"
              />
              <span className="ml-1 text-xs sm:text-sm lg:text-base font-bold text-gray-900 hidden sm:block">
                RunTracker Pro
              </span>
            </Link>
          </div>

          {/* Navigation centrale - Compacte */}
          <div className="hidden md:flex space-x-0.5 lg:space-x-1">
            <Link
              to="/"
              className={`px-1.5 py-0.5 mobile-smooth-transition rounded-lg text-xs font-medium ${
                currentView === 'dashboard'
                  ? 'text-running-blue bg-running-blue/10 shadow-sm'
                  : 'text-gray-700 hover:text-running-blue hover:bg-gray-50 active:bg-gray-100'
              }`}
            >
              Dashboard
            </Link>
            
            <Link
              to="/activities"
              className={`px-1.5 py-0.5 mobile-smooth-transition rounded-lg text-xs font-medium flex items-center gap-1 ${
                currentView === 'activities'
                  ? 'text-running-blue bg-running-blue/10 shadow-sm'
                  : 'text-gray-700 hover:text-running-blue hover:bg-gray-50 active:bg-gray-100'
              }`}
            >
              <img 
                src="/lovable-uploads/a2cee3cb-da89-44da-abe5-71ec896d51a9.png" 
                alt="Mes performances" 
                className="h-2.5 w-2.5"
              />
              <span className="hidden lg:inline">Mes performances</span>
              <span className="lg:hidden">Perf.</span>
            </Link>

            <Link
              to="/records"
              className={`px-1.5 py-0.5 mobile-smooth-transition rounded-lg text-xs font-medium ${
                currentView === 'records'
                  ? 'text-running-blue bg-running-blue/10 shadow-sm'
                  : 'text-gray-700 hover:text-running-blue hover:bg-gray-50 active:bg-gray-100'
              }`}
            >
              Records
            </Link>

            <Link
              to="/coach"
              className={`px-1.5 py-0.5 mobile-smooth-transition rounded-lg text-xs font-medium flex items-center gap-1 ${
                currentView === 'coach'
                  ? 'text-running-blue bg-running-blue/10 shadow-sm'
                  : 'text-gray-700 hover:text-running-blue hover:bg-gray-50 active:bg-gray-100'
              }`}
            >
              <Brain className="h-2.5 w-2.5" />
              <span className="hidden lg:inline">Coach IA</span>
              <span className="lg:hidden">Coach</span>
            </Link>
          </div>

          {/* Section droite - compacte */}
          <div className="flex items-center gap-1">
            {/* Menu hamburger mobile */}
            <MobileMenu 
              currentView={currentView}
              user={user}
              onSignOut={onSignOut}
            />

            {/* Bouton d'authentification visible */}
            <div className="hidden sm:block mr-2">
              <AuthButton variant="outline" size="sm" />
            </div>

            {/* Menu profil desktop avec votre logo */}
            <div className="hidden md:flex items-center gap-1">
              {/* Votre logo */}
              <div className="flex items-center">
                <img 
                  src="/lovable-uploads/baf1ac1e-0e2b-4364-ad7e-8519a3628fab.png" 
                  alt="Logo" 
                  className="h-4 w-4 opacity-60"
                />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="px-1.5 py-0.5 mobile-smooth-transition text-gray-700 hover:text-gray-900 hover:bg-gray-50 active:bg-gray-100 text-xs"
                  >
                    <User size={12} />
                    <span className="hidden lg:block font-medium ml-0.5">Profil</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white shadow-lg border border-gray-200 z-[60]">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-sm text-gray-600 truncate mobile-text-hierarchy font-medium">{user.email}</p>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link 
                      to="/settings" 
                      className="flex items-center cursor-pointer mobile-touch-target mobile-smooth-transition hover:bg-gray-50"
                    >
                      <Settings className="mr-2" size={16} />
                      Paramètres
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={onSignOut} 
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 mobile-touch-target cursor-pointer mobile-smooth-transition"
                  >
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
