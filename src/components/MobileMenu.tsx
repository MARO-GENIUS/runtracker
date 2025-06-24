
import { useState } from 'react';
import { Menu, X, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface MobileMenuProps {
  currentView: 'dashboard' | 'records' | 'activities';
  onViewChange: (view: 'dashboard' | 'records' | 'activities') => void;
  user: SupabaseUser;
  onSignOut: () => void;
}

const MobileMenu = ({ currentView, onViewChange, user, onSignOut }: MobileMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleViewChange = (view: 'dashboard' | 'records' | 'activities') => {
    onViewChange(view);
    setIsOpen(false);
  };

  return (
    <div className="md:hidden">
      {/* Menu Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </Button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setIsOpen(false)}>
          <div className="fixed right-0 top-0 h-full w-64 bg-white shadow-lg">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-900">Menu</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="p-1"
                >
                  <X size={20} />
                </Button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Navigation Items */}
              <button
                onClick={() => handleViewChange('dashboard')}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'dashboard'
                    ? 'text-running-blue bg-running-blue/10'
                    : 'text-gray-700 hover:text-running-blue hover:bg-gray-50'
                }`}
              >
                Dashboard
              </button>

              <button
                onClick={() => handleViewChange('activities')}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
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
                onClick={() => handleViewChange('records')}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'records'
                    ? 'text-running-blue bg-running-blue/10'
                    : 'text-gray-700 hover:text-running-blue hover:bg-gray-50'
                }`}
              >
                Records
              </button>
            </div>

            {/* User Section */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-3 py-2">
                  <User size={16} className="text-gray-600" />
                  <span className="text-sm text-gray-600 truncate">{user.email}</span>
                </div>
                <button
                  onClick={() => {
                    onSignOut();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut size={16} />
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileMenu;
