
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface BiometricData {
  runningPower?: number;
  cadence?: number;
  strideLength?: number;
  groundContactTime?: number;
  verticalOscillation?: number;
  leftRightBalance?: number;
  effortRating: number;
  recoveryRating: number;
  notes?: string;
}

interface BiometricDataFormProps {
  activityId?: number;
  onSave?: (data: BiometricData) => void;
}

const BiometricDataForm = ({ activityId, onSave }: BiometricDataFormProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<BiometricData>({
    effortRating: 5,
    recoveryRating: 5
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      // Si on a un activityId, sauvegarder en base
      if (activityId) {
        const { error } = await supabase
          .from('strava_activities')
          .update({
            effort_rating: formData.effortRating,
            effort_notes: formData.notes || null
          })
          .eq('id', activityId)
          .eq('user_id', user.id);

        if (error) throw error;

        // Optionnel : sauvegarder les métriques avancées dans une table séparée
        // (nécessiterait une nouvelle table pour les données biométriques)
      }

      toast.success('Données biométriques sauvegardées');
      onSave?.(formData);
    } catch (error: any) {
      toast.error('Erreur lors de la sauvegarde');
      console.error('Error saving biometric data:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Données biométriques</CardTitle>
        <CardDescription>
          Ajoutez vos métriques et ressentis pour enrichir l'analyse
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Métriques de puissance et technique */}
            <div className="space-y-2">
              <Label htmlFor="runningPower">Puissance de course (watts)</Label>
              <Input
                id="runningPower"
                type="number"
                placeholder="ex: 250"
                value={formData.runningPower || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  runningPower: e.target.value ? Number(e.target.value) : undefined
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cadence">Cadence (pas/min)</Label>
              <Input
                id="cadence"
                type="number"
                placeholder="ex: 180"
                value={formData.cadence || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  cadence: e.target.value ? Number(e.target.value) : undefined
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="strideLength">Longueur de foulée (cm)</Label>
              <Input
                id="strideLength"
                type="number"
                placeholder="ex: 120"
                value={formData.strideLength || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  strideLength: e.target.value ? Number(e.target.value) : undefined
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="groundContactTime">Temps d'appui (ms)</Label>
              <Input
                id="groundContactTime"
                type="number"
                placeholder="ex: 240"
                value={formData.groundContactTime || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  groundContactTime: e.target.value ? Number(e.target.value) : undefined
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="verticalOscillation">Oscillation verticale (cm)</Label>
              <Input
                id="verticalOscillation"
                type="number"
                step="0.1"
                placeholder="ex: 8.5"
                value={formData.verticalOscillation || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  verticalOscillation: e.target.value ? Number(e.target.value) : undefined
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="leftRightBalance">Symétrie G/D (%)</Label>
              <Input
                id="leftRightBalance"
                type="number"
                step="0.1"
                placeholder="ex: 50.2"
                value={formData.leftRightBalance || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  leftRightBalance: e.target.value ? Number(e.target.value) : undefined
                }))}
              />
            </div>
          </div>

          {/* Ressenti et récupération */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="effortRating">Effort perçu (1-10)</Label>
              <Select
                value={formData.effortRating.toString()}
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  effortRating: Number(value)
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5,6,7,8,9,10].map(rating => (
                    <SelectItem key={rating} value={rating.toString()}>
                      {rating} - {rating <= 3 ? 'Facile' : rating <= 6 ? 'Modéré' : rating <= 8 ? 'Difficile' : 'Très difficile'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recoveryRating">Récupération (1-10)</Label>
              <Select
                value={formData.recoveryRating.toString()}
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  recoveryRating: Number(value)
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5,6,7,8,9,10].map(rating => (
                    <SelectItem key={rating} value={rating.toString()}>
                      {rating} - {rating <= 3 ? 'Fatigue' : rating <= 6 ? 'Normal' : rating <= 8 ? 'Bonne' : 'Excellente'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes et observations</Label>
            <Textarea
              id="notes"
              placeholder="Conditions météo, sensations, observations techniques..."
              value={formData.notes || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                notes: e.target.value
              }))}
              rows={3}
            />
          </div>

          <Button type="submit" disabled={saving} className="w-full">
            {saving ? 'Sauvegarde...' : 'Sauvegarder les données'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default BiometricDataForm;
