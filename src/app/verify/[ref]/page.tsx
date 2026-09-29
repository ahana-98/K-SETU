"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Badge, Card, Icon, Logo, Spinner, StatusPill } from "@/components/ui";
import { useLang, formatINR } from "@/lib/i18n";

type VerifyData = {
  tx: { handoverRef: string; txCode: string; finalPrice: number; paymentStatus: string; paymentMethod: string; status: string; createdAt: string; handoverLocation: string | null };
  lot: { lotCode: string; category: string; weightKg: number } | null;
  recyclerName: string;
};

export default function VerifyPage() {
  const pathname = usePathname();
  const ref = decodeURIComponent(pathname.split("/").pop() || "");
  const { t } = useLang();
  const [data, setData] = useState<VerifyData | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    fetch(`/api/verify?ref=${encodeURIComponent(ref)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        setData(d);
        setState("ok");
      })
      .catch(() => setState("error"));
  }, [ref]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-5 flex justify-center"><Logo size={56} withWordmark /></div>
        <Card className="p-6">
          {state === "loading" && <div className="flex justify-center py-10 text-pine"><Spinner /></div>}
          {state === "error" && (
            <div className="py-6 text-center">
              <span className="mx-auto mb-3 block w-fit text-danger"><Icon name="alert" size={32} /></span>
              <p className="font-bold text-ink">{t("verify.notFound")}</p>
              <p className="mt-1 text-sm text-sage">{ref}</p>
            </div>
          )}
          {state === "ok" && data && (
            <div className="rise">
              <div className="flex items-center justify-between">
                <h1 className="text-base font-extrabold text-forest">{t("verify.title")}</h1>
                <Badge tone="ok"><Icon name="check" size={12} /> VERIFIED</Badge>
              </div>
              <dl className="mt-4 space-y-2 text-sm">
                {[
                  ["Reference ID", data.tx.handoverRef],
                  ["Lot ID", data.lot?.lotCode ?? "—"],
                  ["Material", data.lot?.category ?? "—"],
                  ["Weight", `${data.lot?.weightKg ?? 0} kg`],
                  ["Recycler", data.recyclerName],
                  ["Final price", formatINR(data.tx.finalPrice)],
                  ["Handover location", data.tx.handoverLocation ?? "—"],
                  ["Date", new Date(data.tx.createdAt).toLocaleString("en-IN")],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 border-b border-[#eef4ef] pb-1.5">
                    <dt className="text-sage">{k}</dt>
                    <dd className="text-right font-bold text-ink">{v}</dd>
                  </div>
                ))}
                <div className="flex justify-between gap-3 pt-1">
                  <dt className="text-sage">Payment</dt>
                  <dd><StatusPill status={data.tx.paymentStatus} label={`${data.tx.paymentStatus.toUpperCase()} (${data.tx.paymentMethod.toUpperCase()})`} /></dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-sage">Transaction</dt>
                  <dd><StatusPill status={data.tx.status} label={data.tx.status.toUpperCase()} /></dd>
                </div>
              </dl>
              <p className="mt-4 text-[10px] text-sage">K-SETU traceability record • DEMO DATA • Collector personal details are not exposed.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
