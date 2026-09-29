"use client";
import { useCallback, useEffect, useState } from "react";
import { Card, DemoTag, ErrorBox, Spinner } from "@/components/ui";
import { useLang, formatINR } from "@/lib/i18n";
import { api } from "@/components/ui";
import { Bars, Donut } from "@/components/charts";

type Stats = {
  byCategory: { category: string; weight: number; count: number }[];
  monthly: { month: string; total: number; count: number }[];
  payments: { status: string; count: number }[];
  collectorEarnings: { collectorId: number; total: number }[];
};

export default function AnalyticsPage() {
  const { t } = useLang();
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    setErr(null);
    api<any>("/admin/stats").then(setStats).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  }, []);
  useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  load();
}, [load]);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-forest">{t("admin.analytics")}</h1>
        <DemoTag>DEMO DATA</DemoTag>
      </div>
      {err && <ErrorBox text={err} onRetry={load} />}
      {loading && <div className="flex justify-center py-16 text-pine"><Spinner /></div>}

      {stats && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-4">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-sage">Material category distribution (kg)</h2>
            <Donut segments={stats.byCategory.map((c) => ({ label: c.category, value: Math.round(c.weight) }))} />
          </Card>
          <Card className="p-4">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-sage">Monthly transaction value (₹)</h2>
            <Bars data={stats.monthly.map((m) => ({ label: m.month.slice(5), value: Math.round(m.total) }))} />
          </Card>
          <Card className="p-4">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-sage">Payment status</h2>
            <Donut segments={stats.payments.map((p) => ({ label: p.status.toUpperCase(), value: p.count }))} />
          </Card>
          <Card className="p-4">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-sage">Top collector earnings (₹)</h2>
            <Bars data={stats.collectorEarnings.sort((a, b) => b.total - a.total).slice(0, 6).map((c, i) => ({ label: `C${c.collectorId}`, value: Math.round(c.total) }))} />
          </Card>
        </div>
      )}
      <p className="text-[11px] text-sage">Charts render from live API/database aggregates. Colors follow the K-SETU palette. {formatINR(0)} = ₹0 baseline.</p>
    </div>
  );
}
