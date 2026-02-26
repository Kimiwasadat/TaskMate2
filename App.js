import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { ClerkProvider, SignedIn, SignedOut } from "@clerk/clerk-expo";
import AppNavigator from "./src/navigation/AppNavigator";
import LoginScreen from "./src/screens/LoginScreen";
import RoleSelectionScreen from "./src/screens/RoleSelectionScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import { CLERK_PUBLISHABLE_KEY } from "./src/config/clerk-config";
import tokenCache from "./src/utils/cache";
import "./global.css";

function AuthStack() {
  const [authScreen, setAuthScreen] = useState("login"); // 'login' | 'roleSelection' | 'signup'
  const [selectedRole, setSelectedRole] = useState(null);

  const handleSelectRole = (role) => {
    setSelectedRole(role);
    setAuthScreen("signup");
  };

  if (authScreen === "signup") {
    return (
      <SignUpScreen
        selectedRole={selectedRole}
        onNavigateBack={() => setAuthScreen("roleSelection")}
        onNavigateToLogin={() => setAuthScreen("login")}
      />
    );
  }

  if (authScreen === "roleSelection") {
    return (
      <RoleSelectionScreen
        onSelectRole={handleSelectRole}
        onNavigateToLogin={() => setAuthScreen("login")}
      />
    );
  }

  return (
    <LoginScreen onNavigateToSignUp={() => setAuthScreen("roleSelection")} />
  );
}

export default function App() {
  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      tokenCache={tokenCache}
    >
      <StatusBar style="auto" />
      <SignedIn>
        <AppNavigator />
      </SignedIn>
      <SignedOut>
        <AuthStack />
      </SignedOut>
    </ClerkProvider>
  );
}
