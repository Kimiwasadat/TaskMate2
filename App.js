import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { ClerkProvider, SignedIn, SignedOut } from "@clerk/clerk-expo";
import AppNavigator from "./src/navigation/AppNavigator";
import LoginScreen from "./src/screens/LoginScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import { CLERK_PUBLISHABLE_KEY } from "./src/config/clerk-config";
import tokenCache from "./src/utils/cache";
import "./global.css";

function AuthStack() {
  const [isSigningUp, setIsSigningUp] = useState(false);

  return isSigningUp ? (
    <SignUpScreen onNavigateToLogin={() => setIsSigningUp(false)} />
  ) : (
    <LoginScreen onNavigateToSignUp={() => setIsSigningUp(true)} />
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
