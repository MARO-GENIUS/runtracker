
import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, Timer, Clock, Zap, Heart, MountainSnow, RotateCcw, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface LastSessionTypeSelectorProps {
  currentType: string | null;
  onTypeChange: (type: string) => Promise<void>;
}

const LastSessionTypeSelector: React.FC<LastSessionTypeSelectorProps> = ({ 
  currentType, 
  onTypeChange 
}) => {
  const sessionTypes = [
    { 
      id: 'intervals',
      label: 'Intervalles', 
      icon: <Timer className="h-4 w-4" />,
      color: 'bg-red-100 text-red-800 border-red-200'
    },
    { 
      id: 'threshold',
      label: 'Seuil', 
      icon: <Clock className="h-4 w-4" />,
      color: 'bg-purple-100 text-purple-800 border-purple-200'
    },
    { 
      id: 'endurance',
      label: 'Endurance', 
      icon: <Heart className="h-4 w-4" />,
      color: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    { 
      id: 'tempo',
      label: 'Tempo', 
      icon: <Share2 className="h-4 w-4" />,
      color: 'bg-amber-100 text-amber-800 border-amber-200'
    },
    { 
      id: 'hills',
      label: 'Côtes', 
      icon: <MountainSnow className="h-4 w-4" />,
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    },
    { 
      id: 'fartlek',
      label: 'Fartlek', 
      icon: <Zap className="h-4 w-4" />,
      color: 'bg-indigo-100 text-indigo-800 border-indigo-200'
    },
    { 
      id: 'recovery',
      label: 'Récupération', 
      icon: <RotateCcw className="h-4 w-4" />,
      color: 'bg-green-100 text-green-800 border-green-200'
    }
  ];

  // Normalize the current type to match our session type IDs
  const normalizeSessionType = (type: string | null): string | null => {
    if (!type) return null;
    
    type = type.toLowerCase().trim();
    
    if (type.includes('interval') || type.includes('fractionn') || type === 'intervalles') {
      return 'intervals';
    } else if (type.includes('seuil') || type === 'threshold') {
      return 'threshold';
    } else if (type.includes('endurance') || type === 'easy' || type === 'fondamentale') {
      return 'endurance';
    } else if (type.includes('tempo')) {
      return 'tempo';
    } else if (type.includes('côte') || type.includes('hill') || type.includes('cote')) {
      return 'hills';
    } else if (type.includes('fartlek')) {
      return 'fartlek';
    } else if (type.includes('récup') || type.includes('recovery') || type.includes('recup')) {
      return 'recovery';
    } else if (type.includes('long') || type.includes('sortie longue')) {
      return 'long';
    }
    
    return type;
  };

  const normalizedCurrentType = normalizeSessionType(currentType);

  const handleTypeSelect = async (typeId: string) => {
    try {
      await onTypeChange(typeId);
      toast.success(`Type de séance défini : ${sessionTypes.find(t => t.id === typeId)?.label}`);
    } catch (error) {
      console.error('Error setting session type:', error);
      toast.error('Erreur lors de la mise à jour du type de séance');
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-base font-medium text-gray-900">Type de votre dernière séance :</h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
        {sessionTypes.map((type) => {
          const isSelected = normalizedCurrentType === type.id;
          
          return (
            <div key={type.id} className="relative">
              <Button
                variant="outline"
                className={`h-auto py-3 px-3 w-full justify-center flex-col gap-2 transition-all duration-200 hover:shadow-md ${
                  isSelected 
                    ? 'bg-primary text-primary-foreground border-primary shadow-lg ring-2 ring-primary/20' 
                    : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleTypeSelect(type.id)}
              >
                <div className={`p-2 rounded-full transition-colors ${
                  isSelected 
                    ? 'bg-primary-foreground/20' 
                    : type.color
                }`}>
                  {type.icon}
                </div>
                <span className="text-sm font-medium">{type.label}</span>
                {isSelected && (
                  <div className="absolute -top-1 -right-1">
                    <div className="bg-primary text-primary-foreground rounded-full p-1">
                      <Check className="h-3 w-3" />
                    </div>
                  </div>
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LastSessionTypeSelector;
