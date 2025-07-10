
import { useState } from 'react';
import { Settings } from 'lucide-react';

interface GoalEditorProps {
  currentGoal: number;
  onUpdateGoal: (newGoal: number) => Promise<void>;
}

export const GoalEditor = ({ currentGoal, onUpdateGoal }: GoalEditorProps) => {
  const [showGoalEdit, setShowGoalEdit] = useState(false);
  const [newGoal, setNewGoal] = useState(currentGoal);

  const handleGoalUpdate = async () => {
    await onUpdateGoal(newGoal);
    setShowGoalEdit(false);
  };

  if (showGoalEdit) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={newGoal}
            onChange={(e) => setNewGoal(Number(e.target.value))}
            className="mobile-input w-24 text-center"
            min="1"
            max="1000"
          />
          <span className="text-gray-600 font-medium">km</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGoalUpdate}
            className="bg-running-green text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-running-green/90 mobile-touch-target-sm"
          >
            Sauver
          </button>
          <button
            onClick={() => setShowGoalEdit(false)}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 mobile-touch-target-sm"
          >
            Annuler
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        setNewGoal(currentGoal);
        setShowGoalEdit(true);
      }}
      className="mobile-touch-target p-2 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <Settings size={16} className="text-gray-500" />
    </button>
  );
};
