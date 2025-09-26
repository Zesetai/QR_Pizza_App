"use client";

import { useEffect, useState } from "react";

// We generate a PNG QR in the browser for preview,
// and use /api/qr to download a printable PDF poster.
export default function QRPage() {
  const [png, setPng] = useState<string>("");

  useEffect(() => {
    // Dynamic import keeps it out of the server bundle.
    (async () => {
      const QRCode = (await import("qrcode")).default;
      // Try to use the deployed URL if Vercel sets it, else current window URL, else localhost fallback.
      const url =
        (typeof window !== "undefined" && window.location?.origin) ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

      const dataUrl = await QRCode.toDataURL(url, { margin: 1, width: 600 });
      setPng(dataUrl);
    })();
  }, []);

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-bold">Scan to Order</h1>
      <p className="text-gray-600">Point your phone camera at the QR code to open the ordering page.</p>

      <div className="flex items-center justify-center">
        {png ? (
          <img
            src={png}
            alt="QR code to open the ordering page"
            className="w-full max-w-xs rounded-xl border"
          />
        ) : (
          <div className="text-sm text-gray-500">Generating QR…</div>
        )}
      </div>

      <a
        href="/api/qr"
        className="block rounded-xl border p-3 text-center hover:bg-gray-50"
      >
        Download poster.pdf
      </a>
    </main>
  );
}
