import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  orderBy,
  increment,
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
export const saveUserToFirestore = async (userId, role, username) => {
  try {
    const userRef = doc(db, "users", userId);
    await setDoc(
      userRef,
      {
        role,
        username,
        createdAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (error) {
    console.error("Error saving user:", error);
  }
};

export const saveUserPushToken = async (userId, token) => {
  if (!token) return;
  try {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, { expoPushToken: token }, { merge: true });
  } catch (error) {
    console.error("Error saving push token:", error);
  }
};

export const getUserPushToken = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      return userDoc.data().expoPushToken;
    }
    return null;
  } catch (error) {
    console.error("Error fetching push token:", error);
    return null;
  }
};

export const getAllEmployees = async () => {
  try {
    const q = query(collection(db, "users"), where("role", "==", "client"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching employees:", error);
    return [];
  }
};

export const getAllCoaches = async () => {
  try {
    const q = query(collection(db, "users"), where("role", "==", "coach"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching coaches:", error);
    return [];
  }
};

export const assignEmployeeToCoach = async (coachId, employeeId) => {
  try {
    const coachRef = doc(db, "users", coachId);
    await updateDoc(coachRef, {
      assignedEmployees: arrayUnion(employeeId),
    });
  } catch (error) {
    console.error("Error assigning employee to coach:", error);
    throw error;
  }
};

export const unassignEmployeeFromCoach = async (coachId, employeeId) => {
  try {
    const coachRef = doc(db, "users", coachId);
    await updateDoc(coachRef, {
      assignedEmployees: arrayRemove(employeeId),
    });
  } catch (error) {
    console.error("Error unassigning employee from coach:", error);
    throw error;
  }
};

export const getAssignedEmployeesForCoach = async (coachId) => {
  try {
    const coachDoc = await getDoc(doc(db, "users", coachId));
    if (!coachDoc.exists()) return [];

    const coachData = coachDoc.data();
    const assignedIds = coachData.assignedEmployees || [];

    if (assignedIds.length === 0) return [];

    // Fetch the actual user documents for these employee IDs
    const employeePromises = assignedIds.map((id) =>
      getDoc(doc(db, "users", id)),
    );
    const employeeDocs = await Promise.all(employeePromises);

    return employeeDocs
      .filter((docSnap) => docSnap.exists())
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  } catch (error) {
    console.error("Error fetching assigned employees:", error);
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

export const deletePlan = async (planId) => {
  try {
    // 1. Delete the plan doc
    const planRef = doc(db, "plans", planId);
    await deleteDoc(planRef);

    // 2. Query and delete all associated assignments
    const q = query(collection(db, "assignments"), where("planId", "==", planId));
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(docSnap => deleteDoc(doc(db, "assignments", docSnap.id)));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error("Error deleting plan:", error);
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
      currentStepIndex: 0,
      needsHelp: false,
      assignedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating assignment:", error);
    throw error;
  }
};

export const getAssignmentById = async (assignmentId) => {
  try {
    const docRef = doc(db, "assignments", assignmentId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("Error fetching assignment:", error);
    return null;
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

// Update the exact step the employee is currently working on
export const updateAssignmentProgress = async (assignmentId, currentStepIndex) => {
  try {
    const assignmentRef = doc(db, "assignments", assignmentId);
    await updateDoc(assignmentRef, { currentStepIndex });
  } catch (error) {
    console.error("Error updating assignment progress:", error);
    throw error;
  }
};

// Toggle the human help request flag for a specific assignment
export const toggleAssignmentHelp = async (assignmentId, needsHelp) => {
  try {
    const assignmentRef = doc(db, "assignments", assignmentId);
    await updateDoc(assignmentRef, { needsHelp });
  } catch (error) {
    console.error("Error toggling assignment help:", error);
    throw error;
  }
};

export const deleteAssignment = async (assignmentId) => {
  try {
    const assignmentRef = doc(db, "assignments", assignmentId);
    await deleteDoc(assignmentRef);
  } catch (error) {
    console.error("Error deleting assignment:", error);
    throw error;
  }
};

export const getAssignmentsByCoach = async (coachId) => {
  try {
    const q = query(
      collection(db, "assignments"),
      where("coachId", "==", coachId),
    );
    const snapshot = await getDocs(q);

    const assignments = [];
    for (const docSnap of snapshot.docs) {
      const assignmentData = docSnap.data();

      // Fetch Plan details safely
      let planDetails = null;
      if (assignmentData.planId) {
        const planDoc = await getDoc(doc(db, "plans", assignmentData.planId));
        if (planDoc.exists()) planDetails = planDoc.data();
      }

      // Fetch Employee details safely
      let userDetails = null;
      if (assignmentData.clientId) {
        const userDoc = await getDoc(doc(db, "users", assignmentData.clientId));
        if (userDoc.exists()) userDetails = userDoc.data();
      }

      assignments.push({
        id: docSnap.id,
        ...assignmentData,
        planDetails,
        userDetails,
      });
    }

    // Optional: Sort by assignedAt descending (newest first)
    assignments.sort(
      (a, b) => b.assignedAt?.toMillis() - a.assignedAt?.toMillis(),
    );

    return assignments;
  } catch (error) {
    console.error("Error fetching coach assignments:", error);
    return [];
  }
};

// Listen for real-time assignment updates specifically for a coach
export const subscribeToCoachAssignments = (coachId, callback) => {
  const q = query(
    collection(db, "assignments"),
    where("coachId", "==", coachId)
  );

  return onSnapshot(q, async (snapshot) => {
    try {
      const assignments = [];
      for (const docSnap of snapshot.docs) {
        const assignmentData = docSnap.data();

        // Fetch Plan details safely
        let planDetails = null;
        if (assignmentData.planId) {
          const planDoc = await getDoc(doc(db, "plans", assignmentData.planId));
          if (planDoc.exists()) planDetails = planDoc.data();
        }

        // Fetch Employee details safely
        let userDetails = null;
        if (assignmentData.clientId) {
          const userDoc = await getDoc(doc(db, "users", assignmentData.clientId));
          if (userDoc.exists()) userDetails = userDoc.data();
        }

        assignments.push({
          id: docSnap.id,
          ...assignmentData,
          planDetails,
          userDetails,
        });
      }

      // Sort by assignedAt descending (newest first)
      assignments.sort(
        (a, b) => b.assignedAt?.toMillis() - a.assignedAt?.toMillis(),
      );

      callback(assignments);
    } catch (error) {
      console.error("Error processing real-time assignments:", error);
      callback([]);
    }
  });
};

// --- SOCIAL CUES OPERATIONS ---
export const saveSocialCue = async (coachId, cueData) => {
  try {
    const cueRef = doc(collection(db, "socialCues"));
    const newCue = {
      id: cueRef.id,
      coachId,
      title: cueData.title,
      type: cueData.type, // 'exact_script' or 'ai_prompt'
      content: cueData.content,
      createdAt: serverTimestamp(),
    };
    await setDoc(cueRef, newCue);
    return newCue;
  } catch (error) {
    console.error("Error saving social cue:", error);
    throw error;
  }
};

export const getCoachSocialCues = async (coachId) => {
  try {
    const q = query(collection(db, "socialCues"), where("coachId", "==", coachId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  } catch (error) {
    console.error("Error fetching social cues:", error);
    return [];
  }
};

// --- CHAT & MESSAGING OPERATIONS ---

export const sendMessage = async (coachId, clientId, senderId, text, taskContext = null) => {
  try {
    const chatId = `${coachId}_${clientId}`;
    const messagesRef = collection(db, `chats/${chatId}/messages`);
    const newMessage = {
      senderId,
      text,
      taskContext, // Optional context like "Task: Clean Kitchen, Step 3"
      createdAt: serverTimestamp(),
      isRead: false,
    };
    await addDoc(messagesRef, newMessage);

    const isCoach = senderId === coachId;
    
    // Also update a "lastMessage" field on the chat document itself for the list view
    const chatDocRef = doc(db, "chats", chatId);
    const payload = {
      coachId,
      clientId,
      lastMessageText: text,
      lastMessageSenderId: senderId,
      lastMessageAt: serverTimestamp(),
    };
    
    // Increment the appropriate unread counter based on who sent it
    if (isCoach) {
      payload.unreadByClient = increment(1);
    } else {
      payload.unreadByCoach = increment(1);
    }
    
    await setDoc(chatDocRef, payload, { merge: true });

  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

export const markChatAsRead = async (coachId, clientId, userId) => {
  try {
    const chatId = `${coachId}_${clientId}`;
    const chatDocRef = doc(db, "chats", chatId);
    const isCoach = userId === coachId;
    
    const payload = {};
    if (isCoach) {
      payload.unreadByCoach = 0;
    } else {
      payload.unreadByClient = 0;
    }
    
    // Set with merge to safely update or create if doesn't exist
    await setDoc(chatDocRef, payload, { merge: true });
  } catch (error) {
    console.error("Error marking chat read:", error);
  }
};

export const subscribeToTotalUnreadCount = (userId, role, callback) => {
  const isCoach = role === "coach";
  const fieldToMatch = isCoach ? "coachId" : "clientId";
  const fieldToSum = isCoach ? "unreadByCoach" : "unreadByClient";

  const q = query(collection(db, "chats"), where(fieldToMatch, "==", userId));
  return onSnapshot(q, (snapshot) => {
    let total = 0;
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      total += (data[fieldToSum] || 0);
    });
    callback(total);
  });
};

export const subscribeToMessages = (coachId, clientId, callback) => {
  const chatId = `${coachId}_${clientId}`;
  const q = query(
    collection(db, `chats/${chatId}/messages`),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(messages);
  });
};

export const subscribeToCoachChats = (coachId, callback) => {
  const q = query(collection(db, "chats"), where("coachId", "==", coachId));
  return onSnapshot(q, (snapshot) => {
    const chats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(chats);
  });
};

export const getAssignedClientsForCoach = async (coachId) => {
  try {
    // Get all assignments for this coach
    const q = query(collection(db, "assignments"), where("coachId", "==", coachId));
    const snapshot = await getDocs(q);
    
    // Extract unique client IDs
    const clientIds = [...new Set(snapshot.docs.map(doc => doc.data().clientId))];
    
    // Fetch details for those clients
    const clients = [];
    for (const clientId of clientIds) {
      if (!clientId) continue;
      const userDoc = await getDoc(doc(db, "users", clientId));
      if (userDoc.exists()) {
        clients.push({ id: userDoc.id, ...userDoc.data() });
      }
    }
    return clients;
  } catch (error) {
    console.error("Error fetching assigned clients:", error);
    return [];
  }
};
