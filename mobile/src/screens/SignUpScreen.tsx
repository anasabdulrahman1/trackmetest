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
    <AppLayout scrollable>
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
              dense
              multiline={false}
              numberOfLines={1}
              style={styles.input}
              outlineStyle={styles.inputOutline}
              accessibilityLabel="Email input field"
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              mode="outlined"
              dense
              multiline={false}
              numberOfLines={1}
              style={styles.input}
              outlineStyle={styles.inputOutline}
              accessibilityLabel="Password input field"
            />

            <TextInput
              label="Confirm Password"
              value={confirmPwd}
              onChangeText={setConfirmPwd}
              secureTextEntry
              mode="outlined"
              dense
              multiline={false}
              numberOfLines={1}
              style={styles.input}
              outlineStyle={styles.inputOutline}
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
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 32,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: 0.5,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#ffffff',
    height: 56,
  },
  inputOutline: {
    borderRadius: 12,
    borderWidth: 1.5,
  },
  button: {
    marginTop: 20,
    borderRadius: 12,
    paddingVertical: 6,
  },
  signInLink: {
    marginTop: 20,
    alignSelf: 'center',
  },
});

