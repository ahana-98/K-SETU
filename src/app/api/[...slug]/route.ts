import { NextResponse } from "next/server";
import { getSessionFromHeaders, type SessionPayload } from "@/lib/auth";
import * as svc from "@/lib/services";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const lotSchema = z.object({
  category: z.string().min(1),
  syncId: z.string().uuid().optional(),
  subcategory: z.string().optional(),
  description: z.string().max(500).optional(),
  imageData: z.string().max(900_000).optional(),
  weightKg: z.number().positive().max(10000),
  condition: z.string().min(1),
  collectionLocation: z.string().min(1),
  latitude: z.number().optional(),
longitude: z.number().optional(),
  estimatedValue: z.number().nonnegative().optional(),
  requestedRecyclerId: z.number().int().optional(),
});

const quoteSchema = z.object({
  lotId: z.number().int().positive(),
  ratePerKg: z.number().positive().max(100000),
  pickupAvailable: z.boolean().optional(),
  notes: z.string().max(500).optional(),
});

function need(session: SessionPayload | null): SessionPayload {
  if (!session) throw new HttpError(401, "Authentication required");
  return session;
}
function needRole(session: SessionPayload | null, ...roles: string[]): SessionPayload {
  const s = need(session);
  if (!roles.includes(s.role)) throw new HttpError(403, "You don't have permission to access this page.");
  return s;
}

async function handleGet(req: Request, slug: string[], q: URLSearchParams, session: SessionPayload | null) {
  const path = slug.join("/");

  if (path === "verify") {
    const ref = q.get("ref") || "";
    const data = await svc.verifyHandover(ref);
    if (!data) throw new HttpError(404, "Handover reference not found.");
    return data;
  }
  if (path === "materials") return svc.listMaterials();
  if (path === "prices") {
    const rows = await svc.listPrices();
    return { prices: rows, meta: { label: "INDICATIVE / DEMO DATA" } };
  }
  if (path === "prices/history") {
    const category = q.get("category") || "PCB";
    const location = q.get("location") || "Pune";
    const days = Math.min(365, Math.max(7, Number(q.get("days") || 30)));
    const rows = await svc.priceHistory(category, location, days);
    return { history: rows, meta: { label: "DEMO DATA" } };
  }
  if (path === "safety") return svc.safetyContent(q.get("lang") || "en");

  const s = need(session);

  if (path === "recyclers") {
    const category = q.get("category");
    const location = q.get("location") || "Pune";
    if (category) return { recyclers: await svc.matchRecyclers(category, location), meta: { label: "SAMPLE RECYCLERS — demo authorization" } };
    return { recyclers: await svc.allRecyclerProfiles(), meta: { label: "SAMPLE RECYCLERS — demo authorization" } };
  }
  if (path === "lots") {
    if (s.role === "collector") return svc.lotsByCollector(s.sub);
    if (s.role === "recycler") return svc.openLotsForRecycler(s.sub);
    if (s.role === "admin") return svc.allLots();
    throw new HttpError(403, "Forbidden");
  }
  if (slug[0] === "lots" && slug[1]) {
    const lot = await svc.getLotById(Number(slug[1]));
    if (!lot) throw new HttpError(404, "Lot not found");
    if (s.role === "collector" && lot.collectorId !== s.sub) throw new HttpError(403, "Not your lot");
    if (s.role === "recycler") {
      const incoming = await svc.openLotsForRecycler(s.sub);
      const txs = await svc.transactionsForRecycler(s.sub);
      const involved = incoming.some((l) => l.id === lot.id) || txs.some((t) => t.lotId === lot.id);
      if (!involved && lot.status !== "open") throw new HttpError(403, "Not your lot");
    }
    return lot;
  }
  if (path === "quotes") {
    const lotId = q.get("lotId");
    if (lotId) {
      const lot = await svc.getLotById(Number(lotId));
      if (lot && s.role === "collector" && lot.collectorId !== s.sub) throw new HttpError(403, "Not your lot");
      return svc.quotesForLot(Number(lotId));
    }
    if (s.role === "recycler") return svc.quotesByRecycler(s.sub);
    throw new HttpError(400, "lotId required");
  }
  if (path === "transactions") {
    if (s.role === "collector") return svc.transactionsForCollector(s.sub);
    if (s.role === "recycler") return svc.transactionsForRecycler(s.sub);
    if (s.role === "admin") return svc.allTransactions();
    throw new HttpError(403, "Forbidden");
  }
  if (path === "ledger") {
    needRole(session, "collector", "admin");
    return svc.ledgerForCollector(s.sub, { status: q.get("status") || undefined, category: q.get("category") || undefined });
  }
if (slug[0] === "traceability" && slug[1]) {
  const ref = slug[1];
  const numericId = Number(ref);

  if (Number.isInteger(numericId)) {
    return svc.traceForLot(numericId);
  }

  const lots = await svc.allLots();
  const lot = lots.find((item) => item.lotCode === ref);

  if (!lot) {
    throw new HttpError(404, "Lot not found");
  }

  return svc.traceForLot(lot.id);
}
  if (path === "admin/stats") {
    needRole(session, "admin");
    return svc.adminStats();
  }
  if (path === "admin/collectors") {
    needRole(session, "admin");
    return svc.listCollectors();
  }
  if (path === "admin/recyclers") {
    needRole(session, "admin");
    return svc.allRecyclerProfiles();
  }
  if (path === "admin/settings") {
    needRole(session, "admin");
    return svc.getSettings();
  }
  if (path === "admin/field-research") {
    needRole(session, "admin");
    return svc.listFieldResearch();
  }
  throw new HttpError(404, "Not found");
}

async function handlePost(req: Request, slug: string[], body: any, session: SessionPayload | null) {
  const path = slug.join("/");
  const s = need(session);

  if (path === "lots") {
    needRole(session, "collector");
    const data = lotSchema.parse(body);
    if (data.imageData && !/^data:image\/(png|jpeg|jpg|webp);base64,/.test(data.imageData)) {
      throw new HttpError(400, "Invalid image type. Only PNG/JPEG/WEBP allowed.");
    }
    return svc.createLot({ ...data, collectorId: s.sub });
  }
  if (slug[0] === "lots" && slug[2] === "estimate") {
    const lot = await svc.getLotById(Number(slug[1]));
    const category = body?.category || lot?.category || "PCB";
    const weight = Number(body?.weightKg ?? lot?.weightKg ?? 0);
    const condition = body?.condition || lot?.condition || "used";
    const location = body?.location || lot?.collectionLocation || "Pune";
    if (!(weight > 0)) throw new HttpError(400, "Weight must be positive");
    return svc.mlEstimate(category, weight, condition, location);
  }
  if (slug[0] === "lots" && slug[2] === "request-quote") {
    needRole(session, "collector");
    return svc.requestQuoteFromRecycler(Number(slug[1]), s.sub, Number(body?.recyclerUserId));
  }
  if (path === "recyclers/match") {
    const category = String(body?.category || "PCB");
    const location = String(body?.location || "Pune");
    return { recyclers: await svc.matchRecyclers(category, location), meta: { label: "SAMPLE RECYCLERS — demo authorization" } };
  }
  if (path === "quotes") {
    needRole(session, "recycler");
    const data = quoteSchema.parse(body);
    return svc.createQuote({ ...data, recyclerUserId: s.sub, pickupAvailable: data.pickupAvailable ?? true });
  }
  if (slug[0] === "quotes" && slug[2] === "accept") {
    needRole(session, "collector");
    return svc.acceptQuote(Number(slug[1]), s.sub);
  }
  if (slug[0] === "quotes" && slug[2] === "reject") {
    needRole(session, "collector");
    return svc.rejectQuote(Number(slug[1]), s.sub);
  }
  if (slug[0] === "handovers" && slug[2] === "confirm-pickup") {
    needRole(session, "recycler");
    return svc.confirmPickup(Number(slug[1]), s.sub);
  }
  if (slug[0] === "handovers" && slug[2] === "confirm") {
    needRole(session, "recycler");
    return svc.confirmHandover(Number(slug[1]), s.sub, body?.location);
  }
  if (slug[0] === "handovers" && slug[2] === "payment") {
    needRole(session, "recycler");
    const method = ["cash", "upi", "other"].includes(body?.method) ? body.method : "cash";
    return svc.recordPayment(Number(slug[1]), s.sub, method);
  }
  if (path === "sync") {
    needRole(session, "collector");
    const items = z.array(lotSchema).max(50).parse(body?.lots ?? []);
    const created = await svc.syncLots(items.map((i) => ({ ...i, collectorId: s.sub })));
    return { synced: created.length, lots: created };
  }
  if (path === "ml/classify") {
    return { ...svc.classifyMaterial({ fileName: body?.fileName, imageSignature: body?.imageSignature, hint: body?.hint }), label: "ML PROTOTYPE" };
  }
  if (path === "ml/estimate") {
    return svc.mlEstimate(String(body?.category || "PCB"), Number(body?.weightKg || 0), String(body?.condition || "used"), String(body?.location || "Pune"));
  }
  if (path === "ml/anomaly") {
    return svc.mlAnomaly(Number(body?.rate || 0), String(body?.category || "PCB"), String(body?.location || "Pune"));
  }
  if (path === "ml/recommend") {
    return { recyclers: await svc.matchRecyclers(String(body?.category || "PCB"), String(body?.location || "Pune")), label: "ML PROTOTYPE ranking" };
  }
if (path === "admin/reset") {
  needRole(session, "admin");

  if (process.env.DISABLE_LOCAL_DEMO === "true") {
    throw new HttpError(403, "Demo reset is disabled.");
  }

  return svc.resetDemo();
}  if (path === "admin/settings") {
    needRole(session, "admin");
    return svc.setSetting(String(body?.key), body?.value, body?.label);
  }
  if (path === "admin/field-research") {
    needRole(session, "admin");
    const data = z.object({
      participantRef: z.string().min(1),
      generalLocation: z.string().min(1),
      materialHandled: z.string().min(1),
      currentProcess: z.string().optional(),
      priceAwareness: z.string().optional(),
      formalAwareness: z.string().optional(),
      challenges: z.string().optional(),
    }).parse(body);
    return svc.addFieldResearch(data);
  }
  throw new HttpError(404, "Not found");
}

async function run(req: Request, method: "GET" | "POST") {
  try {
    const url = new URL(req.url);
    const slug = url.pathname.replace(/^\/api\//, "").split("/").filter(Boolean);
    const session = await getSessionFromHeaders(req.headers);
    if (method === "GET") {
      const data = await handleGet(req, slug, url.searchParams, session);
      return NextResponse.json(data);
    }
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const data = await handlePost(req, slug, body, session);
    return NextResponse.json(data);
  } catch (e) {
    if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
    if (e instanceof z.ZodError) {
      const msg = e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      return NextResponse.json({ error: `Validation failed — ${msg}` }, { status: 400 });
    }
    if (e instanceof Error && !(e instanceof TypeError)) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("[API] error", e);
    return NextResponse.json({ error: "Server temporarily unavailable. Local Demo Mode is available." }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return run(req, "GET");
}
export async function POST(req: Request) {
  return run(req, "POST");
}
