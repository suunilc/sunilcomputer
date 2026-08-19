import { createClient } from '@supabase/supabase-js';

const meta = import.meta as any;

export const SUPABASE_URL: string =
  meta.env?.VITE_SUPABASE_URL || 'https://lmybxncwypghjyeclcih.supabase.co';

export const SUPABASE_ANON_KEY: string =
  meta.env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxteWJ4bmN3eXBnaGp5ZWNsY2loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3NzYzNDYsImV4cCI6MjEwMjM1MjM0Nn0.Q6giznlijhdpvKUUA3sICIFyPJTy56eUX3MdyCA0FhA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  realtime: {
    params: {
      eventsPerSecond: 20,
    },
  },
});

