"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Btn, Card, DemoTag, Empty, ErrorBox, Icon, Spinner, StatusPill, useToast } from "@/components/ui";
import { useLang, formatINR } from "@/lib/i18n";
import { api, CATEGORY_ICONS } from "@/components/ui";
import { QrBox } from "@/components/qr";
import {
  cacheGet,
  cacheSet,
  useOnline,
  useQueueCount,
} from "@/lib/offline";

type Lot = { id: number; lotCode: string; category: string; weightKg: number; condition: string; status: string; estimatedValue: number; collectionLocation: string; synced: boolean; createdAt: string; imageData: string | null };
type Quote = { id: number; ratePerKg: number; pickupAvailable: boolean; notes: string | null; status: string; recyclerName: string; createdAt: string };
type Tx = {
  id: number;
  lotId: number;
  handoverRef: string;
  finalPrice: number;
  paymentStatus: string;
  paymentMethod: string;
  status: string;
  recyclerName: string;
  handoverOtp?: string;
};type Trace = { stage: string; label: string; at: string; ref: string | null; location: string | null };

const STAGES = ["collected", "lot", "quote", "selected", "handover", "confirmed", "payment", "recycling"];

export default function LotsPage() {
  const { t } = useLang();
  const { push } = useToast();
  const queueCount = useQueueCount();
  const online = useOnline();
  const [lots, setLots] = useState<Lot[]>([]);
  const [open, setOpen] = useState<number | null>(null);
  const [quotes, setQuotes] = useState<Record<number, Quote[]>>({});
  const [txMap, setTxMap] = useState<Record<number, Tx>>({});
  const [trace, setTrace] = useState<Record<number, Trace[]>>({});
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

const load = useCallback(() => {
  setLoading(true);
  setErr(null);

  // Offline: load cached lots and transactions.
  if (!online) {
    const cachedLots = cacheGet<Lot[]>("collector_lots");
    const cachedTxs = cacheGet<Tx[]>("collector_transactions");

    if (cachedLots) {
      setLots(cachedLots);

      const m: Record<number, Tx> = {};
      for (const tx of cachedTxs ?? []) {
        m[tx.lotId] = tx;
      }

      setTxMap(m);
      setLoading(false);
      return;
    }

    setLots([]);
    setTxMap({});
    setLoading(false);
    setErr(t("login.serverDown"));
    return;
  }

  // Online: fetch latest data and refresh cache.
  Promise.all([
    api<Lot[]>("/lots"),
    api<Tx[]>("/transactions"),
  ])
    .then(([ls, txs]) => {
      setLots(ls);

      const m: Record<number, Tx> = {};
      for (const tx of txs) {
        m[tx.lotId] = tx;
      }

      setTxMap(m);

      // Save for offline use.
      cacheSet("collector_lots", ls);
      cacheSet("collector_transactions", txs);
    })
    .catch(() => {
      // Server unavailable: fall back to cached data.
      const cachedLots = cacheGet<Lot[]>("collector_lots");
      const cachedTxs = cacheGet<Tx[]>("collector_transactions");

      if (cachedLots) {
        setLots(cachedLots);

        const m: Record<number, Tx> = {};
        for (const tx of cachedTxs ?? []) {
          m[tx.lotId] = tx;
        }

        setTxMap(m);
      } else {
        setErr(t("login.serverDown"));
      }
    })
    .finally(() => setLoading(false));
}, [online, t]);
  useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  load();
}, [load]);

  useEffect(() => {
  if (open == null) return;

  const lotId = open;
  const lot = lots.find((l) => l.id === lotId);

  if (!lot) return;

  const quotesKey = `collector_quotes_${lotId}`;
  const traceKey = `collector_trace_${lotId}`;

  const loadDetails = async () => {
    if (!online) {
      const cachedQuotes = cacheGet<Quote[]>(quotesKey);
      const cachedTrace = cacheGet<Trace[]>(traceKey);

      if (cachedQuotes) {
        setQuotes((s) => ({ ...s, [lotId]: cachedQuotes }));
      }

      if (cachedTrace) {
        setTrace((s) => ({ ...s, [lotId]: cachedTrace }));
      }

      return;
    }

    if (
      ["quoted", "accepted", "handover", "completed"].includes(lot.status) &&
      !quotes[lotId]
    ) {
      try {
        const q = await api<Quote[]>(`/quotes?lotId=${lotId}`);

        setQuotes((s) => ({ ...s, [lotId]: q }));
        cacheSet(quotesKey, q);
      } catch {}
    }

    if (!trace[lotId]) {
      try {
        const tr = await api<Trace[]>(`/traceability/${lotId}`);

        setTrace((s) => ({ ...s, [lotId]: tr }));
        cacheSet(traceKey, tr);
      } catch {}
    }
  };

  void loadDetails();
}, [open, lots, quotes, trace, online]);

  async function decide(quoteId: number, accept: boolean) {
    setBusy(`${quoteId}`);
    try {
      if (accept) {
const tx = await api<Tx>(`/quotes/${quoteId}/accept`, { method: "POST" });

if (tx.handoverOtp) {
  sessionStorage.setItem(`ksetu_handover_otp_${tx.id}`, tx.handoverOtp);
}

push(
  `${t("handover.ref")}: ${tx.handoverRef} • Handover OTP: ${tx.handoverOtp ?? "generated"}`,
  "ok"
);      } else {
        await api(`/quotes/${quoteId}/reject`, { method: "POST" });
        push("Quote rejected", "info");
      }
      setQuotes({});
      setTxMap({});
      load();
    } catch (e: any) {
      push(e.message, "danger");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-forest">{t("nav.lots")}</h1>
        {queueCount > 0 && <Badge tone="warn"><Icon name="sync" size={11} /> {queueCount} {t("common.pendingSync")}</Badge>}
      </div>

      {err && <ErrorBox text={err} onRetry={load} />}
      {loading && <div className="flex justify-center py-8 text-pine"><Spinner /></div>}
      {!loading && !lots.length && !err && (
        <div className="space-y-3">
          <Empty icon="box" text={t("common.noData")} />
          <Link href="/collector/sell"><Btn full><Icon name="plus" size={16} /> {t("sell.create")}</Btn></Link>
        </div>
      )}

      <div className="space-y-3">
        {lots.map((lot) => {
          const tx = txMap[lot.id as never] as Tx | undefined;
          const isOpen = open === lot.id;
          const hasWeightAnomaly = trace[lot.id]?.some(
  (e) => e.stage === "anomaly" && e.label === "Weight anomaly detected"
);
          return (
            <Card key={lot.id} className="overflow-hidden">
              <button className="flex w-full items-center gap-3 p-3.5 text-left" onClick={() => setOpen(isOpen ? null : lot.id)}>
                {lot.imageData ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={lot.imageData} alt="" className="h-12 w-12 rounded-lg border border-[#dcebe0] object-cover" />
                ) : (
                  <span className="rounded-lg bg-mint p-2.5 text-pine"><Icon name={CATEGORY_ICONS[lot.category] ?? "box"} size={22} /></span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-sm font-extrabold text-ink">
                    {lot.lotCode} {!lot.synced && <DemoTag>OFFLINE</DemoTag>}
                  </p>
                  <p className="text-[11px] text-sage">{lot.category} • {lot.weightKg} kg • {formatINR(lot.estimatedValue)}</p>
                  {hasWeightAnomaly && (
  <p className="mt-1 text-[10px] font-bold text-red-600">
    ⚠️ Weight anomaly detected — manual review recommended
  </p>
)}
                </div>
                <StatusPill status={lot.status} label={t(`status.${lot.status}`)} />
              </button>

              {isOpen && (
                <div className="rise space-y-4 border-t border-[#dcebe0] bg-paper/60 p-4">
                  {/* Quotes */}
                  {["quoted", "open"].includes(lot.status) && (
                    <section>
                      <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-sage">{t("lot.quotes")}</h3>
                      {quotes[lot.id]?.filter((q) => q.status === "pending").length ? (
                        <div className="space-y-2">
                          {quotes[lot.id].filter((q) => q.status === "pending").map((q) => (
                            <div key={q.id} className="rounded-lg border border-[#dcebe0] bg-white p-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-extrabold text-ink">{q.recyclerName}</p>
                                  <p className="text-[11px] text-sage">{formatINR(q.ratePerKg)} {t("common.perKg")} • ≈ {formatINR(q.ratePerKg * lot.weightKg)} • {q.pickupAvailable ? t("rec.pickup") : t("rec.noPickup")}</p>
                                </div>
                              </div>
                              {q.notes && (
                                <p className="mt-1 text-[11px] italic text-sage">
                                   &quot;{q.notes}&quot;
                                </p>
                               )}
                              <div className="mt-2 flex gap-2">
                                <Btn size="sm" disabled={busy !== null} onClick={() => decide(q.id, true)}>{busy === `${q.id}` ? <Spinner /> : <Icon name="check" size={14} />} {t("lot.accept")}</Btn>
                                <Btn size="sm" variant="outline" disabled={busy !== null} onClick={() => decide(q.id, false)}>{t("lot.reject")}</Btn>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-sage">{t("lot.noQuotes")}</p>
                      )}
                    </section>
                  )}

                  {/* Handover */}
                  {tx && (
                    <section className="rounded-lg bg-mint p-3.5">
                      {(() => {
  const otp =
    typeof window !== "undefined"
      ? sessionStorage.getItem(`ksetu_handover_otp_${tx.id}`)
      : null;

  return otp ? (
    <div className="mt-3 rounded-lg border-2 border-dashed border-forest bg-white p-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-sage">
        Handover OTP
      </p>
      <p className="mt-1 text-2xl font-extrabold tracking-[0.35em] text-forest">
        {otp}
      </p>
      <p className="mt-1 text-[10px] text-sage">
        Share this OTP with the authorized recycler during handover verification.
      </p>
    </div>
  ) : null;
})()}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-widest text-sage">{t("handover.receipt")}</h3>
                          <p className="mt-1 text-lg font-extrabold text-forest">{tx.handoverRef}</p>
                          <p className="text-[11px] text-sage">{tx.recyclerName} • {formatINR(tx.finalPrice)}</p>
                          <div className="mt-2 flex gap-1.5">
                            <StatusPill status={tx.status} label={t(`status.${tx.status}`)} />
                            <StatusPill status={tx.paymentStatus} label={t(`status.${tx.paymentStatus}`)} />
                          </div>
                        </div>
                        <div className="text-center">
                          <QrBox value={`${typeof window !== "undefined" ? window.location.origin : ""}/verify/${tx.handoverRef}`} size={92} />
                          <p className="mt-1 text-[9px] font-bold text-sage">{t("handover.qr")}</p>
                        </div>
                      </div>
                      <Link href={`/verify/${tx.handoverRef}`} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-pine underline">
                        <Icon name="qr" size={13} /> Open verification page
                      </Link>
                    </section>
                  )}

                  {/* Traceability */}
                  <section>
                    <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-sage">{t("handover.trace")}</h3>
                    <ol className="space-y-0">
                      {STAGES.map((stage, i) => {
                        const ev = trace[lot.id]?.find((e) => e.stage === stage);
                        const done = !!ev;
                        return (
                          <li key={stage} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <span className={`flex h-6 w-6 items-center justify-center rounded-full ${done ? "bg-leaf text-white" : "bg-mint text-sage"}`}>
                                {done ? <Icon name="check" size={12} /> : <span className="text-[10px] font-bold">{i + 1}</span>}
                              </span>
                              {i < STAGES.length - 1 && <span className={`w-0.5 flex-1 ${done ? "bg-leaf" : "bg-[#dcebe0]"}`} style={{ minHeight: 14 }} />}
                            </div>
                            <div className="pb-3">
                              <p className={`text-xs font-bold ${done ? "text-ink" : "text-sage"}`}>{t(`trace.${stage}`)}</p>
                              {ev && <p className="text-[10px] text-sage">{new Date(ev.at).toLocaleString("en-IN")}{ev.ref ? ` • ${ev.ref}` : ""}</p>}
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </section>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
