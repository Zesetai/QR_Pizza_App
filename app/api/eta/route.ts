import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(url, anon);

export async function GET() {
  // get settings
  const { data: settings, error: sErr } = await supabase
    .from('settings')
    .select('*')
    .limit(1)
    .single();
  if (sErr || !settings) return Response.json({ ok: false, error: sErr?.message ?? 'no settings' }, { status: 500 });

  // count active orders in queue
  const { data: queue, error: qErr } = await supabase
    .from('orders')
    .select('id, status')
    .in('status', ['NEW','IN_PROGRESS'])
    .order('created_at', { ascending: true });

  if (qErr) return Response.json({ ok: false, error: qErr.message }, { status: 500 });

  const inQueue = queue?.length ?? 0;
  const ovens = Math.max(1, settings.ovens);
  const avg = Math.max(1, settings.avg_minutes);

  // naive parallelism model: each oven handles one order per avg minutes
  const waves = Math.ceil(inQueue / ovens);
  const etaMinutes = waves * avg;

  return Response.json({ ok: true, inQueue, ovens, avg, etaMinutes, paused: settings.paused });
}
