"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const [ok, setOk] = useState(false);
  const [ovens, setOvens] = useState(1);
  const [avg, setAvg] = useState(6);
  const [paused, setPaused] = useState(false);

  // Same simple passcode gate as Admin list page
  useEffect(() => {
    const cached = typeof window !== "undefined" && localStorage.getItem("admin_ok") === "yes";
    if (cached) return setOk(true);

    const pass = prompt("Enter admin passcode");
    const expected = process.env.NEXT_PUBLIC_ADMIN_PASSCODE;
    if (pass && expected && pass === expected) {
      localStorage.setItem("admin_ok", "yes");
      setOk(true);
    } else {
      alert("Wrong passcode");
      router.push("/");
    }
  }, [router]);

  useEffect(() => {
    if (!ok) return;
    (async () => {
      const r = await fetch("/api/orders?settings=1", { cache: "no-store" });
      if (r.ok) {
        const s = await r.json();
        setOvens(s.ovens ?? 1);
        setAvg(s.avg_minutes ?? 6);
        setPaused(!!s.paused);
      }
    })();
  }, [ok]);

  async function save() {
    await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: { ovens, avg_minutes: avg, paused } })
    });
    alert("Saved");
  }

  if (!ok) return null;

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>

      <label className="block">
        Ovens
        <input
          type="number"
          min={1}
          className="ml-2 w-24 rounded border p-1"
          value={ovens}
          onChange={(e) => setOvens(parseInt(e.target.value || "1"))}
        />
      </label>

      <label className="block">
        Avg minutes per pizza
        <input
          type="number"
          min={1}
          className="ml-2 w-24 rounded border p-1"
          value={avg}
          onChange={(e) => setAvg(parseInt(e.target.value || "6"))}
        />
      </label>

      <label className="block">
        <input
          type="checkbox"
          checked={paused}
          onChange={(e) => setPaused(e.target.checked)}
          className="mr-2"
        />
        Temporarily paused (adds wait-time multiplier)
      </label>

      <div className="flex gap-2">
        <button onClick={save} className="rounded border px-3 py-2">
          Save
        </button>
        <a href="/admin" className="rounded border px-3 py-2">
          Back to Admin
        </a>
      </div>
    </main>
  );
}
