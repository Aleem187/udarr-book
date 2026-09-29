import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { AppUser } from '@/types';

interface AppUserRow {
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
}

function mapRow(row: AppUserRow): AppUser {
  return { id: row.id, email: row.email, name: row.name, isAdmin: row.is_admin };
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [roster, setRoster] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRoster = useCallback(async () => {
    const { data, error } = await supabase
      .from('app_users')
      .select('id, email, name, is_admin')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('useAuth: failed to load staff roster', error);
      return;
    }

    setRoster(((data as AppUserRow[]) ?? []).map(mapRow));
  }, []);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (active) setSession(data.session);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) {
      setAppUser(null);
      setRoster([]);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    (async () => {
      await loadRoster();

      const { data, error } = await supabase
        .from('app_users')
        .select('id, email, name, is_admin')
        .eq('id', session.user.id)
        .maybeSingle();

      if (!active) return;

      if (error || !data) {
        console.error('useAuth: signed-in account is not an authorized staff user', error);
        setAppUser(null);
        await supabase.auth.signOut();
      } else {
        setAppUser(mapRow(data as AppUserRow));
      }
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [session, loadRoster]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return { session, appUser, roster, loading, signIn, signOut, refreshRoster: loadRoster };
}
