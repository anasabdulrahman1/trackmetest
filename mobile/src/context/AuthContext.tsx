// src/context/AuthContext.tsx

import React, { createContext, useState, useEffect, useContext } from 'react';
import { Platform } from 'react-native';
import { Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
async function upsertUserTimezone(userId?: string) {
  try {
    if (!userId) return;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    await supabase.from('profiles').update({ timezone: tz }).eq('id', userId);
  } catch {
    // ignore failures silently
  }
}
import {
  getMessaging,
  requestPermission,
  getToken,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// ---------------------------------------------------------
// Context Interface
// ---------------------------------------------------------
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

// ---------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------
const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function waitForProfile(userId: string): Promise<boolean> {
  for (let attempt = 1; attempt <= 5; attempt++) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn(`Error checking profile: ${error.message}`);
      return false;
    }

    if (data) return true;

    console.log(
      `User record not found yet — delaying device registration (attempt ${attempt}/5)...`
    );
    await delay(1000 * attempt);
  }

  console.warn('Profile creation timeout — skipping device registration.');
  return false;
}

// ---------------------------------------------------------
// Device Registration Logic
// ---------------------------------------------------------
async function registerDeviceForNotifications(userId?: string) {
  try {
    if (!userId) return;

    const profileExists = await waitForProfile(userId);
    if (!profileExists) return;

    const messagingInstance = getMessaging();

    // Request permission directly (avoid deprecated hasPermission checks)
    const permission = await requestPermission(messagingInstance);
    if (
      permission !== AuthorizationStatus.AUTHORIZED &&
      permission !== AuthorizationStatus.PROVISIONAL
    ) {
      console.log('🔕 Notification permission denied.');
      return;
    }

    const fcmToken = await getToken(messagingInstance);
    if (!fcmToken) {
      console.log('❌ No FCM token retrieved.');
      return;
    }

    console.log('FCM Token:', fcmToken);

    // Use upsert to handle device registration/transfer automatically
    // This is the professional approach used by big tech companies
    const { error: upsertError } = await supabase
      .from('devices')
      .upsert(
        {
          device_token: fcmToken,
          user_id: userId,
          platform: Platform.OS,
          logged_in: true,
          last_active: new Date().toISOString(),
        },
        {
          onConflict: 'device_token',
          ignoreDuplicates: false, // Update existing record
        }
      );

    if (upsertError) {
      console.error('❌ Device upsert failed:', upsertError);
      throw upsertError;
    }

    console.log('✅ Device registered/transferred successfully.');
  } catch (error: any) {
    console.error('❌ Device registration failed:', error.message);
  }
}

// ---------------------------------------------------------
// Mark Devices Logged Out (safe & universal)
// ---------------------------------------------------------
async function markDeviceLoggedOut(userId?: string) {
  try {
    if (!userId) return;

    const { data: updatedRows, error } = await supabase
      .from('devices')
      .update({
        logged_in: false,
        last_active: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select('id, logged_in');

    if (error) throw error;
    console.log(`🚪 Devices marked logged out: ${updatedRows?.length ?? 0}`);
  } catch (error: any) {
    console.error('❌ Failed to mark device logout:', error.message);
  }
}

// ---------------------------------------------------------
// AuthProvider Component
// ---------------------------------------------------------
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // --- Initial Session Load ---
  useEffect(() => {
    let isMounted = true;
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (isMounted) {
        setSession(initialSession);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // --- Auth State Listener ---
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        setSession(currentSession);
        setLoading(false);

        if (_event === 'SIGNED_IN' && currentSession) {
          console.log('User signed in — registering device...');

          // ✅ FIXED Promise type issue here
          await Promise.race([
            registerDeviceForNotifications(currentSession.user.id),
            new Promise<void>((resolve) => setTimeout(() => resolve(), 3000)),
          ]);

          // Best effort timezone sync
          await upsertUserTimezone(currentSession.user.id);
        }

        // Rely on explicit signOut() path to mark devices logged out to avoid double updates
      }
    );

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [session?.user?.id]);

  // ---------------------------------------------------------
  // Auth Context Value
  // ---------------------------------------------------------
  const value: AuthContextType = {
    session,
    loading,
    signIn: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    },
    signUp: async (email, password) => {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: undefined, // Mobile apps don't need redirect URL
        }
      });
      return { error };
    },
    signOut: async () => {
      const userId = session?.user?.id;
      // Perform device logout before signing out to preserve auth for RLS
      if (userId) {
        await markDeviceLoggedOut(userId);
      }
      
      // Sign out from Google first
      try {
        await GoogleSignin.signOut();
        console.log('✅ Google Sign-Out successful');
      } catch (error) {
        console.warn('⚠️ Google Sign-Out failed (may not be signed in with Google):', error);
        // Continue with Supabase sign out even if Google sign out fails
      }
      
      // Clear any cached credentials
      await GoogleSignin.clearCachedAccessToken('*');
      
      // Finally, sign out from Supabase
      const { error } = await supabase.auth.signOut();
      return { error };
    },
    signInWithGoogle: async () => {
      try {
        console.log('🔵 Starting Google Sign-In...');
        
        // Configure Google Sign-In
        // Use Web Client ID for Supabase Auth (not Android Client ID)
        await GoogleSignin.configure({
          webClientId: '217563768495-deql7ahfm2vl35lhvf5fiffvbnqa90kr.apps.googleusercontent.com',
          offlineAccess: true,
          scopes: ['email', 'profile'],
        });
        console.log('✅ Google Sign-In configured');

        // Check if device supports Google Play Services
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        console.log('✅ Play Services available');

        // Sign in with Google
        const userInfo = await GoogleSignin.signIn();
        console.log('✅ Google Sign-In successful, user:', userInfo.data?.user.email);
        
        // Get ID token
        const tokens = await GoogleSignin.getTokens();
        console.log('✅ Tokens received');

        if (!tokens.idToken) {
          throw new Error('No ID token received from Google');
        }

        // Sign in to Supabase with Google ID token
        console.log('🔵 Signing in to Supabase...');
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: tokens.idToken,
        });

        if (error) {
          console.error('❌ Supabase sign-in error:', error);
          throw error;
        }

        console.log('✅ Supabase sign-in successful:', data.user?.email);
        return { error: null };
      } catch (error: any) {
        console.error('❌ Google Sign-In failed:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        // Provide more helpful error messages
        let errorMessage = error.message || 'Google Sign-In failed';
        if (error.code === '-5') {
          errorMessage = 'Google Sign-In was cancelled';
        } else if (error.code === 'DEVELOPER_ERROR') {
          errorMessage = 'Configuration error. Please wait a few minutes for Google settings to propagate, then try again.';
        }
        
        return { 
          error: { 
            message: errorMessage,
            name: 'GoogleSignInError',
            status: 400
          } as AuthError 
        };
      }
    },
    signInWithApple: async () => {
      console.log('Apple Sign-In not yet configured.');
      return { error: null };
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// ---------------------------------------------------------
// Hook
// ---------------------------------------------------------
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};








