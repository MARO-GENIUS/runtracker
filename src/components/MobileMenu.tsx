
import { useState } from 'react';
import { Menu, X, User, LogOut, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { Link } from 'react-router-dom';

interface MobileMenuProps {
  currentView: 'dashboard' | 'records' | 'activities' | 'coach';
  user: SupabaseUser;
  onSignOut: () => void;
}

const MobileMenu = ({ currentView, user, onSignOut }: MobileMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <div className="md:hidden">
      {/* Menu Toggle Button - Optimisé pour le touch */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="mobile-touch-target mobile-smooth-transition p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg"
        aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
      >
        {isOpen ? <X size={20} className="text-gray-700" /> : <Menu size={20} className="text-gray-700" />}
      </Button>

      {/* Mobile Menu Overlay - Enhanced pour mobile */}
      {isOpen && (
        <>
          {/* Backdrop avec animation */}
          <div 
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm animate-fade-in" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* Menu Panel avec animations améliorées */}
          <div className="fixed right-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 mobile-scroll-smooth animate-slide-in-right">
            {/* Header avec design amélioré */}
            <div className="mobile-section-spacing border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img 
                    src="/lovable-uploads/734bc265-5a79-4eb5-abe6-747a6f0b6e12.png" 
                    alt="RunTracker Pro Logo" 
                    className="h-8 w-8"
                  />
                  <span className="text-lg font-bold text-gray-900">Menu</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="mobile-touch-target-sm mobile-smooth-transition p-2 hover:bg-gray-200 active:bg-gray-300 rounded-full"
                  aria-label="Fermer le menu"
                >
                  <X size={20} />
                </Button>
              </div>
            </div>

            {/* Navigation Items avec design amélioré */}
            <div className="mobile-section-spacing space-y-1">
              <Link
                to="/"
                onClick={handleLinkClick}
                className={`mobile-touch-target w-full text-left px-4 py-4 rounded-xl text-base font-medium mobile-smooth-transition flex items-center gap-3 ${
                  currentView === 'dashboard'
                    ? 'text-running-blue bg-running-blue/10 shadow-sm border border-running-blue/20'
                    : 'text-gray-700 hover:text-running-blue hover:bg-gray-50 active:bg-gray-100'
                }`}
              >
                <div className="w-6 h-6 flex items-center justify-center text-xl">
                  📊
                </div>
                <span>Dashboard</span>
                {currentView === 'dashboard' && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-running-blue"></div>
                )}
              </Link>

              <Link
                to="/activities"
                onClick={handleLinkClick}
                className={`mobile-touch-target w-full text-left px-4 py-4 rounded-xl text-base font-medium mobile-smooth-transition flex items-center gap-3 ${
                  currentView === 'activities'
                    ? 'text-running-blue bg-running-blue/10 shadow-sm border border-running-blue/20'
                    : 'text-gray-700 hover:text-running-blue hover:bg-gray-50 active:bg-gray-100'
                }`}
              >
                <img 
                  src="/lovable-uploads/a2cee3cb-da89-44da-abe5-71ec896d51a9.png" 
                  alt="Mes performances" 
                  className="h-6 w-6"
                />
                <span>Mes performances</span>
                {currentView === 'activities' && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-running-blue"></div>
                )}
              </Link>

              <Link
                to="/records"
                onClick={handleLinkClick}
                className={`mobile-touch-target w-full text-left px-4 py-4 rounded-xl text-base font-medium mobile-smooth-transition flex items-center gap-3 ${
                  currentView === 'records'
                    ? 'text-running-blue bg-running-blue/10 shadow-sm border border-running-blue/20'
                    : 'text-gray-700 hover:text-running-blue hover:bg-gray-50 active:bg-gray-100'
                }`}
              >
                <div className="w-6 h-6 flex items-center justify-center text-xl">
                  🏆
                </div>
                <span>Records</span>
                {currentView === 'records' && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-running-blue"></div>
                )}
              </Link>

              <Link
                to="/coach"
                onClick={handleLinkClick}
                className={`mobile-touch-target w-full text-left px-4 py-4 rounded-xl text-base font-medium mobile-smooth-transition flex items-center gap-3 ${
                  currentView === 'coach'
                    ? 'text-running-blue bg-running-blue/10 shadow-sm border border-running-blue/20'
                    : 'text-gray-700 hover:text-running-blue hover:bg-gray-50 active:bg-gray-100'
                }`}
              >
                <Brain className="h-6 w-6" />
                <span>Coach IA</span>
                {currentView === 'coach' && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-running-blue"></div>
                )}
              </Link>
            </div>

            {/* User Section avec design premium */}
            <div className="absolute bottom-0 left-0 right-0 mobile-section-spacing border-t border-gray-200 bg-gradient-to-t from-gray-50 to-white">
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="w-10 h-10 bg-running-blue/10 rounded-full flex items-center justify-center">
                    <User size={20} className="text-running-blue" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-gray-900 font-semibold truncate block mobile-text-hierarchy">
                      {user.email}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">Connecté</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onSignOut();
                    setIsOpen(false);
                  }}
                  className="mobile-touch-target w-full flex items-center gap-3 px-4 py-4 text-base text-red-600 hover:text-red-700 hover:bg-red-50 active:bg-red-100 rounded-xl mobile-smooth-transition font-medium border border-red-200 hover:border-red-300"
                >
                  <LogOut size={20} />
                  <span>Déconnexion</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MobileMenu;
