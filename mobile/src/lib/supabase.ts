import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Config from 'react-native-config';

if (!Config.SUPABASE_URL || !Config.SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing environment variables. Check that you have .env file with SUPABASE_URL and SUPABASE_ANON_KEY'
  );
}

export const supabase = createClient(Config.SUPABASE_URL, Config.SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});