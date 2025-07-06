
import { Input } from '@/components/ui/input';

interface ActivitySearchInputProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const ActivitySearchInput = ({ searchTerm, onSearchChange }: ActivitySearchInputProps) => {
  return (
    <div className="flex-shrink-0">
      <Input
        placeholder="Rechercher par nom, type d'activité ou lieu..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full"
      />
    </div>
  );
};

export default ActivitySearchInput;
