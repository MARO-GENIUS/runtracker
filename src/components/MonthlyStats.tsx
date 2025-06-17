
import { monthlyStats } from '../data/mockData';
import { TrendingUp, Target, Calendar } from 'lucide-react';

const MonthlyStats = () => {
  const progressPercentage = (monthlyStats.currentMonth.km / monthlyStats.currentMonth.target) * 100;
  const monthlyGrowth = ((monthlyStats.currentMonth.km - monthlyStats.previousMonth.km) / monthlyStats.previousMonth.km * 100);
  const yearlyGrowth = ((monthlyStats.yearTotal - monthlyStats.previousYear) / monthlyStats.previousYear * 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
      {/* Objectif mensuel */}
      <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-running-green/10 p-2 rounded-lg">
            <Target className="text-running-green" size={20} />
          </div>
          <h3 className="font-semibold text-gray-800">Objectif Juin</h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <span className="text-2xl font-bold text-running-green">
              {monthlyStats.currentMonth.km}
            </span>
            <span className="text-gray-600">/ {monthlyStats.currentMonth.target} km</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-running-green to-running-green-light h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{progressPercentage.toFixed(0)}% réalisé</span>
            <span className={`font-medium ${monthlyGrowth >= 0 ? 'text-running-green' : 'text-red-500'}`}>
              {monthlyGrowth >= 0 ? '+' : ''}{monthlyGrowth.toFixed(1)}% vs mai
            </span>
          </div>
        </div>
      </div>

      {/* Total annuel */}
      <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-running-blue/10 p-2 rounded-lg">
            <Calendar className="text-running-blue" size={20} />
          </div>
          <h3 className="font-semibold text-gray-800">Total 2024</h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-running-blue">
              {monthlyStats.yearTotal.toLocaleString()}
            </span>
            <span className="text-gray-600">km</span>
          </div>
          
          <div className="text-sm text-gray-600">
            vs 2023: {monthlyStats.previousYear.toLocaleString()} km
          </div>
          
          <div className={`flex items-center gap-1 text-sm font-medium ${yearlyGrowth >= 0 ? 'text-running-green' : 'text-red-500'}`}>
            <TrendingUp size={16} />
            {yearlyGrowth >= 0 ? '+' : ''}{yearlyGrowth.toFixed(1)}% d'amélioration
          </div>
        </div>
      </div>

      {/* Performances récentes */}
      <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-running-purple/10 p-2 rounded-lg">
            <TrendingUp className="text-running-purple" size={20} />
          </div>
          <h3 className="font-semibold text-gray-800">Forme Actuelle</h3>
        </div>
        
        <div className="space-y-3">
          <div className="bg-gradient-performance text-white p-3 rounded-lg">
            <div className="text-sm opacity-90">Allure moyenne 30j</div>
            <div className="text-xl font-bold">4:15/km</div>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Meilleure série</span>
            <span className="font-medium text-running-purple">7 jours consécutifs</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Prochains objectifs</span>
            <span className="font-medium text-running-orange">Sub-19' au 5km</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyStats;
