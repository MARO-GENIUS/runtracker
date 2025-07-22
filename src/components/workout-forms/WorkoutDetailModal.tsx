
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { WorkoutDetailForm } from './WorkoutDetailForm';
import { useWorkoutDetails } from '@/hooks/useWorkoutDetails';
import { WorkoutData } from '@/types/workoutTypes';
import { Trash2, LayoutList, LayoutDashboard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface WorkoutDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityId: number;
  activityName: string;
  sessionType: string | null;
}

export const WorkoutDetailModal: React.FC<WorkoutDetailModalProps> = ({
  isOpen,
  onClose,
  activityId,
  activityName,
  sessionType
}) => {
  const { workoutDetail, loading, saveSuccess, saveWorkoutDetail, deleteWorkoutDetail, refetch } = useWorkoutDetails(activityId);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      console.log('[WorkoutDetailModal] Modal opened for activity:', activityId);
      setIsSaving(false);
      setExpanded(!!workoutDetail);
      // Force refresh data when modal opens
      if (activityId) {
        refetch();
      }
    } else {
      console.log('[WorkoutDetailModal] Modal closed');
      setExpanded(false);
    }
  }, [isOpen, activityId, workoutDetail]);

  const handleSave = async (data: WorkoutData) => {
    if (!sessionType) {
      toast.error("Type de séance non défini");
      return;
    }
    
    console.log('[WorkoutDetailModal] Save requested with data:', data);
    setIsSaving(true);
    
    try {
      const success = await saveWorkoutDetail(sessionType, data);
      
      if (success) {
        console.log('[WorkoutDetailModal] Save successful');
        toast.success('Enregistrement réussi ✅');
        
        // Close modal after short delay to show success message
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        console.error('[WorkoutDetailModal] Save failed');
        toast.error('Échec de l\'enregistrement');
      }
    } catch (error) {
      console.error('[WorkoutDetailModal] Save error:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteWorkoutDetail();
      toast.success('Détails supprimés');
      onClose();
    } catch (error) {
      console.error('[WorkoutDetailModal] Delete error:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  const handleCloseRequest = () => {
    if (isSaving) {
      console.log('[WorkoutDetailModal] Close requested but save in progress');
      toast.warning('Sauvegarde en cours...');
      return;
    }
    onClose();
  };

  if (!sessionType) {
    return (
      <Dialog open={isOpen} onOpenChange={handleCloseRequest}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails d'entraînement</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Veuillez d'abord sélectionner un type de séance pour cette activité.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseRequest}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Détails d'entraînement</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {activityName}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleExpand}
                className="flex items-center gap-1.5 text-primary hover:text-primary-foreground hover:bg-primary transition-colors"
                disabled={isSaving || loading}
              >
                {expanded ? (
                  <>
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Simplifier</span>
                  </>
                ) : (
                  <>
                    <LayoutList className="h-4 w-4" />
                    <span>Détailler</span>
                  </>
                )}
              </Button>
              
              {workoutDetail && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting || isSaving || loading}
                  className="text-destructive hover:text-destructive-foreground hover:bg-destructive transition-colors"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className={`transition-all duration-300 ${expanded ? 'opacity-100' : 'opacity-90'}`}>
          {loading && !workoutDetail ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Chargement des données...</span>
            </div>
          ) : (
            <WorkoutDetailForm
              sessionType={sessionType}
              initialData={workoutDetail?.workout_data}
              onSave={handleSave}
              onCancel={handleCloseRequest}
              loading={loading}
              expanded={expanded}
              isSaving={isSaving}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
