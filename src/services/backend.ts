import { MOCK_TASKS } from '../data/mockTasks';
import { ROLES } from '../auth/rbac';
import { clerkClient } from '@clerk/clerk-sdk-node';

// Initialize backend Clerk client (requires CLERK_SECRET_KEY in env, but since this is frontend code, 
// we will have to use the frontend API instead of node SDK due to React Native environment constraints)

// ====== DATA STORES (In-Memory Placeholders) ======
// TODO: Replace with Firebase Firestore and Storage
let inMemoryPlans = [...MOCK_TASKS];
let inMemoryAssignments = []; // { assignmentId, planId, coachId, clientId, status, createdAt }
let inMemoryProgress = {}; // { [clientId_planId]: { [stepId]: completedAtMs } }

// ====== ADMIN OVERRIDES ======
// Helpers to check if users have admin capabilities implicitly granting them coach capabilities
export const isAdmin = (role) => role === ROLES.ADMIN;

// ====== CLERK INTEGRATION ======

/**
 * Fetch a list of all clients from Clerk. 
 * Since we are inside the client bundle, we cannot use the Node SDK without exposing the secret key.
 * Instead, we will simulate this by checking Clerk's organization/users if applicable, 
 * but since we are working on a prototype without a custom backend, we will return a mock list of employees 
 * combined with any actual clerk identifiers the coach types in manually.
 * 
 * UPDATE: To meet the requirement of showing a list to the coach without a true backend, 
 * we will provide a mocked hardcoded list of "Employees" for the prototype dropdown.
 */
export const getPrototypeEmployees = async () => {
    // Return a list of placeholder employees that the Coach can select from
    return [
        { id: 'emp_101', name: 'Alex Johnson', email: 'alex@example.com' },
        { id: 'emp_102', name: 'Maria Garcia', email: 'maria@example.com' },
        { id: 'emp_103', name: 'David Smith', email: 'david@example.com' },
        { id: 'emp_104', name: 'Sarah Connor', email: 'sarah@example.com' },
    ];
};

// ====== COACH CAPABILITIES ======

/**
 * Returns plans created/owned by the given coach.
 * Admin bypasses ownership.
 */
export const coachListPlans = async (userId, userRole) => {
    if (isAdmin(userRole)) return inMemoryPlans;
    return inMemoryPlans.filter(p => p.coachId === userId || p.assignedBy === 'Coach Sarah'); // Legacy mock fallback
};

export const coachCreatePlan = async (coachId, planData) => {
    console.log(`[backend] coachCreatePlan`, { coachId, planData });
    const newId = `plan_${Date.now()}`;
    const newPlan = {
        id: newId,
        coachId,
        status: 'To Do',
        steps: [],
        createdAt: Date.now(),
        ...planData,
    };
    inMemoryPlans.push(newPlan);
    return newPlan;
};

export const coachUpdatePlan = async (coachId, userRole, planId, planData) => {
    console.log(`[backend] coachUpdatePlan`, { planId, planData });
    const planIndex = inMemoryPlans.findIndex(p => p.id === planId);
    if (planIndex === -1) throw new Error("Plan not found");

    if (!isAdmin(userRole) && inMemoryPlans[planIndex].coachId !== coachId) {
        throw new Error("Unauthorized to edit this plan");
    }

    inMemoryPlans[planIndex] = { ...inMemoryPlans[planIndex], ...planData };
    return inMemoryPlans[planIndex];
};

export const coachAddStep = async (coachId, userRole, planId, stepData) => {
    console.log(`[backend] coachAddStep`, { planId, stepData });
    const plan = inMemoryPlans.find(p => p.id === planId);
    if (!plan) throw new Error("Plan not found");

    if (!isAdmin(userRole) && plan.coachId !== coachId) {
        throw new Error("Unauthorized to add steps to this plan");
    }

    const stepId = `step_${Date.now()}`;
    const newStep = {
        id: stepId,
        isCompleted: false,
        media: [],
        ...stepData
    };

    if (!plan.steps) plan.steps = [];
    plan.steps.push(newStep);

    // Auto re-order
    plan.steps.sort((a, b) => (a.order || 0) - (b.order || 0));

    return newStep;
};

export const coachUpdateStep = async (coachId, userRole, planId, stepId, stepData) => {
    const plan = inMemoryPlans.find(p => p.id === planId);
    if (!plan) throw new Error("Plan not found");
    if (!isAdmin(userRole) && plan.coachId !== coachId) throw new Error("Unauthorized");

    const stepIndex = plan.steps.findIndex(s => s.id === stepId);
    if (stepIndex === -1) throw new Error("Step not found");

    plan.steps[stepIndex] = { ...plan.steps[stepIndex], ...stepData };
    plan.steps.sort((a, b) => (a.order || 0) - (b.order || 0));

    return plan.steps[stepIndex];
};

export const coachAttachMediaToStep = async (coachId, userRole, planId, stepId, mediaObject) => {
    // mediaObject: { type: "image"|"video", localUri, filename, createdAt }
    // TODO: Implement exact Firebase Storage uploading logic here
    console.log(`[backend] Placeholder media attachment:`, mediaObject);

    const plan = inMemoryPlans.find(p => p.id === planId);
    if (!plan) throw new Error("Plan not found");
    if (!isAdmin(userRole) && plan.coachId !== coachId) throw new Error("Unauthorized");

    const step = plan.steps?.find(s => s.id === stepId);
    if (!step) throw new Error("Step not found");

    if (!step.media) step.media = [];
    step.media.push(mediaObject);

    return mediaObject;
};

export const coachAssignPlanToClient = async (coachId, userRole, planId, clientIdentifier) => {
    console.log(`[backend] Assigning plan ${planId} to ${clientIdentifier}`);
    const plan = inMemoryPlans.find(p => p.id === planId);
    if (!plan) throw new Error("Plan not found");
    if (!isAdmin(userRole) && plan.coachId !== coachId) throw new Error("Unauthorized");

    const newAssignment = {
        assignmentId: `assign_${Date.now()}`,
        planId,
        coachId,
        clientId: clientIdentifier,
        status: "active",
        createdAt: Date.now()
    };

    // Prevent duplicate active assignments
    const existing = inMemoryAssignments.find(a => a.planId === planId && a.clientId === clientIdentifier && a.status === 'active');
    if (!existing) {
        inMemoryAssignments.push(newAssignment);
    }

    return newAssignment;
};

export const coachListAssignments = async (coachId, userRole, planId = null) => {
    if (isAdmin(userRole)) {
        return planId ? inMemoryAssignments.filter(a => a.planId === planId) : inMemoryAssignments;
    }
    return inMemoryAssignments.filter(a => a.coachId === coachId && (!planId || a.planId === planId));
};

export const coachGetClientProgressSummary = async (coachId, userRole, planId) => {
    // Placeholder aggregate builder
    const assignments = await coachListAssignments(coachId, userRole, planId);
    return assignments.map(a => {
        const progressKey = `${a.clientId}_${a.planId}`;
        const progress = inMemoryProgress[progressKey] || {};
        return {
            clientId: a.clientId,
            completedSteps: Object.keys(progress).length
        };
    });
};

// ====== CLIENT CAPABILITIES ======

export const clientListAssignedPlans = async (clientId) => {
    // Find assignments for this client
    const assignments = inMemoryAssignments.filter(a => a.clientId === clientId && a.status === 'active');

    // Extract plan details
    const assignedPlans = assignments.map(a => {
        return inMemoryPlans.find(p => p.id === a.planId);
    }).filter(Boolean); // Filter out nulls if a plan was deleted

    // If no assignments exist, return the global published mock list for prototyping
    if (assignedPlans.length === 0) {
        return inMemoryPlans.filter(p => p.isPublished !== false);
    }

    return assignedPlans;
};

export const getPlan = async (planId) => {
    return inMemoryPlans.find(t => t.id === planId) || null;
};

export const clientMarkStepComplete = async (clientId, planId, stepId) => {
    console.log(`[backend] Client ${clientId} completed step ${stepId} in plan ${planId}`);

    const progressKey = `${clientId}_${planId}`;
    if (!inMemoryProgress[progressKey]) {
        inMemoryProgress[progressKey] = {};
    }
    inMemoryProgress[progressKey][stepId] = Date.now();

    // Still mark the global object for prototypical immediate feedback
    const plan = inMemoryPlans.find(t => t.id === planId);
    if (plan && plan.steps) {
        const step = plan.steps.find(s => s.id === stepId);
        if (step) step.isCompleted = true;
    }
    return true;
};
