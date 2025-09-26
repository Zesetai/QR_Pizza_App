"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

type Topping = { id: string; name: string; price_cents: number };

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function BuildPage() {
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    const fetchToppings = async () => {
      const { data } = await supabase.from("toppings").select("*");
      if (data) setToppings(data);
    };
    fetchToppings();
  }, []);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const total =
    800 + // base price for build-your-own
    selected
      .map((id) => toppings.find((t) => t.id === id)?.price_cents || 0)
      .reduce((a, b) => a + b, 0);

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-bold">Build Your Own Pizza</h1>
      <p>Base price: $8.00 + toppings</p>

      <div className="grid grid-cols-2 gap-4">
        {toppings.map((t) => (
          <button
            key={t.id}
            onClick={() => toggle(t.id)}
            className={`p-2 border rounded ${
              selected.includes(t.id) ? "bg-green-200" : ""
            }`}
          >
            {t.name} (+${(t.price_cents / 100).toFixed(2)})
          </button>
        ))}
      </div>

      <p className="text-lg font-semibold">
        Total: ${(total / 100).toFixed(2)}
      </p>

      <Link
        href={{
          pathname: "/order",
          query: { custom: "1", toppings: selected.join(",") }
        }}
        className="block bg-blue-600 text-white text-center rounded p-3"
      >
        Continue to Order
      </Link>
    </main>
  );
}
