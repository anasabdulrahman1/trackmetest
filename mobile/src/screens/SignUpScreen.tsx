// src/screens/SignUpScreen.tsx
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
import { Button, Text, TextInput, HelperText } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../Components/AppLayout';

export const SignUpScreen = ({ navigation }: any) => {
  const [userEmail, setUserEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSignUp = async () => {
    if (!userEmail.trim() || !password.trim() || !confirmPwd.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    if (password !== confirmPwd) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    const { error } = await signUp(userEmail.trim(), password);

    if (error) {
      Alert.alert('Sign-Up Error', error.message);
    } else {
      Alert.alert(
        'Account Created',
        'Please verify your email before signing in.'
      );
      navigation.navigate('SignIn');
    }
    setLoading(false);
  };

  return (
    <AppLayout centerContent>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.inner}>
            <Text variant="headlineLarge" style={styles.title}>
              Create Your Account
            </Text>

            <TextInput
              label="Email"
              value={userEmail}
              onChangeText={setUserEmail}
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

            <TextInput
              label="Confirm Password"
              value={confirmPwd}
              onChangeText={setConfirmPwd}
              secureTextEntry
              mode="outlined"
              style={styles.input}
              accessibilityLabel="Confirm password input field"
            />

            {password && confirmPwd && password !== confirmPwd && (
              <HelperText type="error" visible>
                Passwords do not match.
              </HelperText>
            )}

            <Button
              mode="contained"
              onPress={handleSignUp}
              loading={loading}
              disabled={loading}
              style={styles.button}>
              Create Account
            </Button>

            <Button
              mode="text"
              onPress={() => navigation.navigate('SignIn')}
              style={styles.signInLink}>
              Already have an account? Sign In
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
  signInLink: {
    marginTop: 16,
    alignSelf: 'center',
  },
});

