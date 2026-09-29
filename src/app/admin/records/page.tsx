"use client";
import { useCallback, useEffect, useState } from "react";
import { Btn, Card, Empty, ErrorBox, Icon, Spinner, StatusPill, inputCls } from "@/components/ui";
import { useLang, formatINR } from "@/lib/i18n";
import { api } from "@/components/ui";

const TABS = ["Collectors", "Recyclers", "Lots", "Transactions", "Prices", "Traceability", "Metal Conservation"] as const;
type Tab = (typeof TABS)[number];

function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[#dcebe0]">
      <table className="w-full min-w-[640px] text-left text-xs">
        <thead className="bg-forest text-white">
          <tr>{head.map((h) => <th key={h} className="px-3 py-2 font-bold">{h}</th>)}</tr>
        </thead>
        <tbody className="bg-white">
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-[#eef4ef] odd:bg-paper">
              {r.map((c, j) => <td key={j} className="px-3 py-2 text-ink">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RecordsPage() {
  const { t } = useLang();
  const [tab, setTab] = useState<Tab>("Collectors");
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [traceLot, setTraceLot] = useState("");
  const [trace, setTrace] = useState<any[] | null>(null);
  const [metalLotId, setMetalLotId] = useState("");
const [metalRecords, setMetalRecords] = useState<any[] | null>(null);
const [metalLoading, setMetalLoading] = useState(false);
const [metalError, setMetalError] = useState<string | null>(null);
const [recoveryInputs, setRecoveryInputs] = useState<Record<number, string>>({});
const [savingRecoveryId, setSavingRecoveryId] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setErr(null);
    const ep =
      tab === "Collectors" ? "/admin/collectors"
      : tab === "Recyclers" ? "/admin/recyclers"
      : tab === "Lots" ? "/lots"
      : tab === "Transactions" ? "/transactions"
      : tab === "Prices" ? "/prices"
      : null;
    if (!ep) { setLoading(false); return; }
    api<any>(ep).then((d) => setData(Array.isArray(d) ? d : d.prices ?? d)).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  }, [tab]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
useEffect(load, [load]);

async function loadTrace() {
  if (!traceLot.trim()) return;
  setTrace(null);

  try {
    const ref = traceLot.trim();
    setTrace(await api<any[]>(`/traceability/${encodeURIComponent(ref)}`));
  } catch {
    setTrace([]);
  }
}
async function loadMetalConservation() {
  if (!metalLotId.trim()) {
    setMetalError("Please enter a lot ID.");
    setMetalRecords(null);
    return;
  }
  async function saveMetalRecovery(id: number) {
  const value = recoveryInputs[id];

  if (value === undefined || value.trim() === "") {
    setMetalError("Please enter the recovered weight.");
    return;
  }

  const recoveredKg = Number(value);

  if (!Number.isFinite(recoveredKg) || recoveredKg < 0) {
    setMetalError("Enter a valid non-negative recovered weight.");
    return;
  }

  setSavingRecoveryId(id);
  setMetalError(null);

  try {
    const response = await fetch("/api/metal-conservation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ id, recoveredKg }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error ?? "Failed to save recovered weight.");
    }

    await loadMetalConservation();
  } catch (error) {
    setMetalError(
      error instanceof Error
        ? error.message
        : "Failed to save recovered weight."
    );
  } finally {
    setSavingRecoveryId(null);
  }
}

  setMetalLoading(true);
  setMetalError(null);
  setMetalRecords(null);

  try {
    const result = await api<{ records: any[] }>(
      `/metal-conservation?lotId=${encodeURIComponent(metalLotId.trim())}`
    );
    setMetalRecords(result.records ?? []);
  } catch (e: any) {
    setMetalError(e.message ?? "Failed to load metal conservation records.");
  } finally {
    setMetalLoading(false);
  }
}
async function saveMetalRecovery(id: number) {
  const value = recoveryInputs[id];

  if (value === undefined || value.trim() === "") {
    setMetalError("Please enter the recovered weight.");
    return;
  }

  const recoveredKg = Number(value);

  if (!Number.isFinite(recoveredKg) || recoveredKg < 0) {
    setMetalError("Enter a valid non-negative recovered weight.");
    return;
  }

  setSavingRecoveryId(id);
  setMetalError(null);

  try {
    const response = await fetch("/api/metal-conservation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ id, recoveredKg }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error ?? "Failed to save recovered weight.");
    }

    await loadMetalConservation();
  } catch (error) {
    setMetalError(
      error instanceof Error
        ? error.message
        : "Failed to save recovered weight."
    );
  } finally {
    setSavingRecoveryId(null);
  }
}

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <h1 className="text-2xl font-extrabold text-forest">{t("admin.records")}</h1>
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {TABS.map((x) => (
          <button key={x} onClick={() => setTab(x)} className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold ${tab === x ? "bg-forest text-white" : "bg-mint text-sage"}`}>{x}</button>
        ))}
      </div>
      {err && <ErrorBox text={err} onRetry={load} />}
      {loading && <div className="flex justify-center py-10 text-pine"><Spinner /></div>}

      {!loading && tab === "Collectors" && (
        data?.length ? <Table head={["ID", "Name", "Email", "Location", "Lots", "Earned"]} rows={data.map((c: any) => [c.id, c.name, c.email, c.profile?.generalLocation ?? "—", c.lotCount, formatINR(c.totalEarned)])} /> : <Empty text={t("common.noData")} />
      )}
      {!loading && tab === "Recyclers" && (
        data?.length ? <Table head={["Name", "Location", "Service area", "Authorization", "Pickup", "Materials"]} rows={data.map((r: any) => [r.name, r.facilityLocation, r.serviceArea, r.authorizationStatus, r.pickupAvailable ? "Yes" : "No", (r.materialsAccepted ?? []).join(", ")])} /> : <Empty text={t("common.noData")} />
      )}
      {!loading && tab === "Lots" && (
        data?.length ? <Table head={["Lot", "Category", "Kg", "Condition", "Location", "Est.", "Status", "Date"]} rows={data.map((l: any) => [l.lotCode, l.category, l.weightKg, l.condition, l.collectionLocation, formatINR(l.estimatedValue), <StatusPill key="s" status={l.status} label={l.status} />, new Date(l.createdAt).toLocaleDateString("en-IN")])} /> : <Empty text={t("common.noData")} />
      )}
      {!loading && tab === "Transactions" && (
        data?.length ? <Table head={["Ref", "Lot", "Recycler", "Final", "Payment", "Status", "Date"]} rows={data.map((x: any) => [x.handoverRef, x.lot?.lotCode ?? "—", x.recyclerName, formatINR(x.finalPrice), String(x.paymentStatus ?? "unknown").toUpperCase(), <StatusPill key="s" status={x.status} label={x.status} />, new Date(x.createdAt).toLocaleDateString("en-IN")])} /> : <Empty text={t("common.noData")} />
      )}
      {!loading && tab === "Prices" && (
        data?.length ? <Table head={["Category", "Location", "Rate", "Range", "Trend"]} rows={data.map((p: any) => [p.category, p.location, `₹${p.buyingRate}/kg`, `₹${p.minRate}–₹${p.maxRate}`, p.trend])} /> : <Empty text={t("common.noData")} />
      )}
      {tab === "Traceability" && (
        <Card className="space-y-3 p-4">
          <div className="flex gap-2">
            <input className={inputCls} placeholder="Lot ID (e.g. 1)" value={traceLot} onChange={(e) => setTraceLot(e.target.value)} inputMode="numeric" />
            <Btn onClick={loadTrace}><Icon name="scan" size={15} /> Trace</Btn>
          </div>
          {trace && (trace.length ? (
            <ol className="space-y-2">
              {trace.map((e) => (
                <li key={e.id} className="flex items-center gap-3 rounded-lg bg-mint px-3 py-2 text-xs">
                  <span className="rounded-full bg-leaf p-1 text-white"><Icon name="check" size={10} /></span>
                  <span className="font-bold text-ink">{String(e.stage ?? "unknown").toUpperCase()}</span>
                  <span className="text-sage">{e.label}</span>
                  <span className="ml-auto text-sage">{new Date(e.at).toLocaleString("en-IN")}</span>
                </li>
              ))}
            </ol>
          ) : <Empty text="No trace events for this lot" />)}
        </Card>
      )}
      {tab === "Metal Conservation" && (
        <Card className="space-y-3 p-4">
          <h2 className="text-lg font-bold text-forest">
            Metal Conservation
          </h2>

          <p className="text-sm text-sage">
            Enter a lot ID to view estimated and recovered metals.
          </p>

          <div className="flex gap-2">
            <input
              className={inputCls}
              placeholder="Lot ID (e.g. 73)"
              value={metalLotId}
              onChange={(e) => setMetalLotId(e.target.value)}
              inputMode="numeric"
            />
            <Btn onClick={loadMetalConservation}>
              <Icon name="search" size={15} /> View
            </Btn>
          </div>

          {metalLoading && (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          )}

          {metalError && (
            <ErrorBox
              text={metalError}
              onRetry={loadMetalConservation}
            />
          )}

  {!metalLoading && !metalError && metalRecords && (
  metalRecords.length ? (
    <Table
      head={[
        "Metal",
        "Estimated (kg)",
        "Recovered (kg)",
        "Recovery rate",
        "Source",
        "Update recovery",
      ]}
      rows={metalRecords.map((r: any) => [
        r.metal,
        r.estimatedKg,
        r.recoveredKg,
        `${r.recoveryRate}%`,
        r.source,
        <div className="flex min-w-[180px] flex-col gap-2" key={r.id}>
          <input
            type="number"
            min="0"
            max={r.estimatedKg}
            step="0.001"
            value={recoveryInputs[r.id] ?? String(r.recoveredKg)}
            onChange={(e) =>
              setRecoveryInputs((prev) => ({
                ...prev,
                [r.id]: e.target.value,
              }))
            }
            placeholder="Recovered kg"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            aria-label={`Recovered ${r.metal} in kg`}
          />
          <button
            type="button"
            onClick={() => saveMetalRecovery(r.id)}
            disabled={savingRecoveryId === r.id}
            className="rounded-md bg-green-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {savingRecoveryId === r.id ? "Saving..." : "Save"}
          </button>
        </div>,
      ])}
    />
  ) : (
    <Empty text="No metal conservation records for this lot" />
  )
)}
        </Card>
      )}
    </div>
  );
}
