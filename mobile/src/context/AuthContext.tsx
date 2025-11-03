import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Alert, Platform } from 'react-native';
// 1. IMPORT FIREBASE MESSAGING
import messaging from '@react-native-firebase/messaging';

// Define the shape of our context
interface AuthContextType {
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signInWithApple: () => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- 2. NEW FUNCTION TO REQUEST PERMISSION & REGISTER DEVICE ---
async function registerDeviceForNotifications(userId: string) {
  try {
    // 1. Request permission from the user
    await messaging().requestPermission();
    
    // 2. Get the FCM token
    const fcmToken = await messaging().getToken();

    if (fcmToken) {
      console.log('FCM Token:', fcmToken);

      // 3. Save the token to our 'devices' table
      // upsert = update if exists, insert if not
      const { error } = await supabase
        .from('devices')
        .upsert({ 
          user_id: userId,
          device_token: fcmToken, 
          platform: Platform.OS,
        }, {
          onConflict: 'device_token' // Use this to prevent duplicates
        });

      if (error) throw error;
      console.log('Device token saved to Supabase.');
    }
  } catch (error: any) {
    // Don't bother the user if they deny permission
    if (error.code !== 'messaging/permission-denied') {
      Alert.alert('Error registering for notifications', error.message);
    }
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 3. Check for existing session on app start
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setLoading(false);
      
      // 4. If user is already logged in, register their device
      if (initialSession) {
        registerDeviceForNotifications(initialSession.user.id);
      }
    });

    // 5. Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);
        setLoading(false); 
        
        // 6. If the state changes to "LOGGED IN", register the device
        if (_event === 'SIGNED_IN' && currentSession) {
          registerDeviceForNotifications(currentSession.user.id);
        }
        
        // TODO: We also need to remove the token from our DB on SIGNED_OUT
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // --- (Rest of your provider code: value, functions, etc.) ---
  const value: AuthContextType = {
    session,
    loading,
    signIn: async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    },
    signUp: async (email: string, password: string) => {
      const { error } = await supabase.auth.signUp({ email, password });
      return { error };
    },
    signOut: async () => {
      // TODO: Add logic here to remove the device_token from Supabase
      const { error } = await supabase.auth.signOut();
      return { error };
    },
    signInWithGoogle: async () => {
      Alert.alert('To-Do', 'Google Sign-In is not configured yet.');
      return { error: null };
    },
    signInWithApple: async () => {
      Alert.alert('To-Do', 'Apple Sign-In is not configured yet.');
      return { error: null };
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};