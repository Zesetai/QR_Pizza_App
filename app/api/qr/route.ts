import QRCode from "qrcode";
import { NextResponse } from "next/server";
import { PDFDocument, rgb } from "pdf-lib";

/**
 * GET /api/qr
 * Generates a Letter-sized poster PDF with a QR that points to your site.
 */
export async function GET() {
  // Prefer the deployed URL on Vercel, else try to fall back (this route runs on the server).
  // For local dev, the link text in the poster will be http://localhost:3000.
  const url =
    process.env.NEXT_PUBLIC_PUBLIC_URL || // optional manual override
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  // 1) Make a QR PNG as a data URL
  const pngDataUrl = await QRCode.toDataURL(url, { margin: 1, width: 900 });

  // 2) Create a PDF and embed the QR
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]); // US Letter in points (8.5" x 11")
  const pngBytes = Buffer.from(pngDataUrl.split(",")[1], "base64");
  const png = await pdf.embedPng(pngBytes);

  // Scale and position the QR roughly centered
  const scale = 0.7;
  const { width, height } = png.scale(scale);
  const x = (612 - width) / 2;
  const y = 300;

  // 3) Draw title + QR + URL
  const title = process.env.NEXT_PUBLIC_BUSINESS_NAME || "Scan to Order";
  page.drawText(title, { x: 50, y: 720, size: 28, color: rgb(0, 0, 0) });
  page.drawImage(png, { x, y, width, height });
  page.drawText(url, { x: 50, y: 260, size: 12, color: rgb(0.25, 0.25, 0.25) });

  // 4) Return PDF bytes
  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=poster.pdf",
      "Cache-Control": "no-store"
    }
  });
}
