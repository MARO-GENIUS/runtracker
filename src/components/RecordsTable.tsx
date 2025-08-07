
import { useState } from 'react';
import { MapPin, Clock, TrendingUp, BarChart3 } from 'lucide-react';
import { usePersonalRecords } from '@/hooks/usePersonalRecords';
import DistanceHistoryPanel from './DistanceHistoryPanel';
import MiniRecordChart from './MiniRecordChart';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const RecordsTable = () => {
  const { records, loading, error } = usePersonalRecords();
  const [filterDistance, setFilterDistance] = useState('all');
  const [sortBy, setSortBy] = useState<'time' | 'date'>('time');
  const [selectedRecord, setSelectedRecord] = useState<{distance: number, name: string} | null>(null);

  const distances = [...new Set(records.map(record => record.distance))];

  const filteredAndSorted = records
    .filter(record => filterDistance === 'all' || record.distance === filterDistance)
    .sort((a, b) => {
      if (sortBy === 'time') {
        // Parse time strings to seconds for comparison
        const parseTime = (timeStr: string) => {
          const parts = timeStr.split(':').map(Number);
          if (parts.length === 2) return parts[0] * 60 + parts[1]; // MM:SS
          if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]; // HH:MM:SS
          return 0;
        };
        return parseTime(a.time) - parseTime(b.time); // Meilleurs temps en premier
      } else {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA; // Plus récents en premier
      }
    });

  if (loading) {
    return (
      <div className="bg-card rounded-xl shadow-lg animate-fade-in">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-xl shadow-lg animate-fade-in">
        <div className="p-6 text-center">
          <p className="text-destructive">Erreur: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card rounded-xl shadow-lg animate-fade-in">
        {/* Header avec filtres */}
        <div className="p-6 border-b border-border">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <h2 className="text-xl font-bold text-card-foreground">Mes Records Personnels</h2>
            
            <div className="flex gap-3">
              <Select value={filterDistance} onValueChange={setFilterDistance}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Distance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes distances</SelectItem>
                  {distances.map(distance => (
                    <SelectItem key={distance} value={distance}>{distance}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={(value: 'time' | 'date') => setSortBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="time">Temps</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Grille de records */}
        <div className="p-6">
          {filteredAndSorted.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-card-foreground mb-2">Aucun record trouvé</h3>
              <p className="text-muted-foreground">
                {filterDistance !== 'all' 
                  ? `Aucun record pour la distance ${filterDistance}` 
                  : 'Vos records personnels apparaîtront ici après synchronisation avec Strava'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 md:gap-6">
              {filteredAndSorted.map((record) => (
                <div 
                  key={record.id}
                  className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-all duration-200 cursor-pointer group relative overflow-hidden"
                  onClick={() => setSelectedRecord({
                    distance: record.distanceMeters,
                    name: record.distance
                  })}
                >
                  {/* Badge récent */}
                  {record.isRecent && (
                    <Badge className="absolute top-3 right-3 bg-accent text-accent-foreground">
                      Récent
                    </Badge>
                  )}
                  
                  {/* Icône historique */}
                  <div className="absolute top-3 left-3 opacity-60 group-hover:opacity-100 transition-opacity">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  
                  {/* Distance */}
                  <div className="mb-4 mt-2">
                    <h3 className="text-2xl font-bold text-primary">{record.distance}</h3>
                  </div>
                  
                  {/* Temps principal */}
                  <div className="mb-3">
                    <div className="text-3xl font-bold text-card-foreground">{record.time}</div>
                  </div>
                  
                  {/* Allure */}
                  <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">{record.pace}</span>
                  </div>
                  
                  {/* Mini graphique d'évolution */}
                  <div className="mb-3">
                    <MiniRecordChart distance={record.distanceMeters} />
                  </div>
                  
                  {/* Date et lieu */}
                  <div className="space-y-1">
                    <div className="font-medium text-sm text-card-foreground">{record.date}</div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{record.location}</span>
                    </div>
                  </div>
                  
                  {/* Indicateur de clic */}
                  <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-60 transition-opacity">
                    <BarChart3 className="h-4 w-4 text-primary" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Panneau d'historique */}
      {selectedRecord && (
        <DistanceHistoryPanel
          isOpen={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
          distance={selectedRecord.distance}
          distanceName={selectedRecord.name}
        />
      )}
    </>
  );
};

export default RecordsTable;
