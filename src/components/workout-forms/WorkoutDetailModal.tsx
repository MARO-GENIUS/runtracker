
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { WorkoutDetailForm } from './WorkoutDetailForm';
import { useWorkoutDetails } from '@/hooks/useWorkoutDetails';
import { WorkoutData } from '@/types/workoutTypes';
import { Trash2, ClipboardList } from 'lucide-react';

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
  const { workoutDetail, loading, saveWorkoutDetail, deleteWorkoutDetail } = useWorkoutDetails(activityId);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expanded, setExpanded] = useState(!!workoutDetail);

  const handleSave = async (data: WorkoutData) => {
    if (!sessionType) return;
    await saveWorkoutDetail(sessionType, data);
    onClose();
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

  if (!sessionType) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
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
    <Dialog open={isOpen} onOpenChange={onClose}>
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
              >
                <ClipboardList className="h-4 w-4" />
                <span>{expanded ? 'Simplifier l\'affichage' : 'Détailler l\'affichage'}</span>
              </Button>
              
              {workoutDetail && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-destructive hover:text-destructive-foreground hover:bg-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
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
            onCancel={onClose}
            loading={loading}
            expanded={expanded}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
