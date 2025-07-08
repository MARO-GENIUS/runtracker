
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Edit, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface LastSessionTypeSelectorProps {
  currentType: string | null;
  onTypeChange: (newType: string) => Promise<void>;
}

const LastSessionTypeSelector: React.FC<LastSessionTypeSelectorProps> = ({
  currentType,
  onTypeChange
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedType, setSelectedType] = useState(currentType || '');
  const [isLoading, setIsLoading] = useState(false);

  // Synchronize selectedType with currentType when it changes
  useEffect(() => {
    setSelectedType(currentType || '');
  }, [currentType]);

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
        await onTypeChange(selectedType);
        setIsEditing(false);
        toast.success(`Type de séance mis à jour : ${selectedType}`);
      } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
        toast.error('Erreur lors de la mise à jour du type de séance');
        // Reset to current value on error
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
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-blue-800 flex items-center justify-between">
          Dernière séance effectuée
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className="h-6 px-2 text-blue-600 hover:text-blue-800"
            >
              <Edit className="h-3 w-3" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {!isEditing ? (
          <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">
            {getSessionLabel(currentType)}
          </Badge>
        ) : (
          <div className="space-y-3">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner le type de séance" />
              </SelectTrigger>
              <SelectContent>
                {sessionTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-3 w-3 mr-1" />
                {isLoading ? 'Enregistrement...' : 'Valider'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
              >
                <X className="h-3 w-3 mr-1" />
                Annuler
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LastSessionTypeSelector;
