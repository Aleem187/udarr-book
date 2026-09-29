import { corsHeaders } from '../_shared/cors.ts';
import { requireAdmin } from '../_shared/adminAuth.ts';

interface CreateUserBody {
  name: string;
  email: string;
  password: string;
  isAdmin?: boolean;
}

function isValidBody(body: unknown): body is CreateUserBody {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.name === 'string' && b.name.trim().length > 0 &&
    typeof b.email === 'string' && b.email.trim().length > 3 &&
    typeof b.password === 'string' && b.password.length >= 6
  );
}

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

  if (!isValidBody(body)) {
    return json({ error: 'Missing or invalid fields: name, email, password (min 6 chars).' }, 400);
  }

  const { adminClient } = authResult;
  const { name, email, password, isAdmin } = body;

  const { count, error: countError } = await adminClient
    .from('app_users')
    .select('id', { count: 'exact', head: true });

  if (countError) {
    console.error('admin-create-user: failed to count existing users', countError);
    return json({ error: 'Failed to check current staff count.' }, 500);
  }

  if ((count ?? 0) >= 6) {
    return json({ error: 'Maximum of 6 staff users already exist.' }, 400);
  }

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
  });

  if (createError || !created?.user) {
    console.error('admin-create-user: failed to create auth user', createError);
    return json({ error: createError?.message || 'Failed to create user.' }, 400);
  }

  const { error: insertError } = await adminClient.from('app_users').insert({
    id: created.user.id,
    email: email.trim(),
    name: name.trim(),
    is_admin: Boolean(isAdmin),
  });

  if (insertError) {
    console.error('admin-create-user: failed to insert app_users row, rolling back auth user', insertError);
    await adminClient.auth.admin.deleteUser(created.user.id);
    return json({ error: insertError.message || 'Failed to save staff profile.' }, 400);
  }

  return json({ success: true, id: created.user.id }, 200);
});
