import { corsHeaders } from '../_shared/cors.ts';
import { requireAdmin } from '../_shared/adminAuth.ts';

function json(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authResult = await requireAdmin(req);
  if (!authResult.ok) {
    return json({ error: authResult.error }, authResult.status);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  const userId = (body as Record<string, unknown> | null)?.userId;
  if (typeof userId !== 'string' || !userId.trim()) {
    return json({ error: 'Missing userId.' }, 400);
  }

  const { admin, adminClient } = authResult;

  if (userId === admin.id) {
    return json({ error: 'You cannot delete your own account.' }, 400);
  }

  const { data: target, error: targetError } = await adminClient
    .from('app_users')
    .select('id, is_admin')
    .eq('id', userId)
    .maybeSingle();

  if (targetError) {
    console.error('admin-delete-user: failed to load target user', targetError);
    return json({ error: 'Failed to load target user.' }, 500);
  }

  if (!target) {
    return json({ error: 'User not found.' }, 404);
  }

  if (target.is_admin) {
    const { count, error: countError } = await adminClient
      .from('app_users')
      .select('id', { count: 'exact', head: true })
      .eq('is_admin', true);

    if (countError) {
      console.error('admin-delete-user: failed to count admins', countError);
      return json({ error: 'Failed to verify remaining admins.' }, 500);
    }

    if ((count ?? 0) <= 1) {
      return json({ error: 'Cannot delete the last remaining admin.' }, 400);
    }
  }

  // Deleting the auth.users row cascades to app_users via the FK.
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

  if (deleteError) {
    console.error('admin-delete-user: failed to delete auth user', deleteError);
    return json({ error: deleteError.message || 'Failed to delete user.' }, 400);
  }

  return json({ success: true }, 200);
});
