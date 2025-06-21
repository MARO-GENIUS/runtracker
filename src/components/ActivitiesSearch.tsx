
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface ActivitiesSearchProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  onSearch: (e: React.FormEvent) => void;
}

export const ActivitiesSearch: React.FC<ActivitiesSearchProps> = ({
  searchTerm,
  onSearchTermChange,
  onSearch
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique des activités</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              type="text"
              placeholder="Rechercher une activité..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit">Rechercher</Button>
        </form>
      </CardContent>
    </Card>
  );
};
