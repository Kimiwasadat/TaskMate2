import { getOfflineActions, removeOfflineAction } from './offlineStorageService';
import { updateAssignmentStatus, updateAssignmentProgress, toggleAssignmentHelp } from './firestoreService';

export const syncOfflineActions = async () => {
  const actions = await getOfflineActions();
  if (actions.length === 0) return true;

  console.log(`Starting sync for ${actions.length} offline actions...`);

  // Sort by timestamp so older actions are processed first
  actions.sort((a, b) => a.timestamp - b.timestamp);

  let successCount = 0;
  
  for (const action of actions) {
    try {
      if (action.type === 'UPDATE_PROGRESS') {
        await updateAssignmentProgress(action.payload.assignmentId, action.payload.currentStepIndex);
      } else if (action.type === 'UPDATE_STATUS') {
        await updateAssignmentStatus(action.payload.assignmentId, action.payload.status);
      } else if (action.type === 'TOGGLE_HELP') {
        await toggleAssignmentHelp(action.payload.assignmentId, action.payload.needsHelp);
      }
      
      // Successfully synced to Firestore, remove from queue
      await removeOfflineAction(action.id);
      successCount++;
    } catch (e) {
      console.error(`Failed to sync action ${action.id}:`, e);
      // We break on first error to preserve order and avoid applying newer states before older ones
      return false;
    }
  }

  console.log(`Successfully synced ${successCount} actions.`);
  return true;
};
