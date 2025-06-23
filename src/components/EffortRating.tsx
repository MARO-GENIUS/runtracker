
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Heart, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface EffortRatingProps {
  activityId: number;
  currentRating?: number | null;
  currentNotes?: string | null;
  onSave: (rating: number, notes: string) => Promise<void>;
}

const effortLabels = {
  1: { label: 'Très facile', color: 'text-green-600', bg: 'bg-green-50' },
  2: { label: 'Facile', color: 'text-green-500', bg: 'bg-green-50' },
  3: { label: 'Modéré', color: 'text-lime-500', bg: 'bg-lime-50' },
  4: { label: 'Confortable', color: 'text-yellow-500', bg: 'bg-yellow-50' },
  5: { label: 'Soutenu', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  6: { label: 'Difficile', color: 'text-orange-500', bg: 'bg-orange-50' },
  7: { label: 'Très difficile', color: 'text-orange-600', bg: 'bg-orange-50' },
  8: { label: 'Intense', color: 'text-red-500', bg: 'bg-red-50' },
  9: { label: 'Très intense', color: 'text-red-600', bg: 'bg-red-50' },
  10: { label: 'Épuisant', color: 'text-red-700', bg: 'bg-red-50' }
};

export const EffortRating: React.FC<EffortRatingProps> = ({
  activityId,
  currentRating,
  currentNotes,
  onSave
}) => {
  const [rating, setRating] = useState<number>(currentRating || 5);
  const [notes, setNotes] = useState<string>(currentNotes || '');
  const [saving, setSaving] = useState(false);
  const [hasChanged, setHasChanged] = useState(false);

  useEffect(() => {
    const ratingChanged = currentRating !== rating;
    const notesChanged = currentNotes !== notes;
    setHasChanged(ratingChanged || notesChanged);
  }, [rating, notes, currentRating, currentNotes]);

  const handleRatingChange = (values: number[]) => {
    setRating(values[0]);
  };

  const handleSave = async () => {
    if (!hasChanged) return;
    
    try {
      setSaving(true);
      await onSave(rating, notes);
      toast.success('Ressenti sauvegardé avec succès');
      setHasChanged(false);
    } catch (error) {
      console.error('Error saving effort rating:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const currentLabel = effortLabels[rating as keyof typeof effortLabels];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500" />
          Ressenti d'effort
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Affichage de la note actuelle */}
        <div className={`text-center p-4 rounded-lg ${currentLabel.bg}`}>
          <div className="text-3xl font-bold mb-2">{rating}/10</div>
          <div className={`text-lg font-medium ${currentLabel.color}`}>
            {currentLabel.label}
          </div>
        </div>

        {/* Slider de notation */}
        <div className="space-y-4">
          <div className="px-2">
            <Slider
              value={[rating]}
              onValueChange={handleRatingChange}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
          </div>
          
          {/* Marqueurs visuels */}
          <div className="flex justify-between text-xs text-gray-500 px-2">
            <span>1 - Très facile</span>
            <span>5 - Soutenu</span>
            <span>10 - Épuisant</span>
          </div>
        </div>

        {/* Zone de commentaires */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Notes sur votre ressenti (optionnel)
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Décrivez votre ressenti, les conditions, votre état..."
            className="min-h-[80px] resize-none"
          />
        </div>

        {/* Bouton de sauvegarde */}
        {hasChanged && (
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="w-full"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Sauvegarder le ressenti
              </>
            )}
          </Button>
        )}

        {!hasChanged && currentRating && (
          <div className="text-center text-sm text-gray-500">
            Ressenti enregistré le {new Date().toLocaleDateString('fr-FR')}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
