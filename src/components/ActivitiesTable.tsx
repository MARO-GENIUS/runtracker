
import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Search, ChevronUp, ChevronDown, MapPin, Clock, TrendingUp } from 'lucide-react';
import { useActivities } from '@/hooks/useActivities';
import { formatDistance, formatDuration, formatPace, formatDate, formatElevation } from '@/utils/activityHelpers';

const ActivitiesTable = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'start_date' | 'distance' | 'moving_time'>('start_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { activities, loading, error, totalCount, hasMore, refetch } = useActivities({
    page: currentPage,
    limit: 20,
    sortBy,
    sortOrder,
    searchTerm
  });

  const handleSort = (column: 'start_date' | 'distance' | 'moving_time') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
  };

  const totalPages = Math.ceil(totalCount / 20);

  const SortIcon = ({ column }: { column: 'start_date' | 'distance' | 'moving_time' }) => {
    if (sortBy !== column) return null;
    return sortOrder === 'desc' ? <ChevronDown size={16} /> : <ChevronUp size={16} />;
  };

  if (loading && activities.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-running-blue mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des activités...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <p className="text-red-700">{error}</p>
          <Button onClick={refetch} className="mt-4" variant="outline">
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <TrendingUp size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucune activité trouvée</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'Aucune activité ne correspond à votre recherche.' : 'Vos activités synchronisées apparaîtront ici.'}
          </p>
          {searchTerm && (
            <Button onClick={() => setSearchTerm('')} variant="outline">
              Effacer la recherche
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des activités</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                type="text"
                placeholder="Rechercher une activité..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">Rechercher</Button>
          </form>
        </CardContent>
      </Card>

      {/* Activities table */}
      <Card>
        <CardContent className="p-0">
          {/* Mobile view - Cards */}
          <div className="md:hidden">
            {activities.map((activity) => (
              <div key={activity.id} className="p-4 border-b border-gray-100 last:border-b-0">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-800 text-sm">{activity.name}</h3>
                  <span className="text-xs text-gray-500">{formatDate(activity.start_date_local)}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={14} className="text-running-blue" />
                    <span>{formatDistance(activity.distance)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-green-600" />
                    <span>{formatDuration(activity.moving_time)}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                  <span>Allure: {formatPace(activity.distance, activity.moving_time)}</span>
                  {activity.total_elevation_gain && (
                    <>
                      <span>•</span>
                      <span>D+: {formatElevation(activity.total_elevation_gain)}</span>
                    </>
                  )}
                </div>
                
                {(activity.location_city || activity.location_state) && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                    <MapPin size={12} />
                    <span>
                      {[activity.location_city, activity.location_state, activity.location_country]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop view - Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('start_date')}
                  >
                    <div className="flex items-center gap-2">
                      Date
                      <SortIcon column="start_date" />
                    </div>
                  </TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('distance')}
                  >
                    <div className="flex items-center gap-2">
                      Distance
                      <SortIcon column="distance" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('moving_time')}
                  >
                    <div className="flex items-center gap-2">
                      Durée
                      <SortIcon column="moving_time" />
                    </div>
                  </TableHead>
                  <TableHead>Allure</TableHead>
                  <TableHead>Dénivelé</TableHead>
                  <TableHead>Lieu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity) => (
                  <TableRow key={activity.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      {formatDate(activity.start_date_local)}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={activity.name}>
                        {activity.name}
                      </div>
                    </TableCell>
                    <TableCell>{formatDistance(activity.distance)}</TableCell>
                    <TableCell>{formatDuration(activity.moving_time)}</TableCell>
                    <TableCell className="text-running-blue font-medium">
                      {formatPace(activity.distance, activity.moving_time)}
                    </TableCell>
                    <TableCell>{formatElevation(activity.total_elevation_gain)}</TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {[activity.location_city, activity.location_state, activity.location_country]
                          .filter(Boolean)
                          .join(', ') || 'Non spécifié'}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => setCurrentPage(pageNum)}
                      isActive={currentPage === pageNum}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Results info */}
      <div className="text-center text-sm text-gray-600">
        Affichage de {Math.min(currentPage * 20, totalCount)} sur {totalCount} activités
      </div>
    </div>
  );
};

export default ActivitiesTable;
