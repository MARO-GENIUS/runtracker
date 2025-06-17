
import { personalRecords } from '../data/mockData';
import { MapPin, Clock } from 'lucide-react';

const RecordsSlider = () => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 animate-scale-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Records Personnels</h2>
        <span className="text-sm text-gray-600">{personalRecords.length} distances</span>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {personalRecords.map((record, index) => (
          <div 
            key={record.id}
            className={`min-w-64 bg-gradient-to-br ${
              record.isRecent 
                ? 'from-orange-50 to-orange-100 border-l-4 border-running-orange' 
                : 'from-gray-50 to-gray-100 border-l-4 border-gray-300'
            } rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:scale-105 cursor-pointer`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex justify-between items-start mb-3">
              <span className="font-bold text-lg text-gray-800">{record.distance}</span>
              {record.isRecent && (
                <span className="bg-running-orange text-white text-xs px-2 py-1 rounded-full">
                  Récent
                </span>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gray-600" />
                <span className="font-bold text-2xl text-running-blue">{record.time}</span>
              </div>
              <div className="text-sm text-gray-600">
                Allure: {record.pace}
              </div>
              <div className="flex items-start gap-2 mt-3">
                <MapPin size={14} className="text-gray-500 mt-0.5" />
                <div className="text-xs text-gray-500">
                  <div className="font-medium">{record.date}</div>
                  <div>{record.location}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecordsSlider;
