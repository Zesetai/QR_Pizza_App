import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(url, anon);

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  // Expect { customer: {...}, items: [{ name, price_cents, meta? }], subtotal_cents, tax_cents, total_cents }
  const { customer = {}, items = [], subtotal_cents = 0, tax_cents = 0, total_cents = 0 } = body;

  // Create order
  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      customer,
      subtotal_cents,
      tax_cents,
      total_cents,
      status: 'NEW'
    })
    .select('*')
    .single();

  if (error) return Response.json({ ok: false, error: error.message }, { status: 400 });

  // Add items (if any)
  if (items.length) {
    const rows = items.map((it: any) => ({
      order_id: order.id,
      name: it.name,
      price_cents: it.price_cents,
      meta: it.meta ?? null
    }));
    const { error: e2 } = await supabase.from('order_items').insert(rows);
    if (e2) return Response.json({ ok: false, error: e2.message }, { status: 400 });
  }

  return Response.json({ ok: true, order_id: order.id });
}
