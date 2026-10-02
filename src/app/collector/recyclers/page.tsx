"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Btn, Card, DemoTag, Empty, ErrorBox, Icon, Spinner, useToast } from "@/components/ui";
import { useLang, formatINR } from "@/lib/i18n";
import { api } from "@/components/ui";
import { cacheGet, cacheSet } from "@/lib/offline";
import IndiaRecyclerMap from "@/components/IndiaRecyclerMap";

type Rec = { recyclerUserId: number; name: string; facilityLocation: string; serviceArea: string; authorizationStatus: string; contact: string; pickupAvailable: boolean; offeredRate: number; materialsAccepted: string[]; score: number; reasons: string[] };
type Lot = {
  id: number;
  lotCode: string;
  category: string;
  weightKg: number;
  status: string;
  collectionLocation?: string;
};

const CATS = ["PCB", "Cables", "Copper", "LCD/LED Panels", "Batteries", "CRT", "Motors", "Aluminium", "Mixed Plastics", "Magnet-bearing Assemblies", "Other E-Waste"];

export default function RecyclersPage() {
  const { t } = useLang();
  const { push } = useToast();
  const [category, setCategory] = useState("PCB");
  const [location, setLocation] = useState("Pune");
  const [recs, setRecs] = useState<Rec[]>([]);
  const [mapRecs, setMapRecs] = useState<Rec[]>([]);
  const [myLots, setMyLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [quoteFor, setQuoteFor] = useState<Rec | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

 const load = useCallback(() => {
  setLoading(true);
  setErr(null);

  const locations = ["Pune", "Mumbai", "Nashik", "Nagpur", "Thane"];

  // Offline: load the selected location from its cache.
  if (!navigator.onLine) {
    const cached = cacheGet<Rec[]>(
      `recyclers_${category}_${location}`
    );

    if (cached) {
      setRecs(cached);
      setLoading(false);
      return;
    }

    setRecs([]);
    setLoading(false);
    setErr(t("login.serverDown"));
    return;
  }

  // Online: fetch the selected location normally.
Promise.all([
  api<any>(
    `/recyclers?category=${encodeURIComponent(category)}&location=${location}`
  ),
  api<Lot[]>("/lots"),
  api<any>("/recyclers"),
])    .then(async ([r, lots, all]) => {
  setRecs(r.recyclers);
  setMapRecs(all.recyclers ?? []);

      // Cache the selected location.
      cacheSet(
        `recyclers_${category}_${location}`,
        r.recyclers
      );
const openLots = lots.filter((l) =>
  ["open", "quoted"].includes(l.status)
);

setMyLots(openLots);

const gpsLocation = openLots[0]?.collectionLocation;

if (gpsLocation) {
  setLocation(gpsLocation);
}

      // Also pre-cache all locations for this material.
      await Promise.all(
        locations
          .filter((l) => l !== location)
          .map(async (l) => {
            try {
              const data = await api<any>(
                `/recyclers?category=${encodeURIComponent(category)}&location=${l}`
              );

              cacheSet(
                `recyclers_${category}_${l}`,
                data.recyclers
              );
            } catch {
              // Keep the existing cache if this location fails.
            }
          })
      );
    })
    .catch(() => {
      const cached = cacheGet<Rec[]>(
        `recyclers_${category}_${location}`
      );

      if (cached) {
        setRecs(cached);
      } else {
        setErr(t("login.serverDown"));
      }
    })
    .finally(() => setLoading(false));
}, [category, location, t]);
 // eslint-disable-next-line react-hooks/set-state-in-effect
useEffect(load, [load]);

async function request(lot: Lot, rec: Rec) {
  setBusy(lot.id);
  try {
    await api(`/lots/${lot.id}/request-quote`, {
      method: "POST",
      body: JSON.stringify({
        recyclerUserId: rec.recyclerUserId,
      }),
    });

    // Update only the lot that was selected.
    setMyLots((prev) =>
      prev.map((item) =>
        item.id === lot.id
          ? { ...item, status: "open" }
          : item
      )
    );

    push(`${t("lot.requested")} — ${rec.name}`, "ok");
    setQuoteFor(null);
  } catch (e: any) {
    push(e.message, "danger");
  } finally {
    setBusy(null);
  }
}
const matchingLots = quoteFor
  ? myLots.filter((lot) =>
      quoteFor.materialsAccepted.some(
        (material) =>
          material.trim().toLowerCase() ===
          lot.category.trim().toLowerCase()
      )
    )
  : [];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-forest">{t("rec.title")}</h1>
        <DemoTag>{t("rec.sample")}</DemoTag>
      </div>

      <Card className="space-y-2.5 p-3.5">
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sage">{t("rec.material")}</span>
          <select className="w-full rounded-lg border border-[#cfe0d4] bg-white px-3 py-2 text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
         {Array.from(
  new Set([
    "Pune",
    "Mumbai",
    "Nashik",
    "Nagpur",
    "Thane",
    ...(location ? [location] : []),
  ])
).map((l) => (
  <button
    key={l}
    onClick={() => setLocation(l)}
    className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold ${
      location === l ? "bg-pine text-white" : "bg-mint text-sage"
    }`}
  >
    {l}
  </button>
))}
        </div>
      </Card>
      {!loading && mapRecs.length > 0 && (
  <IndiaRecyclerMap recyclers={mapRecs} />
)}

      {err && <ErrorBox text={err} onRetry={load} />}
      {loading && <div className="flex justify-center py-8 text-pine"><Spinner /></div>}

      {!loading && !recs.length && !err && <Empty icon="factory" text={t("common.noData")} />}

      <div className="space-y-3">
        {recs.map((r, i) => (
          <Card key={r.recyclerUserId} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-ink">{r.name}</p>
                <p className="flex items-center gap-1 text-[11px] text-sage"><Icon name="pin" size={12} /> {r.facilityLocation} • {r.serviceArea}</p>
              </div>
              <div className="text-right">
                <span className="rounded-md bg-mint px-2 py-0.5 text-[11px] font-extrabold text-forest">{t("rec.matchScore")} {r.score}</span>
                {i === 0 && <p className="mt-1 text-[10px] font-bold text-leaf">BEST MATCH</p>}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {r.authorizationStatus === "demo_authorized"
                ? <Badge tone="ok"><Icon name="check" size={11} /> {t("rec.verified")}</Badge>
                : <Badge tone="warn">AUTH PENDING</Badge>}
              <Badge tone="neutral">{r.pickupAvailable ? t("rec.pickup") : t("rec.noPickup")}</Badge>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {r.materialsAccepted.slice(0, 4).map((m) => (
                <span key={m} className="rounded bg-mint px-1.5 py-0.5 text-[10px] font-semibold text-sage">{m}</span>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-sage">{t("rec.rate")}</p>
                <p className="text-lg font-extrabold text-forest">{formatINR(r.offeredRate)} <span className="text-[10px] text-sage">{t("common.perKg")}</span></p>
              </div>
              </div>
<Btn
  size="sm"
  disabled={busy !== null || myLots.length === 0}
  onClick={() => setQuoteFor(r)}
>
  {t("rec.requestQuote")}
</Btn>          </Card>
        ))}
      </div>

      {/* Request quote sheet */}
      {quoteFor && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-forest/50 p-0 sm:items-center sm:p-4" onClick={() => setQuoteFor(null)}>
          <div className="rise w-full max-w-md rounded-t-2xl bg-white p-5 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-extrabold text-forest">{t("rec.requestQuote")} — {quoteFor.name}</h3>
              <button onClick={() => setQuoteFor(null)} className="text-sage"><Icon name="x" size={18} /></button>
            </div>
            {matchingLots.length ? (
              <div className="max-h-72 space-y-2 overflow-y-auto">
                {matchingLots.map((l) => (
                  <div key={l.id} className="flex items-center justify-between rounded-lg border border-[#dcebe0] bg-mint p-3">
                    <div>
                      <p className="text-sm font-extrabold text-ink">{l.lotCode}</p>
                      <p className="text-[11px] text-sage">{l.category} • {l.weightKg} kg</p>
                    </div>
<Btn
  size="sm"
  disabled={busy !== null}
  onClick={() => request(l, quoteFor)}
>
  {busy === l.id ? <Spinner /> : t("rec.requestQuote")}
</Btn>                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3 text-center">
                <p className="text-sm text-sage">No lots yet. Create a lot first to request a quote.</p>
                <Link href="/collector/sell"><Btn full><Icon name="plus" size={16} /> {t("sell.create")}</Btn></Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
