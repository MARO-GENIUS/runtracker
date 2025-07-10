
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
        className="mobile-touch-target p-2 hover:bg-gray-100 transition-colors"
        aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </Button>

      {/* Mobile Menu Overlay - Amélioré pour mobile */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-25 backdrop-blur-sm" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* Menu Panel */}
          <div className="fixed right-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 mobile-scroll-smooth">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-900">Menu</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="mobile-touch-target-sm p-1 hover:bg-gray-200 transition-colors rounded-full"
                  aria-label="Fermer le menu"
                >
                  <X size={20} />
                </Button>
              </div>
            </div>

            {/* Navigation Items */}
            <div className="p-4 space-y-2">
              <Link
                to="/"
                onClick={handleLinkClick}
                className={`mobile-touch-target w-full text-left px-4 py-3 rounded-xl text-base font-medium transition-all mobile-smooth-transition flex items-center gap-3 ${
                  currentView === 'dashboard'
                    ? 'text-running-blue bg-running-blue/10 shadow-sm'
                    : 'text-gray-700 hover:text-running-blue hover:bg-gray-50 active:bg-gray-100'
                }`}
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  📊
                </div>
                Dashboard
              </Link>

              <Link
                to="/activities"
                onClick={handleLinkClick}
                className={`mobile-touch-target w-full text-left px-4 py-3 rounded-xl text-base font-medium transition-all mobile-smooth-transition flex items-center gap-3 ${
                  currentView === 'activities'
                    ? 'text-running-blue bg-running-blue/10 shadow-sm'
                    : 'text-gray-700 hover:text-running-blue hover:bg-gray-50 active:bg-gray-100'
                }`}
              >
                <img 
                  src="/lovable-uploads/a2cee3cb-da89-44da-abe5-71ec896d51a9.png" 
                  alt="Mes performances" 
                  className="h-6 w-6"
                />
                Mes performances
              </Link>

              <Link
                to="/records"
                onClick={handleLinkClick}
                className={`mobile-touch-target w-full text-left px-4 py-3 rounded-xl text-base font-medium transition-all mobile-smooth-transition flex items-center gap-3 ${
                  currentView === 'records'
                    ? 'text-running-blue bg-running-blue/10 shadow-sm'
                    : 'text-gray-700 hover:text-running-blue hover:bg-gray-50 active:bg-gray-100'
                }`}
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  🏆
                </div>
                Records
              </Link>

              <Link
                to="/coach"
                onClick={handleLinkClick}
                className={`mobile-touch-target w-full text-left px-4 py-3 rounded-xl text-base font-medium transition-all mobile-smooth-transition flex items-center gap-3 ${
                  currentView === 'coach'
                    ? 'text-running-blue bg-running-blue/10 shadow-sm'
                    : 'text-gray-700 hover:text-running-blue hover:bg-gray-50 active:bg-gray-100'
                }`}
              >
                <Brain className="h-6 w-6" />
                Coach IA
              </Link>
            </div>

            {/* User Section */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-3 py-2 bg-white rounded-lg shadow-sm">
                  <User size={20} className="text-gray-600" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-gray-900 font-medium truncate block">
                      {user.email}
                    </span>
                    <span className="text-xs text-gray-500">Connecté</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onSignOut();
                    setIsOpen(false);
                  }}
                  className="mobile-touch-target w-full flex items-center gap-3 px-3 py-3 text-base text-red-600 hover:text-red-700 hover:bg-red-50 active:bg-red-100 rounded-xl transition-all mobile-smooth-transition font-medium"
                >
                  <LogOut size={20} />
                  Déconnexion
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
