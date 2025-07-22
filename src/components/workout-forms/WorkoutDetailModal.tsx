
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { WorkoutDetailForm } from './WorkoutDetailForm';
import { useWorkoutDetails } from '@/hooks/useWorkoutDetails';
import { WorkoutData } from '@/types/workoutTypes';
import { Trash2, ClipboardList, LayoutList, LayoutDashboard, Loader2, Save } from 'lucide-react';
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
  const { workoutDetail, loading, saveSuccess, saveWorkoutDetail, deleteWorkoutDetail } = useWorkoutDetails(activityId);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expanded, setExpanded] = useState(!!workoutDetail);
  const [isSaving, setIsSaving] = useState(false);
  const [saveAttempted, setSaveAttempted] = useState(false);

  useEffect(() => {
    // If a workout detail exists, default to expanded view
    // Otherwise, start with the simplified view for new entries
    setExpanded(!!workoutDetail);
  }, [workoutDetail, isOpen]);

  useEffect(() => {
    // Reset saving state when modal is opened
    if (isOpen) {
      setIsSaving(false);
      setSaveAttempted(false);
    }
  }, [isOpen]);

  useEffect(() => {
    // If save was successful and we attempted to save, close the modal
    if (saveSuccess === true && saveAttempted) {
      // Small delay to allow the user to see the success message
      const timer = setTimeout(() => {
        onClose();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess, saveAttempted, onClose]);

  const handleSave = async (data: WorkoutData) => {
    if (!sessionType) {
      toast.error("Type de séance non défini");
      return;
    }
    
    console.log('[WorkoutDetailModal] Save requested with data:', data);
    setIsSaving(true);
    setSaveAttempted(true);
    
    try {
      const success = await saveWorkoutDetail(sessionType, data);
      
      if (success) {
        console.log('[WorkoutDetailModal] Save successful');
        toast.success('Enregistrement réussi ✅');
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
    await deleteWorkoutDetail();
    setIsDeleting(false);
    onClose();
  };

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  const handleCloseRequest = () => {
    // If we're in the middle of saving, don't close
    if (isSaving) {
      console.log('[WorkoutDetailModal] Close requested but save in progress');
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
                disabled={isSaving}
              >
                {expanded ? (
                  <>
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Simplifier l'affichage</span>
                  </>
                ) : (
                  <>
                    <LayoutList className="h-4 w-4" />
                    <span>Détailler l'affichage</span>
                  </>
                )}
              </Button>
              
              {workoutDetail && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting || isSaving}
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
          <WorkoutDetailForm
            sessionType={sessionType}
            initialData={workoutDetail?.workout_data}
            onSave={handleSave}
            onCancel={handleCloseRequest}
            loading={loading || isSaving}
            expanded={expanded}
            isSaving={isSaving}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
