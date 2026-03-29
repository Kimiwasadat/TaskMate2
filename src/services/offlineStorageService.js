import AsyncStorage from '@react-native-async-storage/async-storage';

const ASSIGNMENTS_KEY = '@offline_assignments';
const ACTIONS_KEY = '@offline_actions';

export const saveOfflineAssignments = async (assignments) => {
  try {
    await AsyncStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments));
  } catch (e) {
    console.error('Error saving assignments offline', e);
  }
};

export const getOfflineAssignments = async () => {
  try {
    const data = await AsyncStorage.getItem(ASSIGNMENTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error getting offline assignments', e);
    return [];
  }
};

export const queueOfflineAction = async (action) => {
  try {
    const existing = await getOfflineActions();
    const newAction = {
      ...action,
      id: Date.now().toString() + Math.random().toString(36).substring(7),
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(ACTIONS_KEY, JSON.stringify([...existing, newAction]));
  } catch (e) {
    console.error('Error queueing offline action', e);
  }
};

export const getOfflineActions = async () => {
  try {
    const data = await AsyncStorage.getItem(ACTIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error getting offline actions', e);
    return [];
  }
};

export const removeOfflineAction = async (actionId) => {
  try {
    const existing = await getOfflineActions();
    const filtered = existing.filter(a => a.id !== actionId);
    await AsyncStorage.setItem(ACTIONS_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Error removing offline action', e);
  }
};

export const clearOfflineActions = async () => {
  try {
    await AsyncStorage.removeItem(ACTIONS_KEY);
  } catch (e) {
    console.error('Error clearing offline actions', e);
  }
};

export const updateOfflineAssignment = async (assignmentId, updates) => {
  try {
    const assignments = await getOfflineAssignments();
    const updated = assignments.map(a => a.id === assignmentId ? { ...a, ...updates } : a);
    await saveOfflineAssignments(updated);
  } catch (e) {
    console.error('Error updating offline assignment', e);
  }
};
