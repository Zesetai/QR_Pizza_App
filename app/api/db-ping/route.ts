import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  // Option A: RPC "now" (create it once in SQL editor if needed)
  const { data, error } = await supabaseAdmin.rpc('now');
  if (!error && data) return Response.json({ ok: true, via: 'rpc(now)', data });

  // Option B: fall back to a trivial select from a known table, e.g., "orders"
  // const { error: e2 } = await supabaseAdmin.from('orders').select('id').limit(1);
  // if (!e2) return Response.json({ ok: true, via: 'select orders' });

  return Response.json({ ok: false, error: error?.message ?? 'no rpc/table available' }, { status: 500 });
}
