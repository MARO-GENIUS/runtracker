
import { useState } from 'react';
import { personalRecords } from '../data/mockData';
import { MapPin, Clock, Filter, ChevronDown } from 'lucide-react';

const RecordsTable = () => {
  const [sortBy, setSortBy] = useState<'distance' | 'time' | 'date'>('date');
  const [filterDistance, setFilterDistance] = useState('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const distances = [...new Set(personalRecords.map(record => record.distance))];

  const filteredAndSorted = personalRecords
    .filter(record => filterDistance === 'all' || record.distance === filterDistance)
    .sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      }
      return 0;
    });

  return (
    <div className="bg-white rounded-xl shadow-lg animate-fade-in">
      {/* Filtres */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Historique Complet</h2>
          
          <div className="flex gap-3">
            <div className="relative">
              <select 
                className="appearance-none bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 pr-8 text-sm focus:ring-2 focus:ring-running-blue focus:border-transparent"
                value={filterDistance}
                onChange={(e) => setFilterDistance(e.target.value)}
              >
                <option value="all">Toutes distances</option>
                {distances.map(distance => (
                  <option key={distance} value={distance}>{distance}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            
            <button 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                sortOrder === 'desc' 
                  ? 'bg-running-blue text-white' 
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            >
              <Filter size={16} />
              {sortOrder === 'desc' ? 'Plus récent' : 'Plus ancien'}
            </button>
          </div>
        </div>
      </div>

      {/* Table responsive */}
      <div className="overflow-x-auto">
        <div className="grid gap-2 p-4 md:hidden">
          {/* Version mobile - Cards optimisées */}
          {filteredAndSorted.map((record) => (
            <div 
              key={record.id}
              className={`border rounded-lg p-3 ${
                record.isRecent 
                  ? 'border-running-orange bg-orange-50' 
                  : 'border-gray-200 bg-white'
              } hover:shadow-md transition-shadow duration-200`}
            >
              {/* Ligne 1: Distance + Allure + Badge récent */}
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg text-gray-800">{record.distance}</span>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Clock size={12} />
                    <span>{record.pace}</span>
                  </div>
                </div>
                {record.isRecent && (
                  <span className="bg-running-orange text-white text-xs px-2 py-1 rounded-full">
                    Récent
                  </span>
                )}
              </div>
              
              {/* Ligne 2: Temps principal */}
              <div className="mb-2">
                <div className="font-bold text-xl text-running-blue">{record.time}</div>
              </div>
              
              {/* Ligne 3: Date + Lieu */}
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">{record.date}</div>
                  <div className="text-xs">{record.location}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Version desktop - Table */}
        <table className="w-full hidden md:table">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-4 px-6 font-semibold text-gray-700">Distance</th>
              <th className="text-left py-4 px-6 font-semibold text-gray-700">Temps</th>
              <th className="text-left py-4 px-6 font-semibold text-gray-700">Allure</th>
              <th className="text-left py-4 px-6 font-semibold text-gray-700">Date</th>
              <th className="text-left py-4 px-6 font-semibold text-gray-700">Lieu</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSorted.map((record) => (
              <tr 
                key={record.id}
                className={`border-b border-gray-50 hover:bg-gray-50 transition-colors duration-150 ${
                  record.isRecent ? 'bg-orange-50/50' : ''
                }`}
              >
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800">{record.distance}</span>
                    {record.isRecent && (
                      <span className="bg-running-orange text-white text-xs px-2 py-1 rounded-full">
                        Récent
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span className="font-bold text-lg text-running-blue">{record.time}</span>
                </td>
                <td className="py-4 px-6 text-gray-600">{record.pace}</td>
                <td className="py-4 px-6 text-gray-600">{record.date}</td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin size={14} />
                    <span className="text-sm">{record.location}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecordsTable;
