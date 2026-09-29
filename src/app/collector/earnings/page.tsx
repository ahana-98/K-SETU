"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, DemoTag, Empty, ErrorBox, Icon, Stat, StatusPill } from "@/components/ui";
import { useLang, formatINR } from "@/lib/i18n";
import { api } from "@/components/ui";
import { cacheGet, cacheSet, useOnline } from "@/lib/offline";
import { Bars } from "@/components/charts";

type Ledger = { id: number; category: string; amount: number; status: string; recyclerName: string; weightKg: number; createdAt: string };

export default function EarningsPage() {
  const { t } = useLang();
  const online = useOnline();
  const [rows, setRows] = useState<Ledger[]>([]);
  const [fStatus, setFStatus] = useState("");
  const [fCat, setFCat] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
  setLoading(true);
  setErr(null);

  const cacheKey = `earnings_${fStatus}_${fCat}`;

  // Offline: use cached earnings immediately.
  if (!online) {
    const cached = cacheGet<Ledger[]>(cacheKey);

    if (cached) {
      setRows(cached);
      setLoading(false);
      return;
    }

    setRows([]);
    setLoading(false);
    setErr(t("login.serverDown"));
    return;
  }

  // Online: fetch latest earnings and refresh cache.
  const q = new URLSearchParams();
  if (fStatus) q.set("status", fStatus);
  if (fCat) q.set("category", fCat);

  api<Ledger[]>(`/ledger?${q}`)
    .then((data) => {
      setRows(data);
      cacheSet(cacheKey, data);
    })
    .catch(() => {
      // Server unavailable: fall back to cached earnings.
      const cached = cacheGet<Ledger[]>(cacheKey);

      if (cached) {
        setRows(cached);
      } else {
        setErr(t("login.serverDown"));
      }
    })
    .finally(() => setLoading(false));
}, [fStatus, fCat, online, t]);
 // eslint-disable-next-line react-hooks/set-state-in-effect
useEffect(load, [load]);

  const total = rows.reduce((a, x) => a + x.amount, 0);
  const paid = rows.filter((x) => x.status === "paid").reduce((a, x) => a + x.amount, 0);
  const pending = rows.filter((x) => x.status === "pending").reduce((a, x) => a + x.amount, 0);
  const completed = rows.filter((x) => x.status === "paid").length;

  const monthly = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) {
      const k = new Date(r.createdAt).toLocaleDateString("en-IN", { month: "short" });
      map.set(k, (map.get(k) || 0) + r.amount);
    }
    return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
  }, [rows]);

  const cats = useMemo(() => Array.from(new Set(rows.map((r) => r.category))), [rows]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-forest">{t("earn.title")}</h1>
        <DemoTag>DEMO DATA</DemoTag>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat label={t("home.totalEarnings")} value={formatINR(total)} icon="wallet" />
        <Stat label={t("earn.completed")} value={String(completed)} icon="check" tone="ok" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Stat label={t("earn.paid")} value={formatINR(paid)} icon="check" tone="ok" />
        <Stat label={t("earn.pending")} value={formatINR(pending)} icon="clock" tone="warn" />
      </div>

      <Card className="p-4">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-sage">{t("earn.chart")}</h2>
        <Bars data={monthly} />
      </Card>

      <Card className="p-3.5">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-sage">{t("earn.ledger")}</h2>
        <div className="flex gap-2">
          <select className="flex-1 rounded-lg border border-[#cfe0d4] bg-white px-2 py-1.5 text-xs" value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
            <option value="">{t("common.all")} — status</option>
            <option value="paid">PAID</option>
            <option value="pending">PENDING</option>
          </select>
          <select className="flex-1 rounded-lg border border-[#cfe0d4] bg-white px-2 py-1.5 text-xs" value={fCat} onChange={(e) => setFCat(e.target.value)}>
            <option value="">{t("common.all")} — material</option>
            {cats.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </Card>

      {err && <ErrorBox text={err} onRetry={load} />}
      {!loading && !rows.length && !err && <Empty icon="wallet" text={t("common.noData")} />}

      <div className="space-y-2">
        {rows.map((r) => (
          <Card key={r.id} className="flex items-center gap-3 p-3.5">
            <span className={`rounded-lg p-2.5 ${r.status === "paid" ? "bg-okbg text-leaf" : "bg-warnbg text-warn"}`}><Icon name="wallet" size={20} /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold text-ink">{r.category} • {r.weightKg} kg</p>
              <p className="truncate text-[11px] text-sage">{r.recyclerName} • {new Date(r.createdAt).toLocaleDateString("en-IN")}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-extrabold text-forest">{formatINR(r.amount)}</p>
              <StatusPill status={r.status} label={t(`status.${r.status}`)} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
