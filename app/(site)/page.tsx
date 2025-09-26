import Link from "next/link";

export default function HomePage() {
  return (
    <main className="space-y-6">
      <h1 className="text-3xl font-bold">Welcome to {process.env.NEXT_PUBLIC_BUSINESS_NAME || "Our Pizza Booth"}</h1>
      <p className="text-gray-700">Order a preset pizza or build your own!</p>

      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold">Margherita</h2>
          <p>Classic with tomato, mozzarella, basil — $10</p>
          <Link href="/order?item=margh" className="text-blue-600 hover:underline">
            Order Margherita
          </Link>
        </div>

        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold">Pepperoni</h2>
          <p>Loaded with pepperoni — $12</p>
          <Link href="/order?item=pep" className="text-blue-600 hover:underline">
            Order Pepperoni
          </Link>
        </div>

        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold">Build Your Own</h2>
          <p>Pick your base + toppings.</p>
          <Link href="/build" className="text-blue-600 hover:underline">
            Start Building
          </Link>
        </div>
      </div>
    </main>
  );
}
