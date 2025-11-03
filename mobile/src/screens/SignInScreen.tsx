import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { supabase } from '../lib/supabase';

// We'll need navigation to go to the "Sign Up" screen
export const SignInScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const signInWithEmail = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) Alert.alert('Sign In Error', error.message);
    setLoading(false);
  };

  // TODO: Implement signInWithGoogle
  const signInWithGoogle = async () => {
    Alert.alert('To-Do', 'Google Sign-In is not configured yet.');
  };

  // TODO: Implement signInWithApple
  const signInWithApple = async () => {
    Alert.alert('To-Do', 'Apple Sign-In is not configured yet.');
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineLarge" style={styles.title}>
        Welcome to TrackMe
      </Text>

      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />

      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <Button
        mode="contained"
        onPress={signInWithEmail}
        loading={loading}
        style={styles.button}>
        Sign In
      </Button>

      <Button
        mode="outlined"
        onPress={() => navigation.navigate('SignUp')}
        style={styles.button}>
        Create Account
      </Button>

      <Text style={styles.orText}>or</Text>

      <Button
        mode="contained-tonal"
        icon="google"
        onPress={signInWithGoogle}
        style={styles.button}>
        Sign In with Google
      </Button>

      <Button
        mode="contained-tonal"
        icon="apple"
        onPress={signInWithApple}
        style={styles.button}>
        Sign In with Apple
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 12,
  },
  orText: {
    textAlign: 'center',
    marginVertical: 12,
  },
});