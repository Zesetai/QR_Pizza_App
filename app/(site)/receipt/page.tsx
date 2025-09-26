"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ReceiptPage(){
  const params = useSearchParams();
  const orderId = params.get("orderId");
  const [order,setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{ 
    (async()=>{
      if(!orderId) return;
      const r = await fetch(`/api/orders/${orderId}`);
      if(r.ok) {
        const data = await r.json();
        // Normalize shape to { id, number, created_at, eta_minutes, order_items, total_cents }
        setOrder({
          ...data,
          items: data.order_items || []
        });
      }
      setLoading(false);
    })(); 
  },[orderId]);

  if(loading) return <div>Loading…</div>;
  if(!order) return <div>Order not found.</div>;

  const dollars = (c:number)=> `$${(c/100).toFixed(2)}`;

  const subject = encodeURIComponent(`Receipt for order #${order.number}`);
  const body = encodeURIComponent(
    [
      `Thanks from ${process.env.NEXT_PUBLIC_BUSINESS_NAME || "Our Pizza Booth"}`,
      `Order #: ${order.number}`,
      `When: ${new Date(order.created_at).toLocaleString()}`,
      `Items:`,
      ...order.items.map((i:any)=>` - ${i.name} ${dollars(i.price_cents)}`),
      `Total: ${dollars(order.total_cents)}`
    ].join("\n")
  );

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-bold">Order #{order.number}</h1>

      <div className="rounded-xl border p-3 text-sm">
        <div>Placed: {new Date(order.created_at).toLocaleString()}</div>
        <div>ETA: ~{order.eta_minutes} min</div>
      </div>

      <ul className="rounded-xl border p-3 text-sm">
        {order.items.map((i:any,idx:number)=>(
          <li key={idx} className="flex justify-between">
            <span>{i.name}</span>
            <span>{dollars(i.price_cents)}</span>
          </li>
        ))}
        <li className="mt-2 flex justify-between font-semibold">
          <span>Total</span>
          <span>{dollars(order.total_cents)}</span>
        </li>
      </ul>

      <div className="flex gap-2">
        <a
          href={`/api/receipt?orderId=${order.id}`}
          className="flex-1 rounded-xl border p-3 text-center"
        >
          Download PDF
        </a>
        <a
          href={`mailto:${process.env.NEXT_PUBLIC_RECEIPT_SENDER_EMAIL || process.env.RECEIPT_SENDER_EMAIL || ""}?subject=${subject}&body=${body}`}
          className="flex-1 rounded-xl border p-3 text-center"
        >
          Prefilled Email
        </a>
      </div>

      <button
        onClick={()=> navigator.clipboard.writeText(
          `Order #${order.number}\nWhen: ${new Date(order.created_at).toLocaleString()}\n` +
          order.items.map((i:any)=>`${i.name} ${dollars(i.price_cents)}`).join("\n") +
          `\nTotal ${dollars(order.total_cents)}`
        )}
        className="w-full rounded-xl border p-3"
      >
        Copy receipt text
      </button>
    </main>
  );
}
