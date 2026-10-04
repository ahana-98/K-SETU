// K-SETU business services — all database access lives here, not in UI or route files.
import { db } from "@/db";
import * as s from "@/db/schema";
import { eq, and, desc, sql, inArray, gte } from "drizzle-orm";
import {
  classifyMaterial,
  estimateValue,
  rankRecyclers,
  detectAnomaly,
  detectCategoryAnomaly,
  estimateMetalConservation,
  CONDITION_FACTOR,
} from "@/lib/ml";
import { generateOtp, hashOtp, verifyOtpHash } from "@/lib/auth";
export const LOCATIONS = ["Pune", "Mumbai", "Nashik", "Nagpur", "Thane"];

function pad(n: number, w = 6) {
  return String(n).padStart(w, "0");
}
function createHandoverOtp() {
  return generateOtp();
}

async function prepareHandoverOtp() {
  const otp = createHandoverOtp();
  const otpHash = await hashOtp(otp);

  return {
    otp,
    otpHash,
    expiresAt: new Date(Date.now() + 5 * 60_000),
  };
}

export async function getUserByEmail(email: string) {
  const rows = await db.select().from(s.users).where(eq(s.users.email, email.toLowerCase().trim()));
  return rows[0] ?? null;
}

export async function getUserById(id: number) {
  const rows = await db.select().from(s.users).where(eq(s.users.id, id));
  return rows[0] ?? null;
}

// ---------- Materials & Prices ----------
export async function listMaterials() {
  return db.select().from(s.materialCatalog);
}

export async function listPrices() {
  return db.select().from(s.prices);
}

export async function priceFor(category: string, location: string) {
  const rows = await db
    .select()
    .from(s.prices)
    .where(and(eq(s.prices.category, category), eq(s.prices.location, location)));
  if (rows[0]) return rows[0];
  const any = await db.select().from(s.prices).where(eq(s.prices.category, category));
  return any[0] ?? null;
}

export async function priceHistory(category: string, location: string, days: number) {
  const since = new Date(Date.now() - days * 86400_000);

  return db
    .select()
    .from(s.priceHistory)
    .where(
      and(
        eq(s.priceHistory.category, category),
        eq(s.priceHistory.location, location),
        gte(s.priceHistory.date, since)
      )
    );
}
// ---------- Lots ----------
export async function nextLotCode() {
  const r = await db.select({ c: sql<number>`count(*)::int` }).from(s.lots);
  return `KS-2026-${pad(124 + (r[0]?.c ?? 0))}`;
}

export type CreateLotInput = {
  collectorId: number;
  syncId?: string;
  category: string;
  subcategory?: string;
  description?: string;
  imageData?: string;
  weightKg: number;
  condition: string;
  collectionLocation: string;
  latitude?: number;
longitude?: number;
  estimatedValue?: number;
  requestedRecyclerId?: number;
};

export async function createLot(input: CreateLotInput) {
  if (!(input.weightKg > 0)) throw new Error("Weight must be positive");

  const weightAnomaly = detectWeightAnomaly(input.weightKg);
 const classification = classifyMaterial({
  fileName: input.description ?? "",
  imageSignature: input.imageData ?? "",
});

const categoryAnomaly = detectCategoryAnomaly({
  selectedCategory: input.category,
  predictedCategory: classification.category,
  confidence: classification.confidence,
});
console.log("WEIGHT ANOMALY CHECK:", {
  weightKg: input.weightKg,
  status: weightAnomaly.status,
  message: weightAnomaly.message,
});
  if (input.syncId) {
    const existing = await db
      .select()
      .from(s.lots)
      .where(eq(s.lots.syncId, input.syncId))
      .limit(1);

    if (existing[0]) {
      return existing[0];
    }
  }
  const price = await priceFor(input.category, input.collectionLocation);
  const rate = price?.buyingRate ?? 100;
  const est = estimateValue({ ratePerKg: rate, weightKg: input.weightKg, condition: input.condition });
  const lotCode = await nextLotCode();
  const [lot] = await db
    .insert(s.lots)
    .values({
      lotCode,
      syncId: input.syncId ?? null,
      collectorId: input.collectorId,
      category: input.category,
      subcategory: input.subcategory ?? null,
      description: input.description ?? null,
      imageData: input.imageData ?? null,
      weightKg: input.weightKg,
      condition: input.condition,
      collectionLocation: input.collectionLocation,
      latitude: input.latitude ?? null,
longitude: input.longitude ?? null,
      estimatedValue: input.estimatedValue ?? est.estimatedValue,
      requestedRecyclerId: input.requestedRecyclerId ?? null,
      status: "open",
    }).returning();

  const conservationEstimates = estimateMetalConservation(
    input.category,
    input.weightKg
  );

  if (conservationEstimates.length) {
    await db.insert(s.metalConservation).values(
      conservationEstimates.map((item) => ({
        lotId: lot.id,
        metal: item.metal,
        estimatedKg: item.estimatedKg,
        recoveredKg: item.recoveredKg,
        recoveryRate: item.recoveryRate,
        source: item.source,
      }))
    );
  }

await db.insert(s.traceEvents).values([
  {
    lotId: lot.id,
    stage: "collected",
    label: "Material collected",
    location: input.collectionLocation,
    ref: lotCode,
  },
  {
    lotId: lot.id,
    stage: "lot",
    label: `Lot ${lotCode} created`,
    location: input.collectionLocation,
    ref: lotCode,
  },
]);

if (weightAnomaly.status === "flag") {
  await db.insert(s.traceEvents).values({
    lotId: lot.id,
    stage: "anomaly",
    label: "Weight anomaly detected",
    location: input.collectionLocation,
    ref: lotCode,
  });
}

if (categoryAnomaly.status === "flag") {
  await db.insert(s.traceEvents).values({
    lotId: lot.id,
    stage: "anomaly",
    label: categoryAnomaly.message,
    location: input.collectionLocation,
    ref: lotCode,
  });
}

return lot;
}
export async function metalConservationForLot(lotId: number) {
  return db
    .select()
    .from(s.metalConservation)
    .where(eq(s.metalConservation.lotId, lotId))
    .orderBy(s.metalConservation.id);
}
export async function updateMetalRecovery(
  id: number,
  recoveredKg: number
) {
  if (!Number.isFinite(recoveredKg) || recoveredKg < 0) {
    throw new Error("Recovered weight must be a valid non-negative number.");
  }

  const [record] = await db
    .select()
    .from(s.metalConservation)
    .where(eq(s.metalConservation.id, id))
    .limit(1);

  if (!record) {
    throw new Error("Metal conservation record not found.");
  }

  if (recoveredKg > record.estimatedKg) {
    throw new Error("Recovered weight cannot exceed the estimated weight.");
  }

  const recoveryRate =
    record.estimatedKg > 0
      ? Number(((recoveredKg / record.estimatedKg) * 100).toFixed(2))
      : 0;

  const [updated] = await db
    .update(s.metalConservation)
    .set({
      recoveredKg,
      recoveryRate,
    })
    .where(eq(s.metalConservation.id, id))
    .returning();

  return updated;
}
export async function getLotById(id: number) {
  const rows = await db.select().from(s.lots).where(eq(s.lots.id, id));
  return rows[0] ?? null;
}
export async function getLotByCode(lotCode: string) {
  const rows = await db
    .select()
    .from(s.lots)
    .where(eq(s.lots.lotCode, lotCode.trim()))
    .limit(1);

  return rows[0] ?? null;
}

export async function lotsByCollector(collectorId: number) {
  return db.select().from(s.lots).where(eq(s.lots.collectorId, collectorId)).orderBy(desc(s.lots.createdAt));
}

export async function allLots() {
  return db.select().from(s.lots).orderBy(desc(s.lots.createdAt));
}

export async function openLotsForRecycler(recyclerUserId: number) {
  const prof = await recyclerProfileByUserId(recyclerUserId);
  const lots = await db
.select({
  id: s.lots.id,
  lotCode: s.lots.lotCode,
  category: s.lots.category,
  weightKg: s.lots.weightKg,
  status: s.lots.status,
  collectionLocation: s.lots.collectionLocation,
  estimatedValue: s.lots.estimatedValue,
  createdAt: s.lots.createdAt,
  requestedRecyclerId: s.lots.requestedRecyclerId,
})    .from(s.lots)
    .where(inArray(s.lots.status, ["open", "quoted"]))
    .orderBy(desc(s.lots.createdAt));
  const accepted = prof?.materialsAccepted ?? [];
  return lots.filter((l) => l.requestedRecyclerId === recyclerUserId || accepted.includes(l.category));
}

export async function requestQuoteFromRecycler(lotId: number, collectorId: number, recyclerUserId: number) {
  const lot = await getLotById(lotId);
  if (!lot || lot.collectorId !== collectorId) throw new Error("Not your lot");
  await db.update(s.lots).set({ requestedRecyclerId: recyclerUserId, status: "open" }).where(eq(s.lots.id, lotId));
  return { ok: true };
}

// ---------- Recyclers ----------
export async function recyclerProfileByUserId(userId: number) {
  const rows = await db.select().from(s.recyclerProfiles).where(eq(s.recyclerProfiles.userId, userId));
  return rows[0] ?? null;
}

export async function allRecyclerProfiles() {
  return db.select().from(s.recyclerProfiles);
}

export async function matchRecyclers(category: string, location: string) {
  const profiles = await allRecyclerProfiles();
  const price = await priceFor(category, location);
  const marketRate = price?.buyingRate ?? 0;
  const candidates = profiles.map((p) => ({
    recyclerUserId: p.userId,
    name: p.name,
    facilityLocation: p.facilityLocation,
    serviceArea: p.serviceArea,
    authorizationStatus: p.authorizationStatus,
    contact: p.contact,
    pickupAvailable: p.pickupAvailable,
    offeredRate: p.offeredRates?.[category] ?? Math.round(marketRate * 0.95),
    materialsAccepted: p.materialsAccepted,
  }));
 const ranked = rankRecyclers(candidates, {
  category,
  marketRate,
  location,
});

const normalizedLocation = location.trim().toLowerCase();

const nearby = ranked.filter((r) => {
  const serviceArea = r.serviceArea.trim().toLowerCase();
  const facilityLocation = r.facilityLocation.trim().toLowerCase();

  return (
    serviceArea === normalizedLocation ||
    facilityLocation === normalizedLocation ||
    (normalizedLocation === "new town" &&
      (serviceArea === "kolkata" || facilityLocation === "kolkata"))
  );
});

return nearby.length > 0 ? nearby : ranked;
}
function detectLocationAnomaly(
  lotLocation: string,
  recyclerFacilityLocation: string,
  recyclerServiceArea: string
): { status: "normal" | "flag"; message: string } {
  const lot = lotLocation.trim().toLowerCase();
  const facility = recyclerFacilityLocation.trim().toLowerCase();
  const serviceArea = recyclerServiceArea.trim().toLowerCase();

  const matches =
    lot === facility ||
    lot === serviceArea ||
    (lot === "new town" &&
      (facility === "kolkata" || serviceArea === "kolkata"));

  if (!matches) {
    return {
      status: "flag",
      message:
        `Recycler location mismatch: lot is in ${lotLocation}, ` +
        `but recycler facility/service area is ${recyclerFacilityLocation} / ${recyclerServiceArea}. ` +
        `Manual review is recommended.`,
    };
  }

  return {
    status: "normal",
    message: "Recycler location matches the collection area.",
  };
}
function detectWeightAnomaly(
  weightKg: number
): { status: "normal" | "flag"; message: string } {
  if (!(weightKg > 0)) {
    return {
      status: "flag",
      message: "Invalid lot weight detected. Manual review is recommended.",
    };
  }

  if (weightKg < 0.1 || weightKg > 1000) {
    return {
      status: "flag",
      message:
        `Lot weight of ${weightKg} kg is outside the prototype expected range. Manual review is recommended.`,
    };
  }

  return {
    status: "normal",
    message: "Lot weight is within the prototype expected range.",
  };
}
// ---------- Quotes ----------
export async function createQuote(input: {
  lotId: number;
  recyclerUserId: number;
  ratePerKg: number;
  pickupAvailable: boolean;
  notes?: string;
}) {
  if (!(input.ratePerKg > 0)) {
    throw new Error("Rate must be positive");
  }

  const lot = await getLotById(input.lotId);
  if (!lot) {
    throw new Error("Lot not found");
  }

  const existing = await db
    .select()
    .from(s.quotes)
    .where(
      and(
        eq(s.quotes.lotId, input.lotId),
        eq(s.quotes.recyclerId, input.recyclerUserId),
        eq(s.quotes.status, "pending")
      )
    );

  if (existing.length) {
    throw new Error("You already have a pending quote on this lot");
  }

  const anomaly = await mlAnomaly(
    input.ratePerKg,
    lot.category,
    lot.collectionLocation
  );
  const recyclerProf = await recyclerProfileByUserId(input.recyclerUserId);

if (!recyclerProf) {
  throw new Error("Recycler profile not found");
}

const locationAnomaly = detectLocationAnomaly(
  lot.collectionLocation,
  recyclerProf.facilityLocation,
  recyclerProf.serviceArea
);

  // Get local market range so an anomalous quote can be corrected.
  const marketPrice = await priceFor(
    lot.category,
    lot.collectionLocation
  );

  let correctedRate = input.ratePerKg;
  let correctionNote: string | null = null;

  if (marketPrice && anomaly.status === "flag") {
    const low = marketPrice.minRate * 0.7;
    const high = marketPrice.maxRate * 1.3;

    if (input.ratePerKg < low) {
      correctedRate = marketPrice.minRate;
      correctionNote = `[ANOMALY CORRECTED] Entered ₹${input.ratePerKg}/kg, corrected to ₹${correctedRate}/kg based on local market range.`;
    } else if (input.ratePerKg > high) {
      correctedRate = marketPrice.maxRate;
      correctionNote = `[ANOMALY CORRECTED] Entered ₹${input.ratePerKg}/kg, corrected to ₹${correctedRate}/kg based on local market range.`;
    }
  }

 const quoteNotes = [
  input.notes,
  anomaly.status === "flag"
    ? `[ANOMALY FLAG] ${anomaly.message}`
    : null,
  locationAnomaly.status === "flag"
    ? `[LOCATION ANOMALY] ${locationAnomaly.message}`
    : null,
  correctionNote,
]
  .filter(Boolean)
  .join(" — ") || null;

  const [q] = await db
    .insert(s.quotes)
    .values({
      lotId: input.lotId,
      recyclerId: input.recyclerUserId,
      ratePerKg: correctedRate,
      pickupAvailable: input.pickupAvailable,
      notes: quoteNotes,
    })
    .returning();

  await db
    .update(s.lots)
    .set({ status: "quoted" })
    .where(eq(s.lots.id, input.lotId));

  await db.insert(s.traceEvents).values({
    lotId: lot.id,
    stage: "quote",
    label: "Quote received",
    ref: `Q-${q.id}`,
  });

 if (anomaly.status === "flag") {
  await db.insert(s.traceEvents).values({
    lotId: lot.id,
    stage: "anomaly",
    label: correctionNote
      ? "Price anomaly detected and corrected"
      : "Price anomaly flagged",
    ref: `Q-${q.id}`,
  });
}

if (locationAnomaly.status === "flag") {
  await db.insert(s.traceEvents).values({
    lotId: lot.id,
    stage: "anomaly",
    label: "Recycler location mismatch detected",
    location: lot.collectionLocation,
    ref: `Q-${q.id}`,
  });
}

  return q;
}

export async function quotesForLot(lotId: number) {
  const qs = await db.select().from(s.quotes).where(eq(s.quotes.lotId, lotId)).orderBy(desc(s.quotes.createdAt));
  const profiles = await allRecyclerProfiles();
  return qs.map((q) => ({ ...q, recyclerName: profiles.find((p) => p.userId === q.recyclerId)?.name ?? "Recycler" }));
}

export async function quotesByRecycler(recyclerUserId: number) {
  const qs = await db.select().from(s.quotes).where(eq(s.quotes.recyclerId, recyclerUserId)).orderBy(desc(s.quotes.createdAt));
  const out = [];
  for (const q of qs) {
    const lot = await getLotById(q.lotId);
    out.push({ ...q, lot });
  }
  return out;
}

async function nextTxRefs() {
  const r = await db.select({ c: sql<number>`count(*)::int` }).from(s.transactions);
  const n = 491 + (r[0]?.c ?? 0);
  return { txCode: `TX-2026-${pad(n, 5)}`, handoverRef: `HS-2026-${pad(n, 5)}` };
}

export async function acceptQuote(quoteId: number, collectorId: number) {
  const qs = await db.select().from(s.quotes).where(eq(s.quotes.id, quoteId));
  const quote = qs[0];
  if (!quote) throw new Error("Quote not found");
  const lot = await getLotById(quote.lotId);
  if (!lot || lot.collectorId !== collectorId) throw new Error("Not your lot");
  if (lot.status === "accepted" || lot.status === "completed") throw new Error("Lot already assigned");
const finalPrice = Math.round(
  quote.ratePerKg * lot.weightKg * (CONDITION_FACTOR[lot.condition] ?? 0.8)
);

const refs = await nextTxRefs();
const handoverOtp = await prepareHandoverOtp();

const [tx] = await db
  .insert(s.transactions)
      .values({
      txCode: refs.txCode,
      handoverRef: refs.handoverRef,
      lotId: lot.id,
      collectorId,
      recyclerId: quote.recyclerId,
      quoteId: quote.id,
      quotedPrice: Math.round(quote.ratePerKg * lot.weightKg),
      finalPrice,
      collectionLocation: lot.collectionLocation,
      handoverOtpHash: handoverOtp.otpHash,
      handoverOtpExpiresAt: handoverOtp.expiresAt,
      handoverOtpAttempts: 0,
      handoverOtpCreatedAt: new Date(),
    })
    .returning();
  await db.update(s.quotes).set({ status: "accepted" }).where(eq(s.quotes.id, quote.id));
  await db.update(s.quotes).set({ status: "rejected" }).where(and(eq(s.quotes.lotId, lot.id), sql`${s.quotes.id} <> ${quote.id}`, eq(s.quotes.status, "pending")));
  await db.update(s.lots).set({ status: "accepted" }).where(eq(s.lots.id, lot.id));
  const recyclerProf = await recyclerProfileByUserId(quote.recyclerId);
  await db.insert(s.ledgerEntries).values({
    collectorId,
    txId: tx.id,
    lotId: lot.id,
    category: lot.category,
    weightKg: lot.weightKg,
    amount: finalPrice,
    status: "pending",
    recyclerName: recyclerProf?.name ?? "Recycler",
  });
  await db.insert(s.traceEvents).values([
    { lotId: lot.id, txId: tx.id, stage: "selected", label: "Recycler selected & quote accepted", ref: refs.handoverRef },
  ]);
return {
  ...tx,
  handoverOtp: handoverOtp.otp,
};
}
export async function verifyHandoverOtp(
  txId: number,
  otp: string,
  recyclerUserId: number
) {
const [tx] = await db
  .select()
  .from(s.transactions)
  .where(
    and(
      eq(s.transactions.id, txId),
      eq(s.transactions.recyclerId, recyclerUserId)
    )
  )
  .limit(1);
  if (!tx) {
    throw new Error("Transaction not found.");
  }

  if (tx.status !== "active") {
    throw new Error("Transaction is not active.");
  }

  if (!tx.handoverOtpHash || !tx.handoverOtpExpiresAt) {
    throw new Error("Handover OTP is not available.");
  }

  if (new Date() > tx.handoverOtpExpiresAt) {
    throw new Error("Handover OTP has expired.");
  }

  if (tx.handoverOtpAttempts >= 5) {
    throw new Error("Too many incorrect OTP attempts.");
  }

  const valid = await verifyOtpHash(otp, tx.handoverOtpHash);

  if (!valid) {
    await db
      .update(s.transactions)
      .set({
        handoverOtpAttempts: tx.handoverOtpAttempts + 1,
      })
      .where(eq(s.transactions.id, txId));

    throw new Error("Invalid handover OTP.");
  }

  await db
    .update(s.transactions)
    .set({
      status: "handover",
      handoverOtpHash: null,
      handoverOtpExpiresAt: null,
      handoverOtpAttempts: 0,
    })
    .where(eq(s.transactions.id, txId));

  await db.insert(s.traceEvents).values({
    lotId: tx.lotId,
    stage: "handover",
    label: "Handover verified with OTP",
    location: tx.handoverLocation ?? tx.collectionLocation,
    ref: tx.handoverRef,
  });

  return {
    success: true,
    message: "Handover verified successfully.",
  };
}

export async function rejectQuote(quoteId: number, collectorId: number) {
  const qs = await db.select().from(s.quotes).where(eq(s.quotes.id, quoteId));
  const quote = qs[0];
  if (!quote) throw new Error("Quote not found");
  const lot = await getLotById(quote.lotId);
  if (!lot || lot.collectorId !== collectorId) throw new Error("Not your lot");
  await db.update(s.quotes).set({ status: "rejected" }).where(eq(s.quotes.id, quoteId));
  return { ok: true };
}

// ---------- Transactions / Handover / Payment ----------
export async function transactionsForCollector(collectorId: number) {
  const txs = await db.select().from(s.transactions).where(eq(s.transactions.collectorId, collectorId)).orderBy(desc(s.transactions.createdAt));
  return enrichTxs(txs);
}

export async function transactionsForRecycler(recyclerUserId: number) {
  const txs = await db.select().from(s.transactions).where(eq(s.transactions.recyclerId, recyclerUserId)).orderBy(desc(s.transactions.createdAt));
  return enrichTxs(txs);
}

export async function allTransactions() {
  const txs = await db.select().from(s.transactions).orderBy(desc(s.transactions.createdAt));
  return enrichTxs(txs);
}

async function enrichTxs(txs: (typeof s.transactions.$inferSelect)[]) {
  const profiles = await allRecyclerProfiles();
  const out = [];
  for (const tx of txs) {
    const lot = await getLotById(tx.lotId);
    out.push({ ...tx, lot, recyclerName: profiles.find((p) => p.userId === tx.recyclerId)?.name ?? "Recycler" });
  }
  return out;
}

export async function confirmPickup(txId: number, recyclerUserId: number) {
  const tx = await txById(txId);
  if (!tx || tx.recyclerId !== recyclerUserId) throw new Error("Not your transaction");
  if (tx.status !== "handover") {
  await db.insert(s.traceEvents).values({
    lotId: tx.lotId,
    txId,
    stage: "anomaly",
    label: `Transaction state anomaly: payment attempted before handover verification (current status: ${tx.status})`,
    ref: tx.handoverRef,
  });

  throw new Error("Payment can only be recorded after handover verification.");
}
  await db.update(s.transactions).set({ status: "handover" as never, handoverLocation: tx.collectionLocation }).where(eq(s.transactions.id, txId));
  await db.update(s.lots).set({ status: "handover" }).where(eq(s.lots.id, tx.lotId));
  await db.insert(s.traceEvents).values({ lotId: tx.lotId, txId, stage: "handover", label: "Pickup confirmed — handover in progress", location: tx.collectionLocation, ref: tx.handoverRef });
  return { ok: true };
}

export async function confirmHandover(txId: number, recyclerUserId: number, handoverLocation?: string) {
  const tx = await txById(txId);
  if (!tx || tx.recyclerId !== recyclerUserId) throw new Error("Not your transaction");
  await db
    .update(s.transactions)
    .set({ handoverLocation: handoverLocation || tx.handoverLocation || tx.collectionLocation })
    .where(eq(s.transactions.id, txId));
  await db.insert(s.traceEvents).values({
    lotId: tx.lotId,
    txId,
    stage: "confirmed",
    label: "Recycler confirmed handover (weight/photo recorded)",
    location: handoverLocation || tx.collectionLocation,
    ref: tx.handoverRef,
  });
  return { ok: true };
}

export async function recordPayment(
  txId: number,
  recyclerUserId: number,
  method: string
) {
  const tx = await txById(txId);

  if (!tx || tx.recyclerId !== recyclerUserId) {
    throw new Error("Not your transaction");
  }

  // Mark the transaction as paid.
  await db
    .update(s.transactions)
    .set({
      paymentMethod: method,
      paymentStatus: "paid",
      status: "completed",
    })
    .where(eq(s.transactions.id, txId));

  // Complete the lot.
  await db
    .update(s.lots)
    .set({ status: "completed" })
    .where(eq(s.lots.id, tx.lotId));

  // Find the existing earnings ledger entry.
  const existingLedger = await db
    .select()
    .from(s.ledgerEntries)
    .where(eq(s.ledgerEntries.txId, txId));

  if (existingLedger.length) {
    // Normal case: mark the existing entry as paid.
    await db
      .update(s.ledgerEntries)
      .set({ status: "paid" })
      .where(eq(s.ledgerEntries.txId, txId));
  } else {
    // Recovery case: transaction exists but ledger entry is missing.
    const lot = await getLotById(tx.lotId);
    const recyclerProf = await recyclerProfileByUserId(tx.recyclerId);

    if (lot) {
      await db.insert(s.ledgerEntries).values({
        collectorId: tx.collectorId,
        txId: tx.id,
        lotId: lot.id,
        category: lot.category,
        weightKg: lot.weightKg,
        amount: tx.finalPrice,
        status: "paid",
        recyclerName: recyclerProf?.name ?? "Recycler",
      });
    }
  }

  await db.insert(s.traceEvents).values([
    {
      lotId: tx.lotId,
      txId,
      stage: "payment",
      label: `Payment completed (${method.toUpperCase()})`,
      ref: tx.handoverRef,
    },
    {
      lotId: tx.lotId,
      txId,
      stage: "recycling",
      label: "Sent to formal recycling",
      ref: tx.handoverRef,
    },
  ]);

  return { ok: true };
}

async function txById(id: number) {
  const rows = await db.select().from(s.transactions).where(eq(s.transactions.id, id));
  return rows[0] ?? null;
}

export async function verifyHandover(ref: string) {
  const rows = await db.select().from(s.transactions).where(eq(s.transactions.handoverRef, ref));
  const tx = rows[0];
  if (!tx) return null;
  const lot = await getLotById(tx.lotId);
  const prof = await recyclerProfileByUserId(tx.recyclerId);
  return { tx, lot, recyclerName: prof?.name ?? "Recycler" };
}

// ---------- Ledger ----------
export async function ledgerForCollector(collectorId: number, filters?: { status?: string; category?: string }) {
  let rows = await db.select().from(s.ledgerEntries).where(eq(s.ledgerEntries.collectorId, collectorId)).orderBy(desc(s.ledgerEntries.createdAt));
  if (filters?.status) rows = rows.filter((r) => r.status === filters.status);
  if (filters?.category) rows = rows.filter((r) => r.category === filters.category);
  return rows;
}

// ---------- Traceability ----------
export async function traceForLot(lotId: number) {
  return db
    .select()
    .from(s.traceEvents)
    .where(eq(s.traceEvents.lotId, lotId))
    .orderBy(s.traceEvents.id);
}
// ---------- Safety ----------
export async function safetyContent(lang: string) {
  const rows = await db.select().from(s.safetyContent).where(eq(s.safetyContent.lang, lang));
  if (rows.length) return rows;
  return db.select().from(s.safetyContent).where(eq(s.safetyContent.lang, "en"));
}

// ---------- ML endpoints ----------
export async function mlEstimate(category: string, weightKg: number, condition: string, location: string) {
  const price = await priceFor(category, location);
  const rate = price?.buyingRate ?? 100;
  const est = estimateValue({ ratePerKg: rate, weightKg, condition });
  return { ...est, ratePerKg: rate, currency: "INR", label: "PROTOTYPE ESTIMATE" };
}

export async function mlAnomaly(
  quoteRate: number,
  category: string,
  location: string
) {
  const price = await priceFor(category, location);

  if (!price) {
    return {
      status: "flag" as const,
      message:
        "No local market price data is available for this category and location. Manual review is recommended.",
    };
  }

  return detectAnomaly({
    quotedRate: quoteRate,
    minRate: price.minRate,
    maxRate: price.maxRate,
  });
}

export { classifyMaterial };

// ---------- Sync ----------
export async function syncLots(payload: CreateLotInput[]) {
  const created = [];

  for (const item of payload) {
    created.push(await createLot(item));
  }

  return created;
}

// ---------- Admin ----------
export async function adminStats() {
  const [collectors] = await db.select({ c: sql<number>`count(*)::int` }).from(s.users).where(eq(s.users.role, "collector"));
  const [recyclers] = await db.select({ c: sql<number>`count(*)::int` }).from(s.users).where(eq(s.users.role, "recycler"));
  const [lotsC] = await db.select({ c: sql<number>`count(*)::int` }).from(s.lots);
  const [txC] = await db.select({ c: sql<number>`count(*)::int` }).from(s.transactions);
  const [completed] = await db.select({ c: sql<number>`count(*)::int` }).from(s.transactions).where(eq(s.transactions.status, "completed"));
  const [pendingPay] = await db.select({ c: sql<number>`count(*)::int` }).from(s.transactions).where(eq(s.transactions.paymentStatus, "pending"));
  const vol = await db.select({ c: sql<number>`coalesce(sum(${s.lots.weightKg}),0)::float` }).from(s.lots);
  const earn = await db.select({ c: sql<number>`coalesce(sum(${s.ledgerEntries.amount}),0)::float` }).from(s.ledgerEntries);

  const byCategory = await db
    .select({ category: s.lots.category, weight: sql<number>`coalesce(sum(${s.lots.weightKg}),0)::float`, count: sql<number>`count(*)::int` })
    .from(s.lots)
    .groupBy(s.lots.category);

  const monthly = await db
    .select({
      month: sql<string>`to_char(${s.transactions.createdAt}, 'YYYY-MM')`,
      total: sql<number>`coalesce(sum(${s.transactions.finalPrice}),0)::float`,
      count: sql<number>`count(*)::int`,
    })
    .from(s.transactions)
    .groupBy(sql`to_char(${s.transactions.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${s.transactions.createdAt}, 'YYYY-MM')`);

  const payments = await db
    .select({ status: s.transactions.paymentStatus, count: sql<number>`count(*)::int` })
    .from(s.transactions)
    .groupBy(s.transactions.paymentStatus);

  const collectorEarnings = await db
    .select({ collectorId: s.ledgerEntries.collectorId, total: sql<number>`coalesce(sum(${s.ledgerEntries.amount}),0)::float` })
    .from(s.ledgerEntries)
    .groupBy(s.ledgerEntries.collectorId);

  return {
    counts: {
      collectors: collectors?.c ?? 0,
      recyclers: recyclers?.c ?? 0,
      lots: lotsC?.c ?? 0,
      transactions: txC?.c ?? 0,
      completed: completed?.c ?? 0,
      pendingPayments: pendingPay?.c ?? 0,
      materialKg: Math.round(vol[0]?.c ?? 0),
      totalEarnings: Math.round(earn[0]?.c ?? 0),
    },
    byCategory,
    monthly,
    payments,
    collectorEarnings,
  };
}

export async function resetDemo() {
  await db.delete(s.traceEvents);
  await db.delete(s.ledgerEntries);
  await db.delete(s.quotes);
  await db.delete(s.transactions);
  await db.delete(s.lots);
  await db.delete(s.priceHistory);
  await db.delete(s.fieldResearch);
  await db.delete(s.appSettings);
  await db.delete(s.safetyContent);
  await db.delete(s.prices);
  await db.delete(s.materialCatalog);
  await db.delete(s.recyclerProfiles);
  await db.delete(s.collectorProfiles);
  await db.delete(s.users);
  const { seedDatabase } = await import("@/db/seed");
  await seedDatabase();
  return { ok: true };
}

// ---------- Settings / Field research ----------
export async function getSettings() {
  return db.select().from(s.appSettings);
}
export async function setSetting(key: string, value: unknown, label?: string) {
  const existing = await db.select().from(s.appSettings).where(eq(s.appSettings.key, key));
  if (existing.length) {
    await db.update(s.appSettings).set({ value: value as never }).where(eq(s.appSettings.key, key));
  } else {
    await db.insert(s.appSettings).values({ key, label: label ?? key, value: value as never });
  }
  return { ok: true };
}

export async function listFieldResearch() {
  return db.select().from(s.fieldResearch).orderBy(desc(s.fieldResearch.recordedAt));
}
export async function addFieldResearch(row: Omit<typeof s.fieldResearch.$inferInsert, "id" | "recordedAt">) {
  const [r] = await db.insert(s.fieldResearch).values(row).returning();
  return r;
}

export async function listCollectors() {
  const users = await db.select().from(s.users).where(eq(s.users.role, "collector"));
  const out = [];
  for (const u of users) {
    const prof = await db.select().from(s.collectorProfiles).where(eq(s.collectorProfiles.userId, u.id));
    const [agg] = await db
      .select({ total: sql<number>`coalesce(sum(${s.ledgerEntries.amount}),0)::float`, lots: sql<number>`count(*)::int` })
      .from(s.ledgerEntries)
      .where(eq(s.ledgerEntries.collectorId, u.id));
    out.push({ ...u, profile: prof[0] ?? null, totalEarned: Math.round(agg?.total ?? 0), lotCount: agg?.lots ?? 0 });
  }
  return out;
}
