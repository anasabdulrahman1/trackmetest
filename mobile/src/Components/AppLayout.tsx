// src/components/AppLayout.tsx
import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';

interface AppLayoutProps {
  children: React.ReactNode;
  /** Centers content vertically (good for auth screens) */
  centerContent?: boolean;
  /** Makes layout scrollable (good for long forms) */
  scrollable?: boolean;
  /** Allows custom styles */
  style?: ViewStyle;
}

/**
 * ✅ AppLayout — Universal wrapper for all screens
 * - Handles SafeArea
 * - Supports scrollable + static modes
 * - KeyboardAvoiding for iOS forms
 * - Uses Paper theme background color
 */
export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  centerContent = false,
  scrollable = false,
  style,
}) => {
  const { colors } = useTheme();
  const Container = scrollable ? ScrollView : View;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Container
          {...(scrollable
            ? {
                contentContainerStyle: [
                  styles.container,
                  centerContent && styles.centerContent,
                  style,
                ],
              }
            : {
                style: [styles.container, centerContent && styles.centerContent, style],
              })}
          keyboardShouldPersistTaps="handled">
          {children}
        </Container>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ---------------------------------------------------------
// Styles
// ---------------------------------------------------------
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

