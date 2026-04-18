import React, { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NetworkProvider } from "./src/context/NetworkContext";
import { StatusBar } from "expo-status-bar";
import { ClerkProvider, SignedIn, SignedOut } from "@clerk/clerk-expo";
import AppNavigator from "./src/navigation/AppNavigator";
import LoginScreen from "./src/screens/LoginScreen";
import RoleSelectionScreen from "./src/screens/RoleSelectionScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import { CLERK_PUBLISHABLE_KEY } from "./src/config/clerk-config";
import tokenCache from "./src/utils/cache";
import IntroGate from "./src/components/IntroGate";
import "./global.css";

const AuthStackBase = createNativeStackNavigator();

function AuthStack() {
  const [selectedRole, setSelectedRole] = useState(null);

  // We are creating a simple switch-based navigator for the login flow
  // to avoid complex deep-linking issues during the auth phase.
  return (
    <AuthStackBase.Navigator screenOptions={{ headerShown: false }}>
      <AuthStackBase.Screen name="Login">
        {(props) => (
          <LoginScreen 
            {...props} 
            onNavigateToSignUp={() => props.navigation.navigate("RoleSelection")} 
          />
        )}
      </AuthStackBase.Screen>
      <AuthStackBase.Screen name="RoleSelection">
        {(props) => (
          <RoleSelectionScreen 
            {...props} 
            onSelectRole={(role) => {
              setSelectedRole(role);
              props.navigation.navigate("SignUp");
            }}
            onNavigateToLogin={() => props.navigation.navigate("Login")} 
          />
        )}
      </AuthStackBase.Screen>
      <AuthStackBase.Screen name="SignUp">
        {(props) => (
          <SignUpScreen 
            {...props} 
            selectedRole={selectedRole}
            onNavigateToLogin={() => props.navigation.navigate("Login")}
            onNavigateBack={() => props.navigation.navigate("RoleSelection")}
          />
        )}
      </AuthStackBase.Screen>
    </AuthStackBase.Navigator>
  );
}

export default function App() {
  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      tokenCache={tokenCache}
    >
      <NetworkProvider>
        <NavigationContainer>
          <IntroGate>
            <StatusBar style="auto" />
            <SignedIn>
              <AppNavigator />
            </SignedIn>
            <SignedOut>
              <AuthStack />
            </SignedOut>
          </IntroGate>
        </NavigationContainer>
      </NetworkProvider>
    </ClerkProvider>
  );
}
