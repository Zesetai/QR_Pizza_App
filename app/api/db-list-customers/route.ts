import { supabaseAdmin } from '@/lib/supabaseAdmin';
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('customers')
    .select('id, email, full_name')
    .limit(5);
  if (error) return Response.json({ ok:false, error: error.message }, { status: 500 });
  return Response.json({ ok:true, rows: data });
}
