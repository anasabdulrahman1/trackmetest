// src/screens/SignInScreen.tsx
import React, { useState } from 'react';
import {
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  View,
} from 'react-native';
import { Button, Text, TextInput, Divider } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../Components/AppLayout';

export const SignInScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    if (error) {
      Alert.alert('Sign-In Error', error.message);
    }
    setLoading(false);
  };

  const handleGoogleSignIn = () =>
    Alert.alert('Coming Soon', 'Google Sign-In integration is not yet configured.');
  const handleAppleSignIn = () =>
    Alert.alert('Coming Soon', 'Apple Sign-In integration is not yet configured.');

  return (
    <AppLayout centerContent>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.inner}>
            <Text variant="headlineLarge" style={styles.title}>
              Welcome to TrackMe
            </Text>

            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              mode="outlined"
              style={styles.input}
              accessibilityLabel="Email input field"
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              mode="outlined"
              style={styles.input}
              accessibilityLabel="Password input field"
            />

            <Button
              mode="contained"
              onPress={handleSignIn}
              loading={loading}
              disabled={loading}
              style={styles.button}>
              Sign In
            </Button>

            <Button
              mode="outlined"
              onPress={() => navigation.navigate('SignUp')}
              style={styles.button}>
              Create Account
            </Button>

            <Divider style={styles.divider} />

            <Button
              mode="contained-tonal"
              icon="google"
              onPress={handleGoogleSignIn}
              style={styles.socialButton}>
              Sign in with Google
            </Button>

            <Button
              mode="contained-tonal"
              icon="apple"
              onPress={handleAppleSignIn}
              style={styles.socialButton}>
              Sign in with Apple
            </Button>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </AppLayout>
  );
};

// ---------------------------------------------------------
// Styles
// ---------------------------------------------------------
const styles = StyleSheet.create({
  flex: { flex: 1 },
  inner: {
    width: '100%',
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: 'bold',
    color: '#222',
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 12,
    borderRadius: 8,
  },
  divider: {
    marginVertical: 20,
  },
  socialButton: {
    marginTop: 8,
    borderRadius: 8,
  },
});
