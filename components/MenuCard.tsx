"use client";

import Link from "next/link";

export default function MenuCard({
  id,
  name,
  price_cents,
  description
}: {
  id: string;
  name: string;
  price_cents: number;
  description?: string;
}) {
  return (
    <div className="border rounded-lg p-4">
      <h2 className="text-xl font-semibold">{name}</h2>
      {description && <p className="text-gray-600">{description}</p>}
      <p className="mt-1 font-medium">${(price_cents / 100).toFixed(2)}</p>
      <Link
        href={`/order?item=${id}`}
        className="mt-2 inline-block rounded bg-blue-600 px-3 py-1 text-white"
      >
        Order
      </Link>
    </div>
  );
}
