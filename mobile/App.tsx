// App.tsx
import 'react-native-url-polyfill/auto'; // Must stay at the very top
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  NavigationContainer,
  DefaultTheme as NavDefaultTheme,
  Theme as NavTheme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator } from 'react-native-paper';
import { AuthProvider, useAuth } from './src/context/AuthContext';


// --- Screens ---
import { SignInScreen } from './src/screens/SignInScreen';
import { SignUpScreen } from './src/screens/SignUpScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { AddSubscriptionScreen } from './src/screens/AddSubscriptionScreen';

// --- Stack Navigator ---
const Stack = createNativeStackNavigator();

/**
 * 🎨 Paper Theme (Material Design 3)
 * Source of truth for all colors across the app.
 */
const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6c47ff',
    background: '#fafafa',
    surface: '#ffffff',
    primaryContainer: '#e9e0ff',
    secondary: '#8b6cff',
    outline: '#e6e1f7',
    onSurface: '#000000',
  },
};

/**
 * 🧭 Navigation Theme
 * Keeps react-navigation visually consistent with Paper theme.
 */
const navTheme: NavTheme = {
  ...NavDefaultTheme,
  colors: {
    ...NavDefaultTheme.colors,
    primary: paperTheme.colors.primary,
    background: paperTheme.colors.background,
    card: paperTheme.colors.surface,
    text: paperTheme.colors.onSurface,
    border: paperTheme.colors.outline,
    notification: paperTheme.colors.secondary,
  },
};

/**
 * 🚀 RootNavigator
 * Handles the entire navigation logic for authenticated / unauthenticated users.
 */
function RootNavigator() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={paperTheme.colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShadowVisible: false }}>
      {session ? (
        <>
          <Stack.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AddSubscription"
            component={AddSubscriptionScreen}
            options={{ title: 'Add New Subscription' }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="SignIn"
            component={SignInScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SignUp"
            component={SignUpScreen}
            options={{ title: 'Create Account' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

/**
 * 🏁 App Entry
 * Wraps everything inside Paper, SafeArea, and Auth context.
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <AuthProvider>
          <NavigationContainer theme={navTheme}>
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

/**
 * 💅 Styles
 */
const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
