import QRCode from "qrcode";
import { PDFDocument, rgb } from "pdf-lib";
import fs from "fs";

async function main() {
  const url = process.env.NEXT_PUBLIC_PUBLIC_URL || "http://localhost:3000";
  const pngDataUrl = await QRCode.toDataURL(url, { margin: 1, width: 900 });
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const pngBytes = Buffer.from(pngDataUrl.split(",")[1], "base64");
  const png = await pdf.embedPng(pngBytes);
  const { width, height } = png.scale(0.7);
  const x = (612 - width) / 2;
  const y = 300;
  page.drawText("Scan to Order", { x: 50, y: 720, size: 28, color: rgb(0, 0, 0) });
  page.drawImage(png, { x, y, width, height });
  page.drawText(url, { x: 50, y: 260, size: 12, color: rgb(0.25, 0.25, 0.25) });
  const bytes = await pdf.save();
  fs.writeFileSync("poster.pdf", bytes);
  console.log("poster.pdf created");
}
main();
