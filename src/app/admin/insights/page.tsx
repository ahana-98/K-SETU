"use client";
import { useCallback, useEffect, useState } from "react";
import { Btn, Card, DemoTag, Empty, Field, Icon, Spinner, inputCls, useToast } from "@/components/ui";
import { useLang, formatINR } from "@/lib/i18n";
import { api } from "@/components/ui";

const TABS = ["Unit Economics", "Datasets", "Safety"] as const;
type Tab = (typeof TABS)[number];

const UE_FIELDS: { key: string; label: string }[] = [
  { key: "avgTransactionValue", label: "Average collector transaction value (₹)" },
  { key: "formalChannelValue", label: "Potential formal-channel value (₹)" },
  { key: "platformOperatingCost", label: "Platform operating cost / tx (₹)" },
  { key: "transactionCost", label: "Transaction/service cost (₹)" },
  { key: "potentialPlatformRevenue", label: "Potential platform revenue / tx (₹)" },
  { key: "collectorBenefit", label: "Collector benefit / tx (₹)" },
];

export default function InsightsPage() {
  const { t } = useLang();
  const { push } = useToast();
  const [tab, setTab] = useState<Tab>("Unit Economics");
  const [ue, setUe] = useState<Record<string, any>>({});
  const [safety, setSafety] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

const load = useCallback(() => {
  setLoading(true);

  Promise.all([
    api<any[]>("/admin/settings"),
    api<any[]>("/safety?lang=en"),
  ])
    .then(([settings, safetyRows]) => {
      const ueRow = (settings as any[]).find(
        (s: any) => s.key === "unit_economics"
      );

      setUe(ueRow?.value ?? {});
      setSafety(safetyRows);
    })
    .catch(() => {})
    .finally(() => setLoading(false));
}, []);  // eslint-disable-next-line react-hooks/set-state-in-effect
useEffect(load, [load]);

  async function saveUe() {
    setBusy(true);
    try {
      await api("/admin/settings", { method: "POST", body: JSON.stringify({ key: "unit_economics", label: "Unit economics assumptions (DEMO DATA)", value: { ...ue, note: "ASSUMPTION — hypothetical values for prototype demonstration, not field research." } }) });
      push("Saved", "ok");
    } catch (e: any) {
      push(e.message, "danger");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-2xl font-extrabold text-forest">{t("admin.insights")}</h1>
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {TABS.map((x) => (
          <button key={x} onClick={() => setTab(x)} className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold ${tab === x ? "bg-forest text-white" : "bg-mint text-sage"}`}>{x}</button>
        ))}
      </div>
      {loading && <div className="flex justify-center py-10 text-pine"><Spinner /></div>}

      {!loading && tab === "Unit Economics" && (
        <Card className="space-y-3 p-5">
          <p className="flex items-center gap-2 text-xs font-bold text-warn"><Icon name="alert" size={14} /> All values are ASSUMPTION / DEMO DATA — not field research.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {UE_FIELDS.map((f) => (
              <Field key={f.key} label={f.label}>
                <input className={inputCls} type="number" value={ue[f.key] ?? 0} onChange={(e) => setUe((s) => ({ ...s, [f.key]: Number(e.target.value) }))} />
              </Field>
            ))}
          </div>
          <div className="rounded-lg bg-mint p-3 text-sm">
            <p className="font-bold text-forest">Collector benefit vs formal channel: {formatINR(Number(ue.collectorBenefit ?? 0))} / tx</p>
            <p className="text-[11px] text-sage">Hypothetical uplift if informal collectors sell through authorized recyclers via K-SETU.</p>
          </div>
          <Btn onClick={saveUe} disabled={busy}>{busy ? <Spinner /> : <Icon name="check" size={15} />} Save assumptions</Btn>
        </Card>
      )}

      {!loading && tab === "Datasets" && (
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["materials.csv", "Material categories + demo lot features", "ml/datasets/materials.csv"],
            ["prices.csv", "Indicative price history (synthetic)", "ml/datasets/prices.csv"],
            ["transactions.csv", "Demo transactions for anomaly prototype", "ml/datasets/transactions.csv"],
            ["recyclers.csv", "Sample recycler directory", "ml/datasets/recyclers.csv"],
          ].map(([name, desc, path]) => (
            <Card key={name} className="p-4">
              <p className="flex items-center gap-2 text-sm font-extrabold text-forest"><Icon name="box" size={16} /> {name}</p>
              <p className="mt-1 text-xs text-sage">{desc}</p>
              <p className="mt-1 text-[10px] text-sage">/{path} • SYNTHETIC / DEMO DATA</p>
            </Card>
          ))}
        </div>
      )}

      {!loading && tab === "Safety" && (
        <div className="grid gap-3 sm:grid-cols-2">
          {safety.map((s) => (
            <Card key={s.id} className="flex items-start gap-3 p-4">
              <span className="rounded-full bg-mint p-2.5 text-pine"><Icon name={s.iconKey} size={20} /></span>
              <div>
                <p className="text-sm font-extrabold text-ink">{s.title}</p>
                <p className="mt-0.5 text-xs text-sage">{s.body}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
