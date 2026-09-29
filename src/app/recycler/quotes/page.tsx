"use client";
import { useCallback, useEffect, useState } from "react";
import { Card, Empty, ErrorBox, Spinner, StatusPill } from "@/components/ui";
import { useLang, formatINR } from "@/lib/i18n";
import { api } from "@/components/ui";

type Q = { id: number; ratePerKg: number; status: string; pickupAvailable: boolean; notes: string | null; createdAt: string; lot: { lotCode: string; category: string; weightKg: number; collectionLocation: string; status: string } | null };

export default function QuotesPage() {
  const { t } = useLang();
  const [quotes, setQuotes] = useState<Q[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    setErr(null);
    api<Q[]>("/quotes")
      .then(setQuotes)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect
useEffect(load, [load]);
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h1 className="text-xl font-extrabold text-forest">{t("recy.quotes")}</h1>
      {err && <ErrorBox text={err} onRetry={load} />}
      {loading && <div className="flex justify-center py-10 text-pine"><Spinner /></div>}
      {!loading && !quotes.length && !err && <Empty icon="receipt" text={t("common.noData")} />}
      <div className="grid gap-3 md:grid-cols-2">
        {quotes.map((q) => (
          <Card key={q.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-extrabold text-ink">{q.lot?.lotCode ?? "—"} • {q.lot?.category ?? ""}</p>
                <p className="text-[11px] text-sage">{q.lot?.weightKg ?? 0} kg • {q.lot?.collectionLocation ?? ""}</p>
              </div>
              <StatusPill status={q.status} label={q.status.toUpperCase()} />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-lg font-extrabold text-forest">{formatINR(q.ratePerKg)} <span className="text-[10px] text-sage">{t("common.perKg")}</span></p>
              <p className="text-xs font-bold text-sage">≈ {formatINR(q.ratePerKg * (q.lot?.weightKg ?? 0))}</p>
            </div>
            {q.notes && (
  <p className="mt-1 text-[11px] italic text-sage">
    &quot;{q.notes}&quot;
  </p>
)}
          </Card>
        ))}
      </div>
    </div>
  );
}
