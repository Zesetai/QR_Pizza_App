import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(url, anon);

export async function GET() {
  const [menu, tops, settings] = await Promise.all([
    supabase.from('menu_items').select('*').order('id'),
    supabase.from('toppings').select('*').order('id'),
    supabase.from('settings').select('*').limit(1).single()
  ]);

  if (menu.error || tops.error || settings.error) {
    return Response.json({
      ok: false,
      errors: [menu.error?.message, tops.error?.message, settings.error?.message].filter(Boolean)
    }, { status: 500 });
  }
  return Response.json({ ok: true, menu: menu.data, toppings: tops.data, settings: settings.data });
}
