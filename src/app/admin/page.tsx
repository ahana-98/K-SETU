"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  DemoTag,
  ErrorBox,
  Spinner,
  api,
} from "@/components/ui";
import { useLang, formatINR } from "@/lib/i18n";

type Stats = {
  byCategory?: {
    category: string;
    weight: number;
    count: number;
  }[];
  monthly?: {
    month: string;
    total: number;
    count: number;
  }[];
  payments?: {
    status: string;
    count: number;
  }[];
  collectorEarnings?: {
    collectorId: number;
    total: number;
  }[];
};

export default function AdminPage() {
  const { t } = useLang();

  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    setErr(null);

    api<Stats>("/admin/stats")
      .then(setStats)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const totalLots =
    stats?.byCategory?.reduce(
      (sum, item) => sum + Number(item.count || 0),
      0
    ) ?? 0;

  const totalWeight =
    stats?.byCategory?.reduce(
      (sum, item) => sum + Number(item.weight || 0),
      0
    ) ?? 0;

  const totalTransactions =
    stats?.monthly?.reduce(
      (sum, item) => sum + Number(item.count || 0),
      0
    ) ?? 0;

  const totalValue =
    stats?.monthly?.reduce(
      (sum, item) => sum + Number(item.total || 0),
      0
    ) ?? 0;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-forest">
            K-SETU Admin Dashboard
          </h1>
          <p className="mt-1 text-sm text-sage">
            Monitor platform activity, transactions and traceability.
          </p>
        </div>

        <DemoTag>DEMO DATA</DemoTag>
      </div>

      {err && <ErrorBox text={err} onRetry={load} />}

      {loading && (
        <div className="flex justify-center py-16 text-pine">
          <Spinner />
        </div>
      )}

      {!loading && stats && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-sage">
                Total lots
              </p>
              <p className="mt-2 text-2xl font-extrabold text-forest">
                {totalLots}
              </p>
            </Card>

            <Card className="p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-sage">
                E-waste collected
              </p>
              <p className="mt-2 text-2xl font-extrabold text-forest">
                {Math.round(totalWeight)} kg
              </p>
            </Card>

            <Card className="p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-sage">
                Transactions
              </p>
              <p className="mt-2 text-2xl font-extrabold text-forest">
                {totalTransactions}
              </p>
            </Card>

            <Card className="p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-sage">
                Transaction value
              </p>
              <p className="mt-2 text-2xl font-extrabold text-forest">
                {formatINR(totalValue)}
              </p>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/admin/records" className="block">
              <Card className="h-full p-5 transition hover:-translate-y-0.5 hover:shadow-md">
                <h2 className="font-extrabold text-forest">
                  Records
                </h2>
                <p className="mt-1 text-sm text-sage">
                  View collectors, recyclers, lots, transactions, prices and traceability.
                </p>
              </Card>
            </Link>

            <Link href="/admin/analytics" className="block">
              <Card className="h-full p-5 transition hover:-translate-y-0.5 hover:shadow-md">
                <h2 className="font-extrabold text-forest">
                  Analytics
                </h2>
                <p className="mt-1 text-sm text-sage">
                  Review material, transaction, payment and earnings analytics.
                </p>
              </Card>
            </Link>

            <Link href="/admin/insights" className="block">
              <Card className="h-full p-5 transition hover:-translate-y-0.5 hover:shadow-md">
                <h2 className="font-extrabold text-forest">
                  Insights
                </h2>
                <p className="mt-1 text-sm text-sage">
                  Review operational insights and platform-level findings.
                </p>
              </Card>
            </Link>

            <Link href="/admin/system" className="block">
              <Card className="h-full p-5 transition hover:-translate-y-0.5 hover:shadow-md">
                <h2 className="font-extrabold text-forest">
                  System
                </h2>
                <p className="mt-1 text-sm text-sage">
                  Check system information and administrative controls.
                </p>
              </Card>
            </Link>
          </div>

          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-extrabold text-forest">
                  Platform overview
                </h2>
                <p className="mt-1 text-xs text-sage">
                  Current aggregates from the K-SETU API/database.
                </p>
              </div>

              <Link
                href="/admin/analytics"
                className="rounded-full bg-forest px-4 py-2 text-xs font-bold text-white hover:opacity-90"
              >
                Open analytics
              </Link>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg bg-mint p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-sage">
                  Material categories
                </p>
                <p className="mt-2 text-xl font-extrabold text-forest">
                  {stats.byCategory?.length ?? 0}
                </p>
              </div>

              <div className="rounded-lg bg-mint p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-sage">
                  Payment states
                </p>
                <p className="mt-2 text-xl font-extrabold text-forest">
                  {stats.payments?.length ?? 0}
                </p>
              </div>

              <div className="rounded-lg bg-mint p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-sage">
                  Reporting months
                </p>
                <p className="mt-2 text-xl font-extrabold text-forest">
                  {stats.monthly?.length ?? 0}
                </p>
              </div>
            </div>
          </Card>
        </>
      )}

      {!loading && !stats && !err && (
        <Card className="p-8 text-center">
          <p className="text-sm text-sage">
            No dashboard data available.
          </p>
        </Card>
      )}
    </div>
  );
}