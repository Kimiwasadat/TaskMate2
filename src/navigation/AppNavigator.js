import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useUser } from "@clerk/clerk-expo";
import RequireRole from "../components/RequireRole";
import { normalizeRole, ROLES } from "../auth/rbac";

import DashboardScreen from "../screens/DashboardScreen";
import TaskGuidanceScreen from "../screens/TaskGuidanceScreen";
import TaskCompleteScreen from "../screens/TaskCompleteScreen";
import CoachDashboardScreen from "../screens/CoachDashboardScreen";
import AdminDashboardScreen from "../screens/AdminDashboardScreen";
import DebugScreen from "../screens/DebugScreen";
import PlanDetailScreen from "../screens/PlanDetailScreen";
import CreateEditPlanScreen from "../screens/CreateEditPlanScreen";
import AssignmentListScreen from "../screens/AssignmentListScreen";
import AssignmentScreen from "../screens/AssignmentScreen";
import AddEditStepScreen from "../screens/AddEditStepScreen";
import AssignPlanScreen from "../screens/AssignPlanScreen";

const Stack = createNativeStackNavigator();

// Client Flow
function ClientStack() {
  return (
    <RequireRole allowed={[ROLES.CLIENT]}>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName="Dashboard"
      >
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="TaskGuidance" component={TaskGuidanceScreen} />
        <Stack.Screen name="TaskComplete" component={TaskCompleteScreen} />
        <Stack.Screen name="Debug" component={DebugScreen} />
      </Stack.Navigator>
    </RequireRole>
  );
}

// Coach Flow
function CoachStack() {
  return (
    <RequireRole allowed={[ROLES.COACH]}>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName="CoachDashboard"
      >
        <Stack.Screen name="CoachDashboard" component={CoachDashboardScreen} />
        <Stack.Screen name="PlanDetail" component={PlanDetailScreen} />
        <Stack.Screen name="CreateEditPlan" component={CreateEditPlanScreen} />
        <Stack.Screen name="AssignmentList" component={AssignmentListScreen} />
        <Stack.Screen name="Assignment" component={AssignmentScreen} />
        <Stack.Screen name="AssignPlan" component={AssignPlanScreen} />
        <Stack.Screen name="AddEditStep" component={AddEditStepScreen} />
        <Stack.Screen name="Debug" component={DebugScreen} />
      </Stack.Navigator>
    </RequireRole>
  );
}

// Admin Flow
function AdminStack() {
  return (
    <RequireRole allowed={[ROLES.ADMIN]}>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName="AdminDashboard"
      >
        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
        <Stack.Screen name="Debug" component={DebugScreen} />
      </Stack.Navigator>
    </RequireRole>
  );
}

export default function AppNavigator() {
  const { user, isLoaded } = useUser();

  if (!isLoaded || !user) return null;

  const role = normalizeRole(user);

  return (
    <NavigationContainer>
      {role === ROLES.CLIENT && <ClientStack />}
      {role === ROLES.COACH && <CoachStack />}
      {role === ROLES.ADMIN && <AdminStack />}
    </NavigationContainer>
  );
}
