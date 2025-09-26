"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

type MenuItem = { id: string; name: string; price_cents: number; tags?: string[] };
type Topping = { id: string; name: string; price_cents: number };

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function OrderPage() {
  const router = useRouter();
  const params = useSearchParams();

  // Query params:
  // - preset via ?item=margh (from homepage links)
  // - custom via ?custom=1&toppings=pep,msh,olv (from builder)
  const presetId = params.get("item");
  const isCustom = params.get("custom") === "1";
  const selectedToppings = (params.get("toppings") || "")
    .split(",")
    .filter(Boolean);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [loading, setLoading] = useState(true);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    (async () => {
      const [mi, tp] = await Promise.all([
        supabase.from("menu_items").select("*"),
        supabase.from("toppings").select("*"),
      ]);
      setMenuItems(mi.data || []);
      setToppings(tp.data || []);
      setLoading(false);
    })();
  }, []);

  const lineItems = useMemo(() => {
    if (loading) return [];

    // Preset pizza flow
    if (presetId) {
      const m = menuItems.find((x) => x.id === presetId);
      if (m) {
        return [
          {
            type: "preset",
            id: m.id,
            name: m.name,
            price_cents: m.price_cents,
          },
        ];
      }
    }

    // Custom build flow
    if (isCustom) {
      const sel = toppings.filter((t) => selectedToppings.includes(t.id));
      const base_cents = 800; // prototype base for BYO
      const toppers = sel.reduce((sum, t) => sum + (t.price_cents || 0), 0);
      const total = base_cents + toppers;
      return [
        {
          type: "custom",
          id: "byo",
          name:
            "Build Your Own (" +
            (sel.length ? sel.map((s) => s.name).join(", ") : "no toppings") +
            ")",
          price_cents: total,
          meta: { toppings: selectedToppings },
        },
      ];
    }

    return [];
  }, [loading, presetId, isCustom, selectedToppings, menuItems, toppings]);

  const subtotal_cents = lineItems.reduce(
    (sum, li: any) => sum + (li.price_cents || 0),
    0
  );

  async function placeOrder() {
    if (!name.trim()) {
      alert("Please enter your name");
      return;
    }
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name, email: email || undefined, phone: phone || undefined, notes: notes || undefined },
          items: lineItems,
          subtotal_cents,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json(); // { id, number, ... }
      router.push(`/receipt?orderId=${data.id}`);
    } catch (e: any) {
      alert(e.message || "Failed to place order");
    }
  }

  if (loading) return <div>Loading…</div>;
  if (lineItems.length === 0)
    return (
      <main className="space-y-4">
        <h1 className="text-2xl font-bold">No items selected</h1>
        <p className="text-gray-600">Please choose a pizza first.</p>
        <div className="flex gap-3">
          <Link href="/" className="underline text-blue-600">Back to menu</Link>
          <Link href="/build" className="underline text-blue-600">Build your own</Link>
        </div>
      </main>
    );

  return (
    <main className="space-y-5">
      <h1 className="text-2xl font-bold">Your Order</h1>

      <ul className="rounded-xl border p-3 text-sm">
        {lineItems.map((li: any, idx: number) => (
          <li key={idx} className="flex justify-between">
            <span>{li.name}</span>
            <span>${(li.price_cents / 100).toFixed(2)}</span>
          </li>
        ))}
        <li className="mt-2 flex justify-between font-semibold">
          <span>Total</span>
          <span>${(subtotal_cents / 100).toFixed(2)}</span>
        </li>
      </ul>

      <div className="space-y-2">
        <input
          className="w-full rounded border p-2"
          placeholder="Your Name (required)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="w-full rounded border p-2"
          placeholder="Email (optional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full rounded border p-2"
          placeholder="Phone (optional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <textarea
          className="w-full rounded border p-2"
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <button
        onClick={placeOrder}
        className="w-full rounded-xl bg-black p-3 text-white"
      >
        Order (prototype)
      </button>

      <p className="text-xs text-gray-500">
        Prototype: no real payment is taken. You’ll see your order number and ETA on the next screen.
      </p>
    </main>
  );
}
