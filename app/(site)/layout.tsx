import "./../globals.css";
import Providers from "@/components/Providers";

export const metadata = {
  title: process.env.NEXT_PUBLIC_BUSINESS_NAME || "Pizza",
  description: "Order ahead"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900">
        <Providers>
          <div className="mx-auto max-w-xl p-4">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
