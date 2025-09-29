import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('id, number, status, total_cents, created_at, customer')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true, rows: data });
}
