
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Edit, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface LastSessionTypeSelectorProps {
  currentType: string | null;
  onTypeChange: (newType: string) => void;
}

const LastSessionTypeSelector: React.FC<LastSessionTypeSelectorProps> = ({
  currentType,
  onTypeChange
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedType, setSelectedType] = useState(currentType || '');

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

  const handleSave = () => {
    if (selectedType && selectedType !== currentType) {
      onTypeChange(selectedType);
      toast.success(`Type de séance mis à jour : ${selectedType}`);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setSelectedType(currentType || '');
    setIsEditing(false);
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
              onClick={() => setIsEditing(true)}
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
            {currentType || 'Non défini'}
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
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-3 w-3 mr-1" />
                Valider
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
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
