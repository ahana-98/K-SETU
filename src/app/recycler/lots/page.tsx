"use client";
import { useCallback, useEffect, useState } from "react";
import { Btn, Card, DemoTag, Empty, ErrorBox, Field, Icon, Spinner, StatusPill, inputCls, useToast } from "@/components/ui";
import { useLang, formatINR } from "@/lib/i18n";
import { api, CATEGORY_ICONS } from "@/components/ui";

type Lot = { id: number; lotCode: string; category: string; weightKg: number; condition: string; status: string; collectionLocation: string; estimatedValue: number; createdAt: string; imageData: string | null; description: string | null };
type Quote = { id: number; lotId: number; status: string; ratePerKg: number };

export default function IncomingLotsPage() {
  const { t } = useLang();
  const { push } = useToast();
  const [lots, setLots] = useState<Lot[]>([]);
  const [myQuotes, setMyQuotes] = useState<Quote[]>([]);
  const [open, setOpen] = useState<number | null>(null);
  const [rate, setRate] = useState("");
  const [pickup, setPickup] = useState(true);
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setErr(null);
    Promise.all([api<Lot[]>("/lots"), api<Quote[]>("/quotes")])
      .then(([l, q]) => {
        setLots(l);
        setMyQuotes(q);
      })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);
useEffect(() => {
  const runLoad = () => {
    load();
  };

  const firstLoad = setTimeout(runLoad, 0);

  const interval = setInterval(runLoad, 5000);

  return () => {
    clearTimeout(firstLoad);
    clearInterval(interval);
  };
}, [load]);  async function submit() {
    if (!open) return;
    if (!(Number(rate) > 0)) {
      push("Rate must be positive", "danger");
      return;
    }
    setBusy(true);
    try {
      await api("/quotes", { method: "POST", body: JSON.stringify({ lotId: open, ratePerKg: Number(rate), pickupAvailable: pickup, notes }) });
      push(`${t("recy.submitQuote")} ✓`, "ok");
setOpen(null);
setRate("");
setNotes("");
load();
    } catch (e: any) {
      push(e.message, "danger");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-forest">{t("recy.incoming")}</h1>
        <DemoTag>SAMPLE LOTS</DemoTag>
      </div>
      {err && <ErrorBox text={err} onRetry={load} />}
      {loading && <div className="flex justify-center py-10 text-pine"><Spinner /></div>}
      {!loading && !lots.length && !err && <Empty icon="box" text={t("common.noData")} />}

      <div className="grid gap-3 md:grid-cols-2">
        {lots.map((l) => {
          const quoted = myQuotes.find((q) => q.lotId === l.id && q.status === "pending");
          const isOpen = open === l.id;
          return (
            <Card key={l.id} className="overflow-hidden">
              <button className="flex w-full items-center gap-3 p-3.5 text-left" onClick={() => setOpen(isOpen ? null : l.id)}>
                {l.imageData ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.imageData} alt="" className="h-14 w-14 rounded-lg border border-[#dcebe0] object-cover" />
                ) : (
                  <span className="rounded-lg bg-mint p-3 text-pine"><Icon name={CATEGORY_ICONS[l.category] ?? "box"} size={24} /></span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold text-ink">{l.lotCode}</p>
                  <p className="text-[11px] text-sage">{l.category} • {l.weightKg} kg • {l.collectionLocation}</p>
                  <p className="text-[10px] text-sage">Condition: {l.condition} • Est. {formatINR(l.estimatedValue)}</p>
                </div>
                {quoted ? <StatusPill status="quoted" label="QUOTED" /> : <StatusPill status={l.status} label={t(`status.${l.status}`)} />}
              </button>
              {isOpen && (
                <div className="rise space-y-3 border-t border-[#dcebe0] bg-paper/60 p-4">
                  {l.description && <p className="text-[11px] text-sage">{l.description}</p>}
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={t("recy.rate")}>
                      <input className={inputCls} type="number" min="1" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} />
                    </Field>
                    <Field label={t("recy.notes")}>
                      <input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
                    </Field>
                  </div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <input type="checkbox" checked={pickup} onChange={(e) => setPickup(e.target.checked)} className="h-4 w-4 accent-pine" />
                    {t("rec.pickup")}
                  </label>
                  <p className="text-xs text-sage">≈ {formatINR(Number(rate || 0) * l.weightKg)} total</p>
                  <Btn full disabled={busy || !!quoted} onClick={submit}>
                    {busy ? <Spinner /> : <Icon name="receipt" size={16} />} {quoted ? "Quote already sent" : t("recy.submitQuote")}
                  </Btn>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
