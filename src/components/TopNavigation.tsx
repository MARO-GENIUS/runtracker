
import { User, LogOut, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { Link } from 'react-router-dom';
import MobileMenu from './MobileMenu';

interface TopNavigationProps {
  currentView: 'dashboard' | 'records' | 'activities' | 'coach';
  user: SupabaseUser;
  onSignOut: () => void;
}

const TopNavigation = ({ currentView, user, onSignOut }: TopNavigationProps) => {
  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto mobile-container">
        <div className="flex justify-between items-center mobile-header-height">
          {/* Logo à gauche - optimisé mobile */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center mobile-touch-target-sm mobile-smooth-transition hover:scale-105">
              <img 
                src="/lovable-uploads/734bc265-5a79-4eb5-abe6-747a6f0b6e12.png" 
                alt="RunTracker Pro Logo" 
                className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10"
              />
              <span className="ml-2 text-base sm:text-lg lg:text-xl font-bold text-gray-900 hidden sm:block">
                RunTracker Pro
              </span>
            </Link>
          </div>

          {/* Navigation centrale - Cachée sur mobile, optimisée pour tablette/desktop */}
          <div className="hidden md:flex space-x-1 lg:space-x-4">
            <Link
              to="/"
              className={`mobile-button mobile-smooth-transition rounded-lg text-sm font-medium ${
                currentView === 'dashboard'
                  ? 'text-running-blue bg-running-blue/10 shadow-sm'
                  : 'text-gray-700 hover:text-running-blue hover:bg-gray-50 active:bg-gray-100'
              }`}
            >
              Dashboard
            </Link>
            
            <Link
              to="/activities"
              className={`mobile-button mobile-smooth-transition rounded-lg text-sm font-medium flex items-center gap-2 ${
                currentView === 'activities'
                  ? 'text-running-blue bg-running-blue/10 shadow-sm'
                  : 'text-gray-700 hover:text-running-blue hover:bg-gray-50 active:bg-gray-100'
              }`}
            >
              <img 
                src="/lovable-uploads/a2cee3cb-da89-44da-abe5-71ec896d51a9.png" 
                alt="Mes performances" 
                className="h-4 w-4"
              />
              <span className="hidden lg:inline">Mes performances</span>
              <span className="lg:hidden">Perf.</span>
            </Link>

            <Link
              to="/records"
              className={`mobile-button mobile-smooth-transition rounded-lg text-sm font-medium ${
                currentView === 'records'
                  ? 'text-running-blue bg-running-blue/10 shadow-sm'
                  : 'text-gray-700 hover:text-running-blue hover:bg-gray-50 active:bg-gray-100'
              }`}
            >
              Records
            </Link>

            <Link
              to="/coach"
              className={`mobile-button mobile-smooth-transition rounded-lg text-sm font-medium flex items-center gap-2 ${
                currentView === 'coach'
                  ? 'text-running-blue bg-running-blue/10 shadow-sm'
                  : 'text-gray-700 hover:text-running-blue hover:bg-gray-50 active:bg-gray-100'
              }`}
            >
              <Brain className="h-4 w-4" />
              <span className="hidden lg:inline">Coach IA</span>
              <span className="lg:hidden">Coach</span>
            </Link>
          </div>

          {/* Section droite - optimisée mobile */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Menu hamburger mobile */}
            <MobileMenu 
              currentView={currentView}
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
                    className="mobile-button mobile-smooth-transition text-gray-700 hover:text-gray-900 hover:bg-gray-50 active:bg-gray-100"
                  >
                    <User size={18} />
                    <span className="hidden lg:block font-medium">Profil</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white shadow-lg border border-gray-200 z-50">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-sm text-gray-600 truncate mobile-text-hierarchy font-medium">{user.email}</p>
                  </div>
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
