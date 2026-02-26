import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

/**
 * FIRESTORE SCHEMA:
 *
 * users/
 *   {userId}: { role: string, createdAt: timestamp }
 *
 * plans/
 *   {planId}: {
 *      coachId: string,
 *      title: string,
 *      description: string,
 *      isPublished: boolean,
 *      createdAt: timestamp,
 *      steps: [ { id, title, instruction, ttsText, durationMinutes, mediaType, mediaUrl } ]
 *   }
 *
 * assignments/
 *   {assignmentId}: {
 *      planId: string,
 *      clientId: string,
 *      coachId: string,
 *      status: 'not_started' | 'in_progress' | 'completed',
 *      assignedAt: timestamp,
 *      dueDate: string,
 *      stepsStatus: { [stepId]: { isCompleted: boolean, completedAt: timestamp, mediaProofUrl: string } }
 *   }
 */

// --- USER OPERATIONS ---
export const saveUserToFirestore = async (userId, role) => {
  try {
    const userRef = doc(db, "users", userId);
    await setDoc(
      userRef,
      {
        role,
        createdAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (error) {
    console.error("Error saving user:", error);
  }
};

export const getAllEmployees = async () => {
  try {
    const q = query(collection(db, "users"), where("role", "==", "Employee"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching employees:", error);
    return [];
  }
};

// --- PLAN OPERATIONS (COACHES) ---
export const createPlan = async (coachId, planData) => {
  try {
    const plansRef = collection(db, "plans");
    const docRef = await addDoc(plansRef, {
      ...planData,
      coachId,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating plan:", error);
    throw error;
  }
};

export const getPlansByCoach = async (coachId) => {
  try {
    const q = query(collection(db, "plans"), where("coachId", "==", coachId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching coach plans:", error);
    return [];
  }
};

export const getPlanById = async (planId) => {
  try {
    const docRef = doc(db, "plans", planId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("Error fetching plan:", error);
    return null;
  }
};

export const updatePlanSteps = async (planId, stepsArray) => {
  try {
    const planRef = doc(db, "plans", planId);
    await updateDoc(planRef, { steps: stepsArray });
  } catch (error) {
    console.error("Error updating plan steps:", error);
    throw error;
  }
};

// --- ASSIGNMENT OPERATIONS (EMPLOYEES/CLIENTS) ---
export const createAssignment = async (clientId, planId, coachId) => {
  try {
    const assignmentsRef = collection(db, "assignments");
    const docRef = await addDoc(assignmentsRef, {
      clientId,
      planId,
      coachId,
      status: "not_started",
      assignedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating assignment:", error);
    throw error;
  }
};
export const getAssignmentsForClient = async (clientId) => {
  try {
    const q = query(
      collection(db, "assignments"),
      where("clientId", "==", clientId),
    );
    const snapshot = await getDocs(q);

    // We also need to fetch the actual Plan details for each assignment
    const assignments = [];
    for (const docSnap of snapshot.docs) {
      const assignmentData = docSnap.data();
      const planDoc = await getDoc(doc(db, "plans", assignmentData.planId));

      if (planDoc.exists()) {
        assignments.push({
          id: docSnap.id,
          ...assignmentData,
          planDetails: planDoc.data(),
        });
      }
    }
    return assignments;
  } catch (error) {
    console.error("Error fetching client assignments:", error);
    return [];
  }
};

export const updateAssignmentStatus = async (assignmentId, status) => {
  try {
    const assignmentRef = doc(db, "assignments", assignmentId);
    await updateDoc(assignmentRef, { status });
  } catch (error) {
    console.error("Error updating assignment:", error);
    throw error;
  }
};
