"use client";
import { useCallback, useEffect, useState } from "react";
import { Card, DemoTag, ErrorBox, Icon, Spinner, Trend } from "@/components/ui";
import { useLang, formatINR, speak } from "@/lib/i18n";
import { api, CATEGORY_ICONS } from "@/components/ui";
import { LineChart } from "@/components/charts";
import { cacheGet, cacheSet, useOnline } from "@/lib/offline";

type Price = { category: string; location: string; buyingRate: number; minRate: number; maxRate: number; trend: string; updatedAt: string };
type Hist = { date: string; rate: number }[];

export default function PricesPage() {
  const { t, lang } = useLang();
  const online = useOnline();
  const [prices, setPrices] = useState<Price[]>([]);
  const [loc, setLoc] = useState("Pune");
  const [open, setOpen] = useState<string | null>(null);
  const [days, setDays] = useState(30);
  const [hist, setHist] = useState<Hist>([]);
  const [histLoading, setHistLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

 const load = useCallback(() => {
  setErr(null);

  // If offline, use cached prices immediately.
  if (!online) {
    const cached = cacheGet<Price[]>("prices");

    if (cached) {
      setPrices(cached);
      setFromCache(true);
      return;
    }

    setPrices([]);
    setFromCache(false);
    setErr(t("login.serverDown"));
    return;
  }

  // Online: fetch the latest prices and refresh the cache.
  api<any>(`/prices`)
    .then((d) => {
      setPrices(d.prices);
      cacheSet(`prices`, d.prices);
      setFromCache(false);
    })
    .catch(() => {
      // Server unavailable: fall back to cached prices.
      const cached = cacheGet<Price[]>("prices");

      if (cached) {
        setPrices(cached);
        setFromCache(true);
      } else {
        setErr(t("login.serverDown"));
      }
    });
}, [online, t]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
useEffect(load, [load]);
  const filtered = prices.filter((p) => p.location === loc);
  const shown = filtered.length ? filtered : prices;

  useEffect(() => {
  if (!open) return;
  // eslint-disable-next-line react-hooks/set-state-in-effect
  setHistLoading(true);
    api<any>(`/prices/history?category=${encodeURIComponent(open)}&location=${loc}&days=${days}`)
      .then((d) => setHist(d.history))
      .catch(() => setHist([]))
      .finally(() => setHistLoading(false));
  }, [open, days, loc]);

  function listen(p: Price) {
    const nums = new Intl.NumberFormat("en-IN").format(p.buyingRate);
    const text = lang === "en" ? `${p.category} price is approximately ${nums} rupees per kilogram.` :t("price.speak", {
            category: p.category,
            rate: nums,
          });
    speak(text, lang);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-forest">{t("price.title")}</h1>
        <DemoTag>{t("common.indicative")} / {t("common.demoData")}</DemoTag>
      </div>
      {!online && <p className="rounded-lg bg-warnbg px-3 py-1.5 text-[11px] font-bold text-warn">Offline — showing cached prices</p>}
      {fromCache && <p className="rounded-lg bg-warnbg px-3 py-1.5 text-[11px] font-bold text-warn">Cached prices (server unavailable)</p>}

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {["Pune", "Mumbai", "Nashik", "Nagpur", "Thane"].map((l) => (
          <button key={l} onClick={() => setLoc(l)} className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold ${loc === l ? "bg-pine text-white" : "bg-mint text-sage"}`}>{l}</button>
        ))}
      </div>

      {err && <ErrorBox text={err} onRetry={load} />}

      <div className="space-y-2.5">
        {shown.map((p) => (
          <Card key={p.category + p.location} tint={open === p.category} className="overflow-hidden">
            <button className="flex w-full items-center gap-3 p-3.5 text-left" onClick={() => setOpen(open === p.category ? null : p.category)}>
              <span className="rounded-lg bg-white p-2 text-pine"><Icon name={CATEGORY_ICONS[p.category] ?? "box"} size={22} /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-ink">{p.category}</p>
                <p className="text-[11px] text-sage">{t("price.marketRange")}: ₹{p.minRate}–₹{p.maxRate} {t("common.perKg")}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-extrabold text-forest">₹{p.buyingRate}<span className="text-[10px] font-bold text-sage"> {t("common.perKg")}</span></p>
                <Trend dir={p.trend} />
              </div>
              <Icon name="chevronD" size={16} className={`text-sage transition ${open === p.category ? "rotate-180" : ""}`} />
            </button>
            {open === p.category && (
              <div className="rise border-t border-[#dcebe0] bg-white p-3.5">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex gap-1">
                    {[7, 30, 90].map((d) => (
                      <button key={d} onClick={() => setDays(d)} className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${days === d ? "bg-forest text-white" : "bg-mint text-sage"}`}>{d}d</button>
                    ))}
                  </div>
                  <button onClick={() => listen(p)} className="flex items-center gap-1.5 rounded-md bg-okbg px-2.5 py-1.5 text-[11px] font-bold text-leaf">
                    <Icon name="mic" size={13} /> {t("common.listen")}
                  </button>
                </div>
                {histLoading ? <div className="flex justify-center py-6 text-pine"><Spinner /></div> : (
                  <LineChart points={hist.map((h) => h.rate)} labels={hist.length ? [new Date(hist[0].date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }), new Date(hist[hist.length - 1].date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })] : []} />
                )}
                <p className="mt-1 text-[10px] text-sage">{t("price.rate")}: ₹{p.buyingRate} {t("common.perKg")} • {t("common.updated")}: {t("common.today")} • <DemoTag>DEMO DATA</DemoTag></p>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
