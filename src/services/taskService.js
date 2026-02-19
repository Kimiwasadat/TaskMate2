import {
    collection,
    query,
    onSnapshot,
    doc,
    updateDoc,
    addDoc,
    getDocs
} from "firebase/firestore";
import { db } from "../config/firebase-config";
import { MOCK_TASKS } from "../data/mockTasks";

const TASKS_COLLECTION = "tasks";

export const taskService = {
    // Real-time listener for tasks
    subscribeToTasks: (callback) => {
        const q = query(collection(db, TASKS_COLLECTION));
        return onSnapshot(q, (snapshot) => {
            const tasks = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(tasks);
        });
    },

    // Update task status or progress
    updateTask: async (taskId, updates) => {
        const taskRef = doc(db, TASKS_COLLECTION, taskId);
        await updateDoc(taskRef, updates);
    },

    // Seed data function (for prototype phase)
    seedMockData: async () => {
        const querySnapshot = await getDocs(collection(db, TASKS_COLLECTION));
        if (querySnapshot.empty) {
            console.log("Seeding mock data to Firestore...");
            for (const task of MOCK_TASKS) {
                const { id, ...taskData } = task; // Remove mock id
                await addDoc(collection(db, TASKS_COLLECTION), taskData);
            }
        }
    }
};
