import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/receipt?orderId=UUID
 * Generates a simple receipt PDF for the given order.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const orderId = url.searchParams.get("orderId");
  if (!orderId) return new NextResponse("Missing orderId", { status: 400 });

  // Supabase (anon) client
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Load order + items
  const { data: o, error } = await db
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", orderId)
    .single();

  if (error || !o) {
    return new NextResponse(error?.message || "Order not found", { status: 404 });
  }

  // Build PDF
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]); // US Letter
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const draw = (text: string, x: number, y: number, size = 12) =>
    page.drawText(text, { x, y, size, font, color: rgb(0, 0, 0) });

  let y = 760;
  const biz = process.env.NEXT_PUBLIC_BUSINESS_NAME || "Your Pizza Booth";

  draw(biz, 50, y, 18); y -= 28;
  draw(`Receipt for Order #${o.number ?? ""}`, 50, y); y -= 18;
  draw(`Placed: ${new Date(o.created_at).toLocaleString()}`, 50, y); y -= 24;

  draw(`Items:`, 50, y); y -= 16;
  (o.order_items || []).forEach((item: any) => {
    draw(`${item.name}  —  $${(item.price_cents / 100).toFixed(2)}`, 70, y);
    y -= 16;
  });

  y -= 8;
  draw(`Total: $${(o.total_cents / 100).toFixed(2)}`, 50, y); y -= 20;

  if (o.eta_minutes) {
    draw(`Estimated wait: ~${o.eta_minutes} minutes`, 50, y); y -= 16;
  }
  draw(`Thank you for your order!`, 50, y);

  const bytes = await pdf.save();

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=receipt-${o.number ?? "order"}.pdf`,
      "Cache-Control": "no-store"
    }
  });
}
