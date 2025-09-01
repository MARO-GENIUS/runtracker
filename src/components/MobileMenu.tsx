
import React, { useState } from 'react';
import { Menu, X, User, LogOut, Brain, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { Link } from 'react-router-dom';

interface MobileMenuProps {
  currentView: 'dashboard' | 'records' | 'activities' | 'coach' | 'settings';
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
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm"
            className="px-1.5 py-0.5 mobile-touch-target mobile-smooth-transition"
          >
            <Menu size={16} />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-80 bg-white">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <img 
                  src="/lovable-uploads/734bc265-5a79-4eb5-abe6-747a6f0b6e12.png" 
                  alt="RunTracker Pro" 
                  className="h-6 w-6"
                />
                <span className="font-bold text-gray-900">RunTracker Pro</span>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6">
              <div className="space-y-2">
                <Link
                  to="/"
                  onClick={handleLinkClick}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg mobile-touch-target mobile-smooth-transition ${
                    currentView === 'dashboard'
                      ? 'text-running-blue bg-running-blue/10 font-medium'
                      : 'text-gray-700 hover:text-running-blue hover:bg-gray-50'
                  }`}
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    📊
                  </div>
                  Dashboard
                </Link>

                <Link
                  to="/activities"
                  onClick={handleLinkClick}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg mobile-touch-target mobile-smooth-transition ${
                    currentView === 'activities'
                      ? 'text-running-blue bg-running-blue/10 font-medium'
                      : 'text-gray-700 hover:text-running-blue hover:bg-gray-50'
                  }`}
                >
                  <img 
                    src="/lovable-uploads/a2cee3cb-da89-44da-abe5-71ec896d51a9.png" 
                    alt="Mes performances" 
                    className="h-5 w-5"
                  />
                  Mes performances
                </Link>

                <Link
                  to="/records"
                  onClick={handleLinkClick}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg mobile-touch-target mobile-smooth-transition ${
                    currentView === 'records'
                      ? 'text-running-blue bg-running-blue/10 font-medium'
                      : 'text-gray-700 hover:text-running-blue hover:bg-gray-50'
                  }`}
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    🏆
                  </div>
                  Records
                </Link>

                <Link
                  to="/coach"
                  onClick={handleLinkClick}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg mobile-touch-target mobile-smooth-transition ${
                    currentView === 'coach'
                      ? 'text-running-blue bg-running-blue/10 font-medium'
                      : 'text-gray-700 hover:text-running-blue hover:bg-gray-50'
                  }`}
                >
                  <Brain className="w-5 h-5" />
                  Coach IA
                </Link>
              </div>
            </nav>

            {/* Profile section */}
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
              </div>
              
              <Link
                to="/settings"
                onClick={handleLinkClick}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg mobile-touch-target mobile-smooth-transition ${
                  currentView === 'settings'
                    ? 'text-running-blue bg-running-blue/10 font-medium'
                    : 'text-gray-700 hover:text-running-blue hover:bg-gray-50'
                }`}
              >
                <Settings className="w-5 h-5" />
                Paramètres
              </Link>

              <button
                onClick={() => {
                  handleLinkClick();
                  onSignOut();
                }}
                className="flex items-center gap-3 px-3 py-3 rounded-lg mobile-touch-target mobile-smooth-transition text-red-600 hover:text-red-700 hover:bg-red-50 w-full text-left"
              >
                <LogOut className="w-5 h-5" />
                Déconnexion
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MobileMenu;
