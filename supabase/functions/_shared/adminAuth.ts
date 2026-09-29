import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.57.4';

export interface AuthorizedAdmin {
  id: string;
  email: string;
}

export type RequireAdminResult =
  | { ok: true; admin: AuthorizedAdmin; adminClient: SupabaseClient }
  | { ok: false; status: number; error: string };

// Resolves who is calling this function from their JWT, then checks the
// app_users table (via the service role, bypassing RLS) to confirm they're an
// admin. Never trust a frontend-only "is admin" check for actions like these.
export async function requireAdmin(req: Request): Promise<RequireAdminResult> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error('requireAdmin: missing SUPABASE_URL/SUPABASE_ANON_KEY/SUPABASE_SERVICE_ROLE_KEY');
    return { ok: false, status: 500, error: 'Server is not configured.' };
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return { ok: false, status: 401, error: 'Missing Authorization header.' };
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) {
    return { ok: false, status: 401, error: 'Not signed in.' };
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: appUser, error: appUserError } = await adminClient
    .from('app_users')
    .select('id, email, is_admin')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (appUserError) {
    console.error('requireAdmin: failed to look up app_users row', appUserError);
    return { ok: false, status: 500, error: 'Failed to verify admin status.' };
  }

  if (!appUser || !appUser.is_admin) {
    return { ok: false, status: 403, error: 'Only admins can do this.' };
  }

  return { ok: true, admin: { id: appUser.id, email: appUser.email }, adminClient };
}
