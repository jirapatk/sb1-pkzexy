import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const bypassAuth = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true';

if (!bypassAuth && (!supabaseUrl || !supabaseAnonKey)) {
  console.error('Missing Supabase environment variables');
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (bypassAuth) {
          setUser({ id: 'bypass-user', email: 'bypass@example.com' } as User);
          setLoading(false);
          return;
        }

        const supabase = createClientComponentClient();
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ?? null);
          router.refresh();
        });

        return () => subscription.unsubscribe();
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [router]);

  const signIn = async ({ email, password }: { email: string; password: string }) => {
    if (bypassAuth) {
      setUser({ id: 'bypass-user', email } as User);
      router.refresh();
      return;
    }

    const supabase = createClientComponentClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    setUser(data.user);
    router.refresh();
  };

  const signUp = async ({ email, password }: { email: string; password: string }) => {
    if (bypassAuth) {
      setUser({ id: 'bypass-user', email } as User);
      return;
    }

    const supabase = createClientComponentClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
    setUser(data.user);
  };

  const signOut = async () => {
    if (bypassAuth) {
      setUser(null);
      router.refresh();
      return;
    }

    const supabase = createClientComponentClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    router.refresh();
  };

  const signInWithGoogle = async () => {
    if (bypassAuth) {
      setUser({ id: 'bypass-user', email: 'google@example.com' } as User);
      router.refresh();
      return;
    }

    const supabase = createClientComponentClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
  };
}