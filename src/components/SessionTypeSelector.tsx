
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Edit, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface SessionTypeSelectorProps {
  activityId: number;
  currentType: string | null;
  onTypeChange: (activityId: number, newType: string) => Promise<void>;
}

const SessionTypeSelector: React.FC<SessionTypeSelectorProps> = ({
  activityId,
  currentType,
  onTypeChange
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedType, setSelectedType] = useState(currentType || '');
  const [isLoading, setIsLoading] = useState(false);

  const sessionTypes = [
    { value: 'footing', label: 'Footing' },
    { value: 'sortie longue', label: 'Sortie longue' },
    { value: 'intervalle', label: 'Intervalle' },
    { value: 'seuil', label: 'Seuil' },
    { value: 'récupération', label: 'Récupération' },
    { value: 'compétition', label: 'Compétition' },
    { value: 'côtes', label: 'Côtes' },
    { value: 'fartlek', label: 'Fartlek' }
  ];

  const handleSave = async () => {
    if (selectedType && selectedType !== currentType) {
      setIsLoading(true);
      try {
        await onTypeChange(activityId, selectedType);
        setIsEditing(false);
        toast.success(`Type de séance mis à jour : ${selectedType}`);
      } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
        toast.error('Erreur lors de la mise à jour du type de séance');
        setSelectedType(currentType || '');
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setSelectedType(currentType || '');
    setIsEditing(false);
  };

  const handleEdit = () => {
    setSelectedType(currentType || '');
    setIsEditing(true);
  };

  const getSessionLabel = (type: string | null) => {
    if (!type) return 'Non défini';
    const sessionType = sessionTypes.find(t => t.value === type);
    return sessionType ? sessionType.label : type;
  };

  return (
    <div className="flex items-center gap-2">
      {!isEditing ? (
        <>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
            {getSessionLabel(currentType)}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            className="h-6 px-2 text-blue-600 hover:text-blue-800"
          >
            <Edit className="h-3 w-3" />
          </Button>
        </>
      ) : (
        <div className="flex items-center gap-2">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sélectionner le type" />
            </SelectTrigger>
            <SelectContent>
              {sessionTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            <Check className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default SessionTypeSelector;
