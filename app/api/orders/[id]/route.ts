import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/** Supabase client (anon key) */
const db = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

/** GET /api/orders/[id] — fetch a single order (with items) */
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await db()
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", params.id)
    .single();
  if (error) return new NextResponse(error.message, { status: 404 });
  return NextResponse.json(data);
}

/**
 * PATCH /api/orders/[id]
 * Body (JSON): { status?: 'NEW'|'IN_PROGRESS'|'READY'|'DONE'|'CANCELLED', adjustment_note?: string }
 * Prototype admin-only mutation. In production, enforce auth/roles!
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const text = await req.text();
  const json = text ? JSON.parse(text) : {};

  const updates: Record<string, any> = {};
  if (json.status) updates.status = json.status;
  if (json.adjustment_note !== undefined) updates.adjustment_note = json.adjustment_note;

  if (Object.keys(updates).length === 0) {
    return new NextResponse("No updates provided", { status: 400 });
  }

  const client = db();
  const { data, error } = await client
    .from("orders")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) return new NextResponse(error.message, { status: 500 });

  // Write audit log (prototype)
  await client.from("audit_logs").insert({
    entity: "orders",
    entity_id: params.id,
    action: "PATCH",
    diff: updates
  });

  return NextResponse.json(data);
}

/** DELETE /api/orders/[id] — remove an order (prototype) */
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await db().from("orders").delete().eq("id", params.id);
  if (error) return new NextResponse(error.message, { status: 500 });
  return NextResponse.json({ ok: true });
}
