"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Card, DemoTag, Empty, ErrorBox, Icon, Spinner, Stat, StatusPill } from "@/components/ui";
import { useLang, formatINR } from "@/lib/i18n";
import { api, CATEGORY_ICONS } from "@/components/ui";

type Lot = { id: number; lotCode: string; category: string; weightKg: number; status: string; collectionLocation: string; estimatedValue: number; createdAt: string; imageData: string | null };
type Quote = { id: number; lotId: number; status: string; ratePerKg: number };
type Tx = { id: number; handoverRef: string; finalPrice: number; paymentStatus: string; status: string };

export default function RecyclerDashboard() {
  const { t } = useLang();
  const [lots, setLots] = useState<Lot[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

const load = useCallback((silent = false) => {
  if (!silent) setLoading(true);

  Promise.all([
    api<Lot[]>("/lots"),
    api<Quote[]>("/quotes"),
    api<Tx[]>("/transactions"),
  ])
    .then(([l, q, tx]) => {
      setLots(l);
      setQuotes(q);
      setTxs(tx);
      setErr(null);
    })
    .catch((e) => {
      setErr(e.message);
    })
    .finally(() => {
      setLoading(false);
    });
}, []);

useEffect(() => {
  const initialLoadId = window.setTimeout(() => {
    load(true);
  }, 0);

  const refresh = () => {
    if (document.visibilityState === "visible") {
      load(true);
    }
  };

  const intervalId = window.setInterval(refresh, 15000);

  window.addEventListener("focus", refresh);
  document.addEventListener("visibilitychange", refresh);

  return () => {
    window.clearTimeout(initialLoadId);
    window.clearInterval(intervalId);
    window.removeEventListener("focus", refresh);
    document.removeEventListener("visibilitychange", refresh);
  };
}, [load]);
  const pendingQuotes = quotes.filter((q) => q.status === "pending").length;
  const completed = txs.filter((x) => x.status === "completed").length;
  const pendingPay = txs.filter((x) => x.paymentStatus === "pending").length;
  const activeHandovers = txs.filter((x) => ["active", "handover"].includes(x.status)).length;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-forest sm:text-2xl">{t("recy.dashboard")}</h1>
        <DemoTag>DEMO DATA</DemoTag>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label={t("recy.incoming")} value={String(lots.length)} icon="box" />
        <Stat label="Pending quotes" value={String(pendingQuotes)} icon="receipt" tone="warn" />
        <Stat label="Active handovers" value={String(activeHandovers)} icon="truck" tone="warn" />
        <Stat label="Completed" value={String(completed)} icon="check" tone="ok" />
        <Stat label="Pending payments" value={String(pendingPay)} icon="clock" tone="warn" />
        <Stat label="Total transactions" value={String(txs.length)} icon="wallet" />
      </div>

      {err && <ErrorBox text={err} onRetry={load} />}
      {loading && <div className="flex justify-center py-10 text-pine"><Spinner /></div>}

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-sage">Recent incoming lots</h2>
          <Link href="/recycler/lots" className="text-xs font-bold text-pine">{t("common.viewDetails")}</Link>
        </div>
        {lots.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {lots.slice(0, 4).map((l) => (
              <Card key={l.id} className="flex items-center gap-3 p-3.5">
                <span className="rounded-lg bg-mint p-2.5 text-pine"><Icon name={CATEGORY_ICONS[l.category] ?? "box"} size={22} /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold text-ink">{l.lotCode} • {l.category}</p>
                  <p className="text-[11px] text-sage">{l.weightKg} kg • {l.collectionLocation}</p>
                </div>
                <StatusPill status={l.status} label={t(`status.${l.status}`)} />
              </Card>
            ))}
          </div>
        ) : (
          !loading && <Empty icon="box" text={t("common.noData")} />
        )}
      </section>
    </div>
  );
}
