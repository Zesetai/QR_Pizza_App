'use client';

import { useEffect, useMemo, useState } from 'react';

type Order = {
  id: string;
  number: number | null;
  status: 'NEW'|'IN_PROGRESS'|'READY'|'DONE'|'CANCELLED';
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  created_at: string;
  customer: any;
};

const NEXT = {
  NEW: 'IN_PROGRESS',
  IN_PROGRESS: 'READY',
  READY: 'DONE',
} as const;

export default function AdminPage() {
  const [passcode, setPasscode] = useState('');
  const [input, setInput] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // load cached passcode
  useEffect(() => {
    const saved = window.localStorage.getItem('admin_passcode') || '';
    if (saved) {
      setPasscode(saved);
      setInput(saved);
    }
  }, []);

  const headers = useMemo(
    () => (passcode ? { 'x-admin-passcode': passcode } : {}),
    [passcode]
  );

  async function fetchOrders() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch('/api/admin/orders', { headers });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'Failed to fetch');
      setOrders(json.rows as Order[]);
    } catch (e: any) {
      setErr(e.message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
    const id = setInterval(fetchOrders, 4000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passcode, refreshKey]);

  function savePasscode() {
    setPasscode(input.trim());
    window.localStorage.setItem('admin_passcode', input.trim());
    setRefreshKey((k) => k + 1);
  }

  async function setStatus(id: string, status: Order['status']) {
    setErr(null);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', ...headers },
        body: JSON.stringify({ id, status }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'Failed to update');
      fetchOrders();
    } catch (e: any) {
      setErr(e.message);
    }
  }

  function nextStatus(s: Order['status']) {
    // @ts-ignore
    return NEXT[s] ?? null;
  }

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin Queue</h1>

      <section className="flex items-end gap-2">
        <div className="flex flex-col">
          <label className="text-sm font-medium">Admin passcode</label>
          <input
            className="border rounded px-3 py-2"
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter admin passcode"
          />
        </div>
        <button onClick={savePasscode} className="px-4 py-2 rounded bg-black text-white">
          Save
        </button>
        <button onClick={() => setRefreshKey((k) => k + 1)} className="px-4 py-2 rounded border">
          Refresh
        </button>
        {loading && <span className="text-sm">Loading…</span>}
        {err && <span className="text-sm text-red-600">Error: {err}</span>}
      </section>

      <section className="grid gap-3">
        {orders.length === 0 && !loading && (
          <div className="text-sm text-gray-600">No orders yet.</div>
        )}
        {orders.map((o) => (
          <div key={o.id} className="rounded-2xl border p-4 flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-semibold">
                #{o.number ?? '—'} · {o.status}
              </div>
              <div className="text-sm">
                Total ${(o.total_cents / 100).toFixed(2)} · Placed {new Date(o.created_at).toLocaleTimeString()}
              </div>
              <div className="text-xs text-gray-600">
                {(o.customer?.full_name || o.customer?.name || 'Customer')} · {(o.customer?.phone || o.customer?.email || '')}
              </div>
            </div>
            <div className="flex gap-2">
              {o.status !== 'CANCELLED' && o.status !== 'DONE' && (
                <>
                  {nextStatus(o.status) && (
                    <button
                      onClick={() => setStatus(o.id, nextStatus(o.status) as Order['status'])}
                      className="px-3 py-2 rounded bg-green-600 text-white"
                    >
                      Advance → {nextStatus(o.status)}
                    </button>
                  )}
                  <button
                    onClick={() => setStatus(o.id, 'CANCELLED')}
                    className="px-3 py-2 rounded bg-red-600 text-white"
                  >
                    Cancel
                  </button>
                </>
              )}
              {o.status === 'READY' && (
                <button
                  onClick={() => setStatus(o.id, 'DONE')}
                  className="px-3 py-2 rounded bg-black text-white"
                >
                  Mark Done
                </button>
              )}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
