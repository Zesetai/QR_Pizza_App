import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest } from 'next/server';

function assertAdmin(req: NextRequest) {
  const header = req.headers.get('x-admin-passcode') ?? '';
  const query = new URL(req.url).searchParams.get('passcode') ?? '';
  const provided = header || query;
  if (!process.env.ADMIN_PASSCODE || provided !== process.env.ADMIN_PASSCODE) {
    return false;
  }
  return true;
}

export async function GET(req: NextRequest) {
  if (!assertAdmin(req)) {
    return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('id, number, status, subtotal_cents, tax_cents, total_cents, created_at, customer')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true, rows: data });
}

export async function PATCH(req: NextRequest) {
  if (!assertAdmin(req)) {
    return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  type Body = { id: string; status: 'NEW'|'IN_PROGRESS'|'READY'|'DONE'|'CANCELLED' };
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.id || !body?.status) {
    return Response.json({ ok: false, error: 'id and status are required' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('orders')
    .update({ status: body.status })
    .eq('id', body.id);

  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
