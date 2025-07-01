
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { useActivities } from '@/hooks/useActivities';
import { ActivitiesSearch } from './ActivitiesSearch';
import { ActivitiesTableDesktop } from './ActivitiesTableDesktop';
import { ActivitiesTableMobile } from './ActivitiesTableMobile';
import { ActivitiesPagination } from './ActivitiesPagination';
import ActivityDetailModal from './ActivityDetailModal';

const ActivitiesTable = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'start_date' | 'distance' | 'moving_time'>('start_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { activities, loading, error, totalCount, refetch } = useActivities({
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
    setCurrentPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleActivityClick = (activityId: number) => {
    setSelectedActivityId(activityId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedActivityId(null);
  };

  const handleActivityDeleted = () => {
    // Rafraîchir les données après une suppression
    refetch();
  };

  const totalPages = Math.ceil(totalCount / 20);

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
    <>
      <div className="space-y-4">
        <ActivitiesSearch
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          onSearch={handleSearch}
        />

        <Card>
          <CardContent className="p-0">
            <ActivitiesTableMobile
              activities={activities}
              onActivityClick={handleActivityClick}
              onActivityDeleted={handleActivityDeleted}
            />
            
            <ActivitiesTableDesktop
              activities={activities}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
              onActivityClick={handleActivityClick}
              onActivityDeleted={handleActivityDeleted}
            />
          </CardContent>
        </Card>

        <ActivitiesPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          onPageChange={setCurrentPage}
        />
      </div>

      <ActivityDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        activityId={selectedActivityId}
      />
    </>
  );
};

export default ActivitiesTable;
