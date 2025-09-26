import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Utility: create a Supabase client using the public (anon) key.
 * For prototype, reads/writes allowed by RLS policies in db/supabase.sql
 */
const supa = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

/** ETA helper (same logic as lib/eta.ts, inlined here so API works standalone) */
function estimateETA({
  ordersAhead,
  ovens,
  avgMinutes,
  bulkCount = 1,
  pauseFactor = 1
}: {
  ordersAhead: number;
  ovens: number;
  avgMinutes: number;
  bulkCount?: number;
  pauseFactor?: number;
}) {
  const units = Math.max(1, Math.ceil(ordersAhead / Math.max(1, ovens)));
  const bulkMinutes = bulkCount > 1 ? (bulkCount - 1) * avgMinutes : 0;
  return Math.ceil((units * avgMinutes + bulkMinutes) * (pauseFactor || 1));
}

/**
 * GET /api/orders
 *  - ?menu=1         -> returns { menuItems, toppings, settings, byo defaults }
 *  - ?settings=1     -> returns { ovens, avg_minutes, paused }
 *  - ?status=ACTIVE  -> returns orders list (NEW/IN_PROGRESS/READY)
 *  - ?export=csv     -> returns today's orders CSV
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const menu = url.searchParams.get("menu");
  const exportCsv = url.searchParams.get("export");
  const settings = url.searchParams.get("settings");
  const status = url.searchParams.get("status") || "ACTIVE";

  const db = supa();

  if (menu) {
    const [mi, tp, st] = await Promise.all([
      db.from("menu_items").select("*"),
      db.from("toppings").select("*"),
      db.from("settings").select("*").single()
    ]);
    return NextResponse.json({
      menuItems: mi.data || [],
      toppings: tp.data || [],
      byo: { base_cents: 900, per_topping_cents: 150 }, // prototype defaults
      settings: st.data || { ovens: 1, avg_minutes: 6, paused: false }
    });
  }

  if (settings) {
    const { data } = await db.from("settings").select("*").single();
    return NextResponse.json({
      ovens: data?.ovens || 1,
      avg_minutes: data?.avg_minutes || 6,
      paused: !!data?.paused
    });
  }

  if (exportCsv === "csv") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data: orders } = await db
      .from("orders")
      .select("*")
      .gte("created_at", today.toISOString())
      .order("created_at", { ascending: true });

    const rows = [["number", "status", "subtotal_cents", "total_cents", "created_at"]];
    (orders || []).forEach((o: any) =>
      rows.push([o.number, o.status, o.subtotal_cents, o.total_cents, o.created_at])
    );
    const csv = rows.map((r) => r.join(",")).join("\n");
    return new NextResponse(csv, {
      headers: { "Content-Type": "text/csv", "Cache-Control": "no-store" }
    });
  }

  // Default: list orders for admin
  let query = db
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: true });

  if (status === "ACTIVE") query = query.in("status", ["NEW", "IN_PROGRESS", "READY"]);
  else if (status !== "ALL") query = query.eq("status", status);

  const { data } = await query;
  return NextResponse.json(data || []);
}

/**
 * PATCH /api/orders
 * Body: { settings: { ovens, avg_minutes, paused } }
 * Updates global settings from the admin screen.
 */
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (body?.settings) {
    const db = supa();
    await db
      .from("settings")
      .update({
        ovens: body.settings.ovens,
        avg_minutes: body.settings.avg_minutes,
        paused: !!body.settings.paused,
        updated_at: new Date().toISOString()
      })
      .eq("id", 1);
    return NextResponse.json({ ok: true });
  }
  return new NextResponse("Bad Request", { status: 400 });
}

/**
 * POST /api/orders
 * Body: { customer, items: [{name, price_cents, ...}], subtotal_cents }
 * Creates an order, computes ETA, inserts items, and returns the full order.
 */
export async function POST(req: NextRequest) {
  const payload = await req.json();

  // Minimal validation for prototype
  if (!payload?.customer?.name || !Array.isArray(payload.items) || !payload.items.length) {
    return new NextResponse("Invalid order payload", { status: 400 });
  }

  const db = supa();

  // Read settings and count active orders
  const { data: st } = await db.from("settings").select("*").single();
  const ovens = st?.ovens || 1;
  const avg = st?.avg_minutes || 6;
  const paused = !!st?.paused;

  const { data: ahead } = await db
    .from("orders")
    .select("id")
    .in("status", ["NEW", "IN_PROGRESS", "READY"]);

  const ordersAhead = ahead?.length || 0;
  const eta = estimateETA({
    ordersAhead,
    ovens,
    avgMinutes: avg,
    pauseFactor: paused ? 1.5 : 1,
    bulkCount: payload.items.length
  });

  const total = Number(payload.subtotal_cents) || 0;

  // Insert order
  const inserted = await db
    .from("orders")
    .insert({
      customer: payload.customer,
      subtotal_cents: total,
      tax_cents: 0,
      total_cents: total,
      eta_minutes: eta
    })
    .select("*")
    .single();

  if (inserted.error || !inserted.data) {
    return new NextResponse(inserted.error?.message || "Insert failed", { status: 500 });
  }

  const orderId = inserted.data.id;

  // Insert items
  const itemsToInsert = payload.items.map((i: any) => ({
    order_id: orderId,
    name: i.name,
    price_cents: i.price_cents,
    meta: i.meta || null
  }));
  await db.from("order_items").insert(itemsToInsert);

  // Return full order
  const full = await db
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", orderId)
    .single();

  return NextResponse.json({ id: orderId, number: full.data?.number, ...full.data });
}
