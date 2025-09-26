"use client";

export default function OrderCard({
  order
}: {
  order: {
    number: number;
    customer: { name?: string };
    status: string;
    eta_minutes?: number;
    order_items?: { name: string; price_cents: number }[];
  };
}) {
  return (
    <div className="rounded-xl border p-3">
      <div className="flex items-center justify-between">
        <div className="font-semibold">
          #{order.number} · {order.customer?.name || "Walk-up"}
        </div>
        <div className="text-sm">{order.status} · ETA ~{order.eta_minutes}m</div>
      </div>
      <ul className="mt-2 text-sm">
        {(order.order_items || []).map((i, idx) => (
          <li key={idx} className="flex justify-between">
            <span>{i.name}</span>
            <span>${(i.price_cents / 100).toFixed(2)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
