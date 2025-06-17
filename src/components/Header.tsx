
import { Calendar, Trophy, ArrowLeft } from 'lucide-react';

interface HeaderProps {
  currentView: 'dashboard' | 'records';
  onViewChange: (view: 'dashboard' | 'records') => void;
}

const Header = ({ currentView, onViewChange }: HeaderProps) => {
  return (
    <header className="bg-gradient-running text-white p-6 animate-fade-in">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          {currentView === 'records' ? (
            <button 
              onClick={() => onViewChange('dashboard')}
              className="flex items-center gap-2 text-white/90 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Retour au dashboard</span>
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Calendar size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">RunTracker Pro</h1>
                <p className="text-white/80">Semaine du 10-16 Juin 2024</p>
              </div>
            </div>
          )}
          
          {currentView === 'dashboard' && (
            <button 
              onClick={() => onViewChange('records')}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105"
            >
              <Trophy size={18} />
              <span>📜 Voir tous mes records</span>
            </button>
          )}
        </div>
        
        {currentView === 'records' && (
          <div>
            <h1 className="text-3xl font-bold mb-2">Mes Records Personnels</h1>
            <p className="text-white/80">Historique complet de vos meilleures performances</p>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
