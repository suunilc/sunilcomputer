import { supabase } from '../lib/supabase';
import { User, UserRole } from '../types';

/**
 * Normalizes an email or username into a valid email format for Supabase Auth
 */
export function formatSupabaseAuthEmail(identifier: string): string {
  const clean = identifier.trim().toLowerCase();
  if (clean.includes('@')) {
    return clean;
  }
  // If user enters 'sunil' or similar username, map or format as standard domain
  if (clean === 'sunil' || clean === 'sunil sharma' || clean === 'founder') {
    return 'sunshinecomputer2080@gmail.com';
  }
  return `${clean.replace(/[^a-z0-9]/g, '')}@sunshine.internal`;
}

/**
 * Sign in using Supabase Auth (supports email or username)
 */
export async function signInWithSupabaseAuth(
  identifier: string,
  pass: string
): Promise<{ user: User; session: any }> {
  const email = formatSupabaseAuthEmail(identifier);
  const password = pass.trim();

  // 1. Attempt standard Supabase Auth sign in
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // If user not found in Supabase Auth yet, create initial auth user
    if (
      error.message.toLowerCase().includes('invalid login credentials') ||
      error.message.toLowerCase().includes('user not found')
    ) {
      // Try to sign up automatically for first-time onboarding
      const signUpRes = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: identifier.trim(),
            username: identifier.trim(),
            role: 'admin' as UserRole,
          },
        },
      });

      if (signUpRes.data && signUpRes.data.user) {
        const u = signUpRes.data.user;
        return {
          user: {
            id: u.id,
            name: (u.user_metadata as any)?.name || identifier.trim(),
            username: (u.user_metadata as any)?.username || identifier.trim(),
            role: ((u.user_metadata as any)?.role as UserRole) || 'admin',
          },
          session: signUpRes.data.session,
        };
      }
    }

    throw new Error(error.message || 'Invalid login credentials');
  }

  const authUser = data.user;
  const userRole: UserRole = (authUser.user_metadata as any)?.role || 'admin';
  const userName: string =
    (authUser.user_metadata as any)?.name ||
    (authUser.user_metadata as any)?.username ||
    identifier.trim();

  const user: User = {
    id: authUser.id,
    name: userName,
    username: (authUser.user_metadata as any)?.username || identifier.trim(),
    role: userRole,
    password: password,
  };

  return { user, session: data.session };
}

/**
 * Sign up a new user using Supabase Auth
 */
export async function signUpWithSupabaseAuth(
  identifier: string,
  pass: string,
  fullName: string,
  role: UserRole = 'staff'
): Promise<{ user: User; session: any }> {
  const email = formatSupabaseAuthEmail(identifier);
  const password = pass.trim();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: fullName.trim() || identifier.trim(),
        username: identifier.trim(),
        role: role,
      },
    },
  });

  if (error) {
    throw new Error(error.message || 'Failed to create user account');
  }

  const authUser = data.user;
  if (!authUser) {
    throw new Error('Sign up completed. Please check your email or log in.');
  }

  const user: User = {
    id: authUser.id,
    name: fullName.trim() || identifier.trim(),
    username: identifier.trim(),
    role: role,
    password: password,
  };

  return { user, session: data.session };
}

/**
 * Update current logged-in user password via Supabase Auth
 */
export async function updatePasswordWithSupabaseAuth(newPassword: string): Promise<boolean> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword.trim(),
    });

    if (error) {
      console.warn('Supabase Auth update password notice:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase Auth update password exception:', err);
    return false;
  }
}

/**
 * Sign out of Supabase Auth
 */
export async function signOutWithSupabaseAuth(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('Supabase sign out notice:', err);
  }
}

/**
 * Retrieve current active Supabase Auth user & session
 */
export async function getCurrentSupabaseAuthUser(): Promise<User | null> {
  try {
    const { data } = await supabase.auth.getSession();
    if (data && data.session && data.session.user) {
      const u = data.session.user;
      return {
        id: u.id,
        name: (u.user_metadata as any)?.name || (u.user_metadata as any)?.username || 'Sunil Sharma (Founder)',
        username: (u.user_metadata as any)?.username || u.email?.split('@')[0] || 'Sunil',
        role: ((u.user_metadata as any)?.role as UserRole) || 'admin',
      };
    }
    return null;
  } catch (err) {
    console.warn('Get current auth user exception:', err);
    return null;
  }
}
