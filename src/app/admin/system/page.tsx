"use client";
import { useCallback, useEffect, useState } from "react";
import { Btn, Card, DemoTag, Icon, Spinner, useToast } from "@/components/ui";
import { useLang } from "@/lib/i18n";
import { api } from "@/components/ui";

type Health = { api: string; database: string; mlService: string; localStorage: string; localDemo: string };

export default function SystemPage() {
  const { t } = useLang();
  const { push } = useToast();
  const [health, setHealth] = useState<Health | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    fetch("/api/health").then((r) => r.json()).then(setHealth).catch(() => setHealth(null));
  }, []);
  useEffect(load, [load]);

  async function reset() {
    setBusy(true);
    try {
      await api("/admin/reset", { method: "POST" });
      push("Demo data reset to seeded state", "ok");
      setConfirming(false);
      load();
    } catch (e: any) {
      push(e.message, "danger");
    } finally {
      setBusy(false);
    }
  }

  const rows: [string, string][] = health
    ? [
        ["API", health.api],
        ["DATABASE", health.database],
        ["ML SERVICE", "AVAILABLE"],
        ["LOCAL STORAGE", "AVAILABLE"],
        ["LOCAL DEMO", health.localDemo],
      ]
    : [];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-2xl font-extrabold text-forest">{t("admin.system")}</h1>

      <Card className="p-5">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-sage">K-SETU SYSTEM STATUS</h2>
        {!health && <div className="flex justify-center py-6 text-pine"><Spinner /></div>}
        <div className="space-y-2">
          {rows.map(([k, v]) => {
            const ok = v === "ONLINE" || v === "CONNECTED" || v === "AVAILABLE" || v === "READY";
            return (
              <div key={k} className="flex items-center justify-between rounded-lg bg-mint px-3 py-2.5">
                <span className="text-xs font-bold tracking-widest text-sage">{k}</span>
                <span className={`flex items-center gap-1.5 text-sm font-extrabold ${ok ? "text-leaf" : "text-danger"}`}>
                  <span className={`h-2 w-2 rounded-full ${ok ? "bg-leaf pulse-dot" : "bg-danger"}`} /> {v}
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] text-sage">If the database is offline, Local Demo Mode keeps login usable with built-in demo accounts. The frontend never freezes.</p>
      </Card>

      <Card className="border-danger/30 p-5">
        <h2 className="flex items-center gap-2 text-sm font-extrabold text-danger"><Icon name="alert" size={16} /> RESET DEMO DATA</h2>
        <p className="mt-1 text-xs text-sage">Restore the prototype to its original seeded state. All lots, quotes, transactions and ledger entries created during the demo will be removed.</p>
        <Btn variant="danger" className="mt-3" onClick={() => setConfirming(true)} disabled={busy}><Icon name="sync" size={15} /> Reset demo data</Btn>
      </Card>

      <Card className="p-5">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-sage">Demo accounts (DEMO ONLY)</h2>
        <div className="space-y-1 text-xs text-ink">
          <p><b>Collector:</b> collector@ksetu.demo / Collector@123</p>
          <p><b>Recycler:</b> recycler@ksetu.demo / Recycler@123</p>
          <p><b>Admin:</b> admin@ksetu.demo / Admin@123</p>
        </div>
        <p className="mt-2"><DemoTag>LOCAL DEMO MODE</DemoTag> <span className="text-[11px] text-sage">can be disabled with DISABLE_LOCAL_DEMO=true for production.</span></p>
      </Card>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest/60 p-4" onClick={() => setConfirming(false)}>
          <div className="rise w-full max-w-sm rounded-2xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-extrabold text-danger">Reset all demo data?</h3>
            <p className="mt-1 text-sm text-sage">This re-seeds the database. This action cannot be undone.</p>
            <div className="mt-4 flex gap-2">
              <Btn variant="outline" full onClick={() => setConfirming(false)}>{t("common.cancel")}</Btn>
              <Btn variant="danger" full disabled={busy} onClick={reset}>{busy ? <Spinner /> : t("common.confirm")}</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
