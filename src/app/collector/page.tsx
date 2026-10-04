"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Card,
  DemoTag,
  Empty,
  ErrorBox,
  Icon,
  Stat,
  StatusPill,
} from "@/components/ui";
import { useLang, formatINR } from "@/lib/i18n";
import { api } from "@/components/ui";
import { getQueue, useOnline, type QueuedLot } from "@/lib/offline";

type Ledger = {
  id: number;
  category: string;
  amount: number;
  status: string;
  recyclerName: string;
  weightKg: number;
  createdAt: string;
};

type Lot = {
  id: number;
  lotCode: string;
  category: string;
  weightKg: number;
  status: string;
  estimatedValue: number;
  createdAt: string;
};

type Tx = {
  id: number;
  txCode: string;
  finalPrice: number;
  paymentStatus: string;
  status: string;
  recyclerName: string;
  createdAt: string;
};

function queuedLotToLot(lot: QueuedLot): Lot {
  return {
    id: 0,
    lotCode: `OFFLINE-${lot.id.slice(-6)}`,
    category: lot.category,
    weightKg: lot.weightKg,
    status: "pending",
    estimatedValue: lot.estimatedValue ?? 0,
    createdAt: new Date(lot.queuedAt).toISOString(),
  };
}

export default function CollectorHome() {
  const { t } = useLang();
  const online = useOnline();

  const [ledger, setLedger] = useState<Ledger[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);

    try {
      const [ledgerResult, lotsResult, txResult, sessionResult] =
        await Promise.allSettled([
          api<Ledger[]>("/ledger"),
          api<Lot[]>("/lots"),
          api<Tx[]>("/transactions"),
          fetch("/api/auth/session")
            .then((r) => r.json())
            .catch(() => null),
        ]);

      // Session can still work even when the database is unavailable.
      if (sessionResult.status === "fulfilled") {
        setName(sessionResult.value?.name ?? "");
      }

      const queuedLots = getQueue().map(queuedLotToLot);

      // Ledger
      if (ledgerResult.status === "fulfilled") {
        setLedger(ledgerResult.value);
        try {
          localStorage.setItem(
            "ksetu_cache_ledger",
            JSON.stringify(ledgerResult.value)
          );
        } catch {}
      } else {
        setLedger([]);
      }

      // Lots
      if (lotsResult.status === "fulfilled") {
        setLots([...queuedLots, ...lotsResult.value]);

        try {
          localStorage.setItem(
            "ksetu_cache_lots",
            JSON.stringify(lotsResult.value)
          );
        } catch {}
      } else {
        // Database unavailable → show offline queued lots.
        let cachedLots: Lot[] = [];

        try {
          const raw = localStorage.getItem("ksetu_cache_lots");
          if (raw) {
            cachedLots = JSON.parse(raw);
          }
        } catch {}

        setLots([...queuedLots, ...cachedLots]);
      }

      // Transactions
      if (txResult.status === "fulfilled") {
        setTxs(txResult.value);

        try {
          localStorage.setItem(
            "ksetu_cache_transactions",
            JSON.stringify(txResult.value)
          );
        } catch {}
      } else {
        setTxs([]);
      }

      /*
       * If we are offline or the database is unavailable,
       * don't show a database error on the dashboard.
       *
       * The user can continue working with locally saved data.
       */
      if (!online || lotsResult.status === "rejected") {
        setErr(null);
      }
    } catch (e) {
      console.error("Collector dashboard load failed:", e);

      // Last-resort offline fallback.
      const queuedLots = getQueue().map(queuedLotToLot);
      setLots(queuedLots);
      setLedger([]);
      setTxs([]);
      setErr(null);
    } finally {
      setLoading(false);
    }
  }, [online]);

useEffect(() => {
  const timer = window.setTimeout(() => {
    void load();
  }, 0);

  return () => window.clearTimeout(timer);
}, [load]);
  const total = ledger.reduce((a, x) => a + x.amount, 0);

  const pending = ledger
    .filter((x) => x.status === "pending")
    .reduce((a, x) => a + x.amount, 0);

  const actions = [
    {
      href: "/collector/sell",
      icon: "sell",
      label: t("home.sellCta"),
      tone: "bg-mint text-forest",
    },
    {
      href: "/collector/prices",
      icon: "chart",
      label: t("home.priceCta"),
      tone: "bg-mint text-forest",
    },
    {
      href: "/collector/recyclers",
      icon: "factory",
      label: t("home.recyclerCta"),
      tone: "bg-mint text-forest",
    },
    {
      href: "/collector/earnings",
      icon: "wallet",
      label: t("home.earningsCta"),
      tone: "bg-mint text-forest",
    },
    {
      href: "/collector/lots",
      icon: "box",
      label: t("home.lotsCta"),
      tone: "bg-mint text-forest",
    },
    {
      href: "/collector/safety",
      icon: "shield",
      label: t("home.safetyCta"),
      tone: "bg-mint text-forest",
    },
    {
      href: "/collector/guidelines",
      icon: "receipt",
      label: t("home.guidelinesCta"),
      tone: "bg-mint text-forest",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl bg-linear-to-br from-forest to-pine p-5 text-white shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/70">
              K-SETU • Collector Portal
            </p>

            <h1 className="text-2xl font-extrabold leading-tight">
              {t("home.greeting")}, {name.split(" ")[0] || "Collector"}
            </h1>

            <p className="mt-2 text-sm leading-relaxed text-white/80">
              {t("app.tagline")}
            </p>
          </div>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl">
            ♻️
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat
          label={t("home.totalEarnings")}
          value={formatINR(total)}
          icon="wallet"
        />

        <Stat
          label={t("home.pending")}
          value={formatINR(pending)}
          icon="clock"
          tone="warn"
        />
      </div>

      <section>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-sage">
          {t("home.quickActions")}
        </h2>

        <div className="grid grid-cols-3 gap-2.5">
          {actions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className={`${a.tone} flex min-h-28 flex-col items-center justify-center gap-3 rounded-2xl px-3 py-5 text-center shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95`}
            >
              <span className={a.icon === "sell" ? "text-leaf" : ""}>
                <Icon name={a.icon} size={26} />
              </span>

              <span className="text-[11px] font-extrabold leading-tight">
                {a.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {err && <ErrorBox text={err} onRetry={load} />}

      {loading && (
        <div className="grid grid-cols-1 gap-3">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl bg-mint"
            />
          ))}
        </div>
      )}

      {!loading && (
        <>
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-widest text-sage">
                {t("home.recentLot")}
              </h2>

              <Link
                href="/collector/lots"
                className="text-xs font-bold text-pine"
              >
                {t("common.viewDetails")}
              </Link>
            </div>

            {lots[0] ? (
              <Card tint className="flex items-center gap-3 p-3.5">
                <span className="rounded-lg bg-white p-2.5 text-pine">
                  <Icon name="box" size={24} />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold text-ink">
                    {lots[0].lotCode} • {lots[0].category}
                  </p>

                  <p className="text-xs text-sage">
                    {lots[0].weightKg} kg •{" "}
                    {formatINR(lots[0].estimatedValue)} •{" "}
                    {new Date(lots[0].createdAt).toLocaleDateString("en-IN")}
                  </p>
                </div>

                <StatusPill
                  status={lots[0].status}
                  label={t(`status.${lots[0].status}`)}
                />
              </Card>
            ) : (
              <Empty icon="box" text={t("common.noData")} />
            )}
          </section>

          <section>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-sage">
              {t("home.recentTx")}
            </h2>

            {txs[0] ? (
              <Card className="flex items-center gap-3 p-3.5">
                <span className="rounded-lg bg-okbg p-2.5 text-leaf">
                  <Icon name="receipt" size={22} />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold text-ink">
                    {txs[0].recyclerName}
                  </p>

                  <p className="text-xs text-sage">
                    {txs[0].txCode} • {formatINR(txs[0].finalPrice)}
                  </p>
                </div>

                <StatusPill
                  status={txs[0].paymentStatus}
                  label={t(`status.${txs[0].paymentStatus}`)}
                />
              </Card>
            ) : (
              <Empty icon="receipt" text={t("common.noData")} />
            )}
          </section>

          {pending > 0 && (
            <Card className="flex items-center gap-3 border-warn/30 bg-warnbg p-3.5">
              <span className="text-warn">
                <Icon name="clock" size={22} />
              </span>

              <div className="flex-1">
                <p className="text-sm font-extrabold text-warn">
                  {t("home.pendingPayment")}
                </p>

                <p className="text-xs text-warn/80">
                  {formatINR(pending)}
                </p>
              </div>

              <Link
                href="/collector/earnings"
                className="text-xs font-bold text-warn underline"
              >
                {t("common.viewDetails")}
              </Link>
            </Card>
          )}
        </>
      )}

      <p className="pt-1 text-center text-[10px] text-sage">
        <DemoTag>DEMO DATA</DemoTag> Prototype build for SIH 2026 demonstration.
      </p>
    </div>
  );
}