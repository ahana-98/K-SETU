"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Btn,
  Card,
  Empty,
  ErrorBox,
  Icon,
  Spinner,
  StatusPill,
  useToast,
} from "@/components/ui";
import { useLang, formatINR } from "@/lib/i18n";
import { api, CATEGORY_ICONS } from "@/components/ui";

type Tx = {
  id: number;
  handoverRef: string;
  finalPrice: number;
  paymentStatus: string;
  paymentMethod: string;
  status: string;
  collectionLocation: string;
  lot: {
    lotCode: string;
    category: string;
    weightKg: number;
    imageData: string | null;
  } | null;
};

export default function HandoversPage() {
  const { t } = useLang();
  const { push } = useToast();

  const [txs, setTxs] = useState<Tx[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [otp, setOtp] = useState<Record<number, string>>({});
  const [method, setMethod] = useState<Record<number, string>>({});

  const load = useCallback(() => {
    setLoading(true);
    setErr(null);

    api<Tx[]>("/transactions")
      .then((all) =>
        setTxs(all.filter((x) => ["active", "handover"].includes(x.status)))
      )
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(load, [load]);

  async function verifyOtp(txId: number) {
    const value = (otp[txId] || "").trim();

    if (!/^\d{6}$/.test(value)) {
      push("Enter the 6-digit handover OTP.", "danger");
      return;
    }

    setBusy(`${txId}-otp`);

    try {
      await api(`/handovers/${txId}/verify-otp`, {
        method: "POST",
        body: JSON.stringify({ otp: value }),
      });

      push("Handover verified successfully ✓", "ok");

      setOtp((s) => ({ ...s, [txId]: "" }));
      load();
    } catch (e: any) {
      push(e.message, "danger");
    } finally {
      setBusy(null);
    }
  }
  async function confirmPickup(txId: number) {
  setBusy(`${txId}-pickup`);

  try {
    await api(`/handovers/${txId}/confirm-pickup`, {
      method: "POST",
    });

    push("Pickup from collector confirmed ✓", "ok");
    load();
  } catch (e: any) {
    push(e.message, "danger");
  } finally {
    setBusy(null);
  }
}

  async function recordPayment(txId: number) {
    setBusy(`${txId}-payment`);

    try {
      await api(`/handovers/${txId}/payment`, {
        method: "POST",
        body: JSON.stringify({
          method: method[txId] || "cash",
        }),
      });

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
      <h1 className="text-xl font-extrabold text-forest">
        {t("recy.handovers")}
      </h1>

      {err && <ErrorBox text={err} onRetry={load} />}

      {loading && (
        <div className="flex justify-center py-10 text-pine">
          <Spinner />
        </div>
      )}

      {!loading && !txs.length && !err && (
        <Empty
          icon="truck"
          text="No active handovers. Accept a quote flow from a collector to begin."
        />
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {txs.map((tx) => (
          <Card key={tx.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-mint p-2.5 text-pine">
                  <Icon
                    name={CATEGORY_ICONS[tx.lot?.category ?? ""] ?? "box"}
                    size={22}
                  />
                </span>

                <div>
                  <p className="text-sm font-extrabold text-forest">
                    {tx.handoverRef}
                  </p>

                  <p className="text-[11px] text-sage">
                    {tx.lot?.lotCode} • {tx.lot?.category} •{" "}
                    {tx.lot?.weightKg} kg
                  </p>
                </div>
              </div>

              <StatusPill
                status={tx.status}
                label={t(`status.${tx.status}`)}
              />
            </div>

            <p className="mt-2 text-sm font-extrabold text-ink">
              {formatINR(tx.finalPrice)}
              <span className="text-[10px] font-semibold text-sage">
                {" "}
                • {tx.collectionLocation}
              </span>
            </p>

            <div className="mt-3 space-y-3">
              {/* OTP verification */}
              {tx.status === "active" && (
                <div className="rounded-lg border-2 border-dashed border-forest bg-mint p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-sage">
                    Handover OTP
                  </p>

                  <p className="mt-1 text-xs text-sage">
                    Ask the collector for the 6-digit OTP shown on their
                    handover receipt.
                  </p>

                  <div className="mt-2 flex gap-2">
                    <input
                      inputMode="numeric"
                      maxLength={6}
                      value={otp[tx.id] || ""}
                      onChange={(e) =>
                        setOtp((s) => ({
                          ...s,
                          [tx.id]: e.target.value.replace(/\D/g, ""),
                        }))
                      }
                      placeholder="Enter 6-digit OTP"
                      className="min-w-0 flex-1 rounded-md border border-[#cfe0d4] bg-white px-3 py-2 text-center text-sm font-extrabold tracking-[0.25em] text-forest outline-none focus:border-forest"
                    />

                    <Btn
                      size="sm"
                      disabled={busy !== null}
                      onClick={() => verifyOtp(tx.id)}
                    >
                      {busy === `${tx.id}-otp` ? (
                        <Spinner />
                      ) : (
                        <Icon name="check" size={14} />
                      )}
                      Verify
                    </Btn>
                  </div>

                  <p className="mt-2 text-[10px] text-sage">
                    OTP expires after 5 minutes and is limited to 5 attempts.
                  </p>
                </div>
              )}

              {/* Payment */}
{/* Pickup + Payment */}
{tx.status === "handover" && (
  <div className="rounded-lg bg-mint p-3 space-y-3">
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-sage">
        Pickup from Collector
      </p>

      <p className="mt-1 text-xs text-sage">
        The handover OTP has been verified. Confirm that the lot has been
        picked up from the collector before recording payment.
      </p>

      <Btn
        className="mt-2 w-full"
        size="sm"
        disabled={busy !== null}
        onClick={() => confirmPickup(tx.id)}
      >
        {busy === `${tx.id}-pickup` ? (
          <Spinner />
        ) : (
          <Icon name="truck" size={14} />
        )}
        Confirm Pickup from Collector
      </Btn>
    </div>

    <div className="border-t border-[#cfe0d4] pt-3">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-sage">
        Payment / Recycling
      </p>

      <div className="flex gap-2">
        <select
          className="flex-1 rounded-md border border-[#cfe0d4] bg-white px-2 py-1.5 text-xs"
          value={method[tx.id] || "cash"}
          onChange={(e) =>
            setMethod((s) => ({
              ...s,
              [tx.id]: e.target.value,
            }))
          }
        >
          <option value="cash">Cash</option>
          <option value="upi">UPI (demo)</option>
          <option value="other">Other</option>
        </select>

        <Btn
          size="sm"
          disabled={busy !== null}
          onClick={() => recordPayment(tx.id)}
        >
          {busy === `${tx.id}-payment` ? (
            <Spinner />
          ) : (
            <Icon name="wallet" size={14} />
          )}
          {t("recy.markPaid")}
        </Btn>
      </div>
    </div>
  </div>
)}
            </div>

            <p className="mt-2 text-[10px] text-sage">
              Demo payment abstraction — no real banking integration.
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}