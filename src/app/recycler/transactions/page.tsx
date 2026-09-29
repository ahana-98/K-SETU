"use client";
import { useCallback, useEffect, useState } from "react";
import { Btn, Card, Empty, ErrorBox, Icon, Spinner, StatusPill, useToast } from "@/components/ui";
import { useLang, formatINR } from "@/lib/i18n";
import { api } from "@/components/ui";

type Tx = { id: number; txCode: string; handoverRef: string; finalPrice: number; paymentStatus: string; paymentMethod: string; status: string; createdAt: string; lot: { lotCode: string; category: string; weightKg: number } | null };

export default function TransactionsPage() {
  const { t } = useLang();
  const { push } = useToast();
  const [txs, setTxs] = useState<Tx[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setErr(null);
    api<Tx[]>("/transactions").then(setTxs).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  }, []);
 // eslint-disable-next-line react-hooks/set-state-in-effect
useEffect(load, [load]);

  async function pay(tx: Tx) {
    setBusy(tx.id);
    try {
      await api(`/handovers/${tx.id}/payment`, { method: "POST", body: JSON.stringify({ method: tx.paymentMethod || "cash" }) });
      push("Payment recorded ✓", "ok");
      load();
    } catch (e: any) {
      push(e.message, "danger");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h1 className="text-xl font-extrabold text-forest">{t("recy.transactions")}</h1>
      {err && <ErrorBox text={err} onRetry={load} />}
      {loading && <div className="flex justify-center py-10 text-pine"><Spinner /></div>}
      {!loading && !txs.length && !err && <Empty icon="wallet" text={t("common.noData")} />}
      <div className="space-y-2.5">
        {txs.map((tx) => (
          <Card key={tx.id} className="flex flex-wrap items-center gap-3 p-3.5">
            <span className={`rounded-lg p-2.5 ${tx.paymentStatus === "paid" ? "bg-okbg text-leaf" : "bg-warnbg text-warn"}`}><Icon name="receipt" size={20} /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold text-ink">{tx.handoverRef} • {tx.lot?.category ?? ""}</p>
              <p className="text-[11px] text-sage">{tx.lot?.weightKg ?? 0} kg • {new Date(tx.createdAt).toLocaleDateString("en-IN")} • {tx.paymentMethod.toUpperCase()}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-extrabold text-forest">{formatINR(tx.finalPrice)}</p>
              <StatusPill status={tx.paymentStatus} label={t(`status.${tx.paymentStatus}`)} />
            </div>
            {tx.paymentStatus === "pending" && tx.status !== "active" && (
              <Btn size="sm" disabled={busy !== null} onClick={() => pay(tx)}>{busy === tx.id ? <Spinner /> : t("recy.markPaid")}</Btn>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
