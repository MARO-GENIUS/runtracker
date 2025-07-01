
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2, AlertTriangle } from 'lucide-react';

interface DeleteActivityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  activityName: string;
  isDeleting: boolean;
}

export const DeleteActivityDialog: React.FC<DeleteActivityDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  activityName,
  isDeleting
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full">
              <Trash2 size={20} className="text-red-600" />
            </div>
            <div>
              <AlertDialogTitle className="text-lg font-semibold">
                Supprimer cette activité ?
              </AlertDialogTitle>
            </div>
          </div>
        </AlertDialogHeader>
        
        <AlertDialogDescription className="space-y-3">
          <p className="text-gray-700">
            Vous êtes sur le point de supprimer définitivement :
          </p>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="font-medium text-gray-800">"{activityName}"</p>
          </div>
          
          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Cette action supprimera aussi :</p>
              <ul className="text-xs space-y-1">
                <li>• Les records personnels associés</li>
                <li>• Les meilleurs efforts de cette course</li>
                <li>• Les recommandations IA liées</li>
                <li>• Les statistiques recalculées</li>
              </ul>
            </div>
          </div>
          
          <p className="text-sm text-gray-600">
            Cette action est irréversible.
          </p>
        </AlertDialogDescription>

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel 
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1"
          >
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 bg-red-600 hover:bg-red-700 focus:ring-red-500"
          >
            {isDeleting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Suppression...
              </div>
            ) : (
              'Supprimer définitivement'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
