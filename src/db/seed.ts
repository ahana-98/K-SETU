// K-SETU demo seed. All data is fictional / synthetic DEMO DATA.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { db } from "./index";
import * as s from "./schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../lib/password";
import { CATEGORIES } from "../lib/ml";

// Deterministic pseudo-random for reproducible demo data.
function rng(seed: number) {
  let x = seed;
  return () => {
    x = (x * 1664525 + 1013904223) % 4294967296;
    return x / 4294967296;
  };
}

const BASE_RATES: Record<string, number> = {
  CRT: 18,
  "LCD/LED Panels": 45,
  PCB: 180,
  Cables: 120,
  Batteries: 55,
  Motors: 70,
  "Magnet-bearing Assemblies": 90,
  "Mixed Plastics": 12,
  Copper: 420,
  Aluminium: 110,
  "Other E-Waste": 25,
};

const LOCATIONS = ["Pune", "Mumbai", "Nashik", "Nagpur", "Thane"];

const SAFETY_TOPICS: { key: string; icon: string; en: [string, string]; hi: [string, string]; mr: [string, string] }[] = [
  { key: "burn", icon: "nofire", en: ["Do not burn cables", "Burning cables releases toxic fumes that damage lungs and soil. Sell cables whole to authorized recyclers instead."], hi: ["तार न जलाएं", "तार जलाने से ज़हरीली गैस निकलती है जो फेफड़ों और मिट्टी को नुकसान पहुंचाती है। तार बिना जलाए अधिकृत रीसाइक्लर को बेचें।"], mr: ["तार जाळू नका", "तार जाळल्याने विषारी वायू निघतो जो फुफ्फुस आणि मातीचे नुकसान करतो. तार जाळण्याऐवजी अधिकृत रीसायक्लरला विका."]},
  { key: "acid", icon: "noacid", en: ["Avoid unsafe acid processing", "Never use open acid baths to extract metal. Acid fumes and waste cause severe injury and pollution."], hi: ["असुरक्षित एसिड प्रक्रिया से बचें", "धातु निकालने के लिए खुले एसिड का उपयोग कभी न करें। एसिड के धुएं और अपशिष्ट से गंभीर चोट और प्रदूषण होता है।"], mr: ["असुरक्षित आम्ल प्रक्रिया टाळा", "धातू काढण्यासाठी उघडे आम्ल कधीही वापरू नका. आम्लाच्या धुरामुळे आणि सांडपामुळे गंभीर इजा व प्रदूषण होते."]},
  { key: "battery", icon: "battery", en: ["Safe battery handling", "Tape battery terminals, keep swollen or leaking batteries separate, and never puncture them."], hi: ["सुरक्षित बैटरी handling", "बैटरी के सिरों को टेप करें, फूली या लीक होती बैटरी अलग रखें, और कभी छेद न करें।"], mr: ["सुरक्षित बॅटरी हाताळणी", "बॅटरीचे टोक टेप करा, फुगलेल्या किंवा गळणाऱ्या बॅटरी वेगळ्या ठेवा, कधीही छिद्र पाडू नका."]},
  { key: "crt", icon: "crt", en: ["Safe CRT handling", "CRT screens contain lead and can implode. Carry them upright and do not break the glass."], hi: ["सुरक्षित CRT handling", "CRT स्क्रीन में सीसा होता है और यह फट सकती है। इसे सीधा रखकर ले जाएं और कांच न तोड़ें।"], mr: ["सुरक्षित CRT हाताळणी", "CRT स्क्रीनमध्ये शिसे असते आणि ती फुटू शकते. ती उभी ठेवा आणि काच फोडू नका."]},
  { key: "ppe", icon: "gloves", en: ["Use protective equipment", "Wear gloves, a mask and safety glasses while sorting e-waste to avoid cuts and dust."], hi: ["सुरक्षा उपकरण उपयोग करें", "ई-कचरा छांटते समय दस्ताने, मास्क और सुरक्षा चश्मा पहनें — कट और धूल से बचाव होगा।"], mr: ["संरक्षक साधने वापरा", "ई-कचरा वर्ग करताना हातमोजे, मास्क आणि सुरक्षा चष्मा वापरा — कट आणि धुळीपासून बचाव."]},
  { key: "transport", icon: "truck", en: ["Safe transportation", "Stack loads evenly, tie down loose items, and keep batteries away from heat during transport."], hi: ["सुरक्षित परिवहन", "वज़न बराबर बांधें, ढीली चीज़ें बांधें, और ढुलाई में बैटरी को गर्मी से दूर रखें।"], mr: ["सुरक्षित वाहतूक", "वजन सारखे बांधा, सैल वस्तू बांधा, आणि वाहतुकीत बॅटरी उष्णतेपासून दूर ठेवा."]},
  { key: "dismantle", icon: "tool", en: ["Avoid hazardous dismantling", "Do not break open compressors, panels or tubes by hand. Use authorized recyclers for safe dismantling."], hi: ["खतरनाक खोलने से बचें", "कंप्रेसर, पैनल या ट्यूब को हाथ से न तोड़ें। सुरक्षित खोलने के लिए अधिकृत रीसाइक्लर का उपयोग करें।"], mr: ["धोकादायक सुटे करणे टाळा", "कम्प्रेसर, पॅनेल किंवा ट्यूब हाताने फोडू नका. सुरक्षित सुटे करण्यासाठी अधिकृत रीसायक्लर वापरा."]},
  { key: "wash", icon: "wash", en: ["Wash hands after work", "Always wash hands with soap after handling e-waste, before eating or touching your face."], hi: ["काम के बाद हाथ धोएं", "ई-कचरा छूने के बाद, खाने से पहले हमेशा साबुन से हाथ धोएं।"], mr: ["कामानंतर हात धुवा", "ई-कचरा हाताळल्यानंतर, जेवण्यापूर्वी नेहमी साबणाने हात धुवा."]},
];

export async function seedDatabase() {
  const admins = await db.select().from(s.users).where(eq(s.users.email, "admin@ksetu.demo"));
if (admins.length) {
  // Repair missing reference/demo data without reseeding users or lots.
  const safetyRows = await db
    .select({ id: s.safetyContent.id })
    .from(s.safetyContent)
    .limit(1);

  if (safetyRows.length === 0) {
    for (const t of SAFETY_TOPICS) {
      await db.insert(s.safetyContent).values([
        { topicKey: t.key, iconKey: t.icon, lang: "en", title: t.en[0], body: t.en[1] },
        { topicKey: t.key, iconKey: t.icon, lang: "hi", title: t.hi[0], body: t.hi[1] },
        { topicKey: t.key, iconKey: t.icon, lang: "mr", title: t.mr[0], body: t.mr[1] },
      ]);
    }
  }

  const settingsRows = await db
    .select({ key: s.appSettings.key })
    .from(s.appSettings)
    .where(eq(s.appSettings.key, "unit_economics"))
    .limit(1);

if (settingsRows.length === 0) {
    await db.insert(s.appSettings).values([
      {
        key: "unit_economics",
        label: "Unit economics assumptions (DEMO DATA)",
        value: {
          avgTransactionValue: 1450,
          formalChannelValue: 1720,
          platformOperatingCost: 60,
          transactionCost: 25,
          potentialPlatformRevenue: 45,
          collectorBenefit: 270,
          currency: "INR",
          note: "ASSUMPTION — hypothetical values for prototype demonstration, not field research.",
        },
      },
    ]);
  }

  const researchRows = await db
    .select({ id: s.fieldResearch.id })
    .from(s.fieldResearch)
    .limit(1);

  if (researchRows.length === 0) {
    await db.insert(s.fieldResearch).values([
      {
        participantRef: "SAMPLE-FR-001",
        generalLocation: "Pune — informal scrap market",
        materialHandled: "Mixed e-waste, cables, PCB",
        currentProcess: "Sells to local aggregator without price reference",
        priceAwareness: "Low — accepts first offer",
        formalAwareness: "Unaware of authorized recyclers",
        challenges: "No price transparency; unsafe cable burning observed",
      },
      {
        participantRef: "SAMPLE-FR-002",
        generalLocation: "Mumbai — door-to-door collector",
        materialHandled: "CRT, plastics, motors",
        currentProcess: "Weekly route, cash settlement",
        priceAwareness: "Medium — compares 2 buyers",
        formalAwareness: "Heard of recyclers but no direct contact",
        challenges: "Transport cost; no receipt or traceability",
      },
    ]);
  }

  return;
}  const r = rng(20260101);
  const now = Date.now();
  const daysAgo = (d: number) => new Date(now - d * 86400_000);

  // ---- Users (demo accounts first so fresh DB gives ids 1,2,3) ----
  const demoCollector = (await db.insert(s.users).values({ email: "collector@ksetu.demo", passwordHash: hashPassword("Collector@123"), name: "Ramesh Kumar", role: "collector" }).returning())[0];
  const demoRecycler = (await db.insert(s.users).values({ email: "recycler@ksetu.demo", passwordHash: hashPassword("Recycler@123"), name: "GreenCycle Recyclers", role: "recycler" }).returning())[0];
  await db.insert(s.users).values({ email: "admin@ksetu.demo", passwordHash: hashPassword("Admin@123"), name: "K-SETU Admin", role: "admin" });

  const collectorNames = ["Sunita Devi", "Arjun Pawar", "Meena Tai", "Vikas Jadhav", "Farhan Shaikh", "Lakshmi Bai", "Ganesh More", "Pooja Shinde", "Dattu Kale", "Reshma Patil"];
  const collectorUsers = [demoCollector];
  for (const name of collectorNames) {
    const u = (await db.insert(s.users).values({ email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@ksetu.demo`, passwordHash: hashPassword("Collector@123"), name, role: "collector" }).returning())[0];
    collectorUsers.push(u);
  }
  for (const u of collectorUsers) {
    await db.insert(s.collectorProfiles).values({ userId: u.id, generalLocation: LOCATIONS[Math.floor(r() * LOCATIONS.length)], operatingSince: String(2015 + Math.floor(r() * 9)) });
  }

  const recyclerDefs = [
    { name: "GreenCycle Recyclers", loc: "Pune", area: "Pune", auth: "demo_authorized", mats: ["PCB", "Cables", "Copper", "LCD/LED Panels"] },
    { name: "EcoShred Industries", loc: "Mumbai", area: "Mumbai", auth: "demo_authorized", mats: ["PCB", "Copper", "Aluminium", "Motors"] },
    { name: "UrbanOre Processing", loc: "Pune", area: "Pune", auth: "demo_authorized", mats: ["CRT", "LCD/LED Panels", "Mixed Plastics"] },
    { name: "CleanStream Metals", loc: "Nashik", area: "Nashik", auth: "pending", mats: ["Copper", "Aluminium", "Cables", "Motors"] },
    { name: "ReEarth E-Recycling", loc: "Nagpur", area: "Nagpur", auth: "demo_authorized", mats: ["Batteries", "PCB", "Other E-Waste"] },
    { name: "GreenBridge Aggregators", loc: "Thane", area: "Thane", auth: "pending", mats: ["Mixed Plastics", "CRT", "Magnet-bearing Assemblies"] },
    {
  name: "Kolkata Green Recycling",
  loc: "Kolkata",
  area: "Kolkata",
  auth: "demo_authorized",
  mats: ["PCB", "Cables", "Copper", "LCD/LED Panels"],
},
{
  name: "Bengal E-Waste Solutions",
  loc: "Kolkata",
  area: "Kolkata",
  auth: "demo_authorized",
  mats: ["CRT", "PCB", "Motors", "Other E-Waste"],
},
    { name: "PureLoop Resources", loc: "Pune", area: "Pune", auth: "demo_authorized", mats: ["Cables", "Copper", "PCB", "Batteries"] },
    { name: "Samridhi Scrap Solutions", loc: "Mumbai", area: "Mumbai", auth: "demo_authorized", mats: ["Motors", "Magnet-bearing Assemblies", "Aluminium"] },
  ];
  const recyclerUsers: { userId: number; def: (typeof recyclerDefs)[number] }[] = [{ userId: demoRecycler.id, def: recyclerDefs[0] }];
  for (const def of recyclerDefs.slice(1)) {
    const u = (await db.insert(s.users).values({ email: `${def.name.toLowerCase().replace(/[^a-z]+/g, ".")}@ksetu.demo`, passwordHash: hashPassword("Recycler@123"), name: def.name, role: "recycler" }).returning())[0];
    recyclerUsers.push({ userId: u.id, def });
  }
  for (const { userId, def } of recyclerUsers) {
    const rates: Record<string, number> = {};
    for (const m of def.mats) rates[m] = Math.round(BASE_RATES[m] * (0.9 + r() * 0.15));
    await db.insert(s.recyclerProfiles).values({
      userId,
      name: def.name,
      facilityLocation: def.loc,
      serviceArea: def.area,
      materialsAccepted: def.mats,
      authorizationStatus: def.auth,
      authorizationDetails: def.auth === "demo_authorized" ? "Demo authorization record (CPCB-style) — SAMPLE DATA" : "Authorization pending — SAMPLE DATA",
      contact: `+91 98${Math.floor(10000000 + r() * 89999999)}`,
      pickupAvailable: r() > 0.25,
      offeredRates: rates,
    });
  }

  // ---- Material catalog ----
  for (const c of CATEGORIES) {
    await db.insert(s.materialCatalog).values({ category: c.key, iconKey: c.iconKey, description: `${c.key} — common informal-collection e-waste category`, unit: "kg" });
  }

  // ---- Prices + history ----
  for (const c of CATEGORIES) {
    for (const loc of ["Pune", "Mumbai", "Nashik"]) {
      const base = BASE_RATES[c.key];
      const jitter = 0.92 + r() * 0.16;
      const buying = Math.round(base * jitter);
      const trend = r() > 0.6 ? "up" : r() > 0.4 ? "down" : "stable";
      await db.insert(s.prices).values({ category: c.key, location: loc, buyingRate: buying, minRate: Math.round(buying * 0.88), maxRate: Math.round(buying * 1.12), unit: "kg", trend });
      // 13 weekly points over ~90 days
      let rate = buying * (0.86 + r() * 0.08);
      for (let w = 12; w >= 0; w--) {
        rate = rate * (1 + (r() - 0.47) * 0.04);
        rate = Math.max(base * 0.6, Math.min(base * 1.4, rate));
        await db.insert(s.priceHistory).values({ category: c.key, location: loc, date: daysAgo(w * 7), rate: Math.round(rate) });
      }
    }
  }

  // ---- Lots + transactions + ledger + trace ----
  const conds = ["good", "used", "damaged", "mixed", "unknown"];
  let lotSeq = 124;
  let txSeq = 1;
  for (let i = 0; i < 34; i++) {
    const collector = collectorUsers[Math.floor(r() * collectorUsers.length)];
    const cat = CATEGORIES[Math.floor(r() * CATEGORIES.length)].key;
    const loc = LOCATIONS[Math.floor(r() * LOCATIONS.length)];
    const weight = Math.round((2 + r() * 18) * 10) / 10;
    const cond = conds[Math.floor(r() * conds.length)];
    const base = BASE_RATES[cat];
    const est = Math.round(weight * base * 0.85);
    const created = daysAgo(Math.floor(r() * 120));
    const statusRoll = r();
    const status = statusRoll < 0.18 ? "open" : statusRoll < 0.3 ? "quoted" : statusRoll < 0.45 ? "accepted" : statusRoll < 0.6 ? "handover" : "completed";
    const lotCode = `KS-2026-${String(lotSeq++).padStart(6, "0")}`;
    const [lot] = await db.insert(s.lots).values({
      lotCode, collectorId: collector.id, category: cat, weightKg: weight, condition: cond,
      collectionLocation: loc, estimatedValue: est, status,
      description: `Collected ${cat.toLowerCase()} from local households`, createdAt: created,
    }).returning();
    await db.insert(s.traceEvents).values([
      { lotId: lot.id, stage: "collected", label: "Material collected", location: loc, ref: lotCode, at: created },
      { lotId: lot.id, stage: "lot", label: `Lot ${lotCode} created`, location: loc, ref: lotCode, at: created },
    ]);

    if (status !== "open") {
      const rec = recyclerUsers.filter((x) => x.def.mats.includes(cat));
      const pick = rec.length ? rec[Math.floor(r() * rec.length)] : recyclerUsers[0];
      const rate = Math.round(base * (0.88 + r() * 0.18));
      const [q] = await db.insert(s.quotes).values({ lotId: lot.id, recyclerId: pick.userId, ratePerKg: rate, pickupAvailable: r() > 0.3, notes: "Standard demo quote", createdAt: new Date(created.getTime() + 86400_000), status: status === "quoted" ? "pending" : "accepted" }).returning();
      await db.insert(s.traceEvents).values({ lotId: lot.id, stage: "quote", label: "Quote received", ref: `Q-${q.id}`, at: new Date(created.getTime() + 86400_000) });

      if (status !== "quoted") {
        const finalPrice = Math.round(rate * weight * 0.85);
        const handoverRef = `HS-2026-${String(txSeq).padStart(5, "0")}`;
        const txCode = `TX-2026-${String(txSeq).padStart(5, "0")}`;
        txSeq++;
        const payStatus = status === "completed" ? "paid" : "pending";
        const [tx] = await db.insert(s.transactions).values({
          txCode, handoverRef, lotId: lot.id, collectorId: collector.id, recyclerId: pick.userId, quoteId: q.id,
          quotedPrice: Math.round(rate * weight), finalPrice, collectionLocation: loc, handoverLocation: loc,
          paymentMethod: r() > 0.5 ? "cash" : "upi", paymentStatus: payStatus,
          status: status === "completed" ? "completed" : status, createdAt: new Date(created.getTime() + 2 * 86400_000),
        }).returning();
        await db.insert(s.ledgerEntries).values({ collectorId: collector.id, txId: tx.id, lotId: lot.id, category: cat, weightKg: weight, amount: finalPrice, status: payStatus, recyclerName: pick.def.name, createdAt: tx.createdAt });
        await db.insert(s.traceEvents).values([
          { lotId: lot.id, txId: tx.id, stage: "selected", label: "Recycler selected", ref: handoverRef, at: new Date(created.getTime() + 2 * 86400_000) },
          { lotId: lot.id, txId: tx.id, stage: "handover", label: "Handover", location: loc, ref: handoverRef, at: new Date(created.getTime() + 3 * 86400_000) },
          { lotId: lot.id, txId: tx.id, stage: "confirmed", label: "Recycler confirmed", ref: handoverRef, at: new Date(created.getTime() + 3 * 86400_000) },
          ...(status === "completed" ? [
            { lotId: lot.id, txId: tx.id, stage: "payment", label: `Payment completed (${tx.paymentMethod.toUpperCase()})`, ref: handoverRef, at: new Date(created.getTime() + 5 * 86400_000) },
            { lotId: lot.id, txId: tx.id, stage: "recycling", label: "Sent to formal recycling", ref: handoverRef, at: new Date(created.getTime() + 6 * 86400_000) },
          ] : []),
        ]);
      }
    }
  }

  // ---- Safety content ----
  for (const t of SAFETY_TOPICS) {
    await db.insert(s.safetyContent).values([
      { topicKey: t.key, iconKey: t.icon, lang: "en", title: t.en[0], body: t.en[1] },
      { topicKey: t.key, iconKey: t.icon, lang: "hi", title: t.hi[0], body: t.hi[1] },
      { topicKey: t.key, iconKey: t.icon, lang: "mr", title: t.mr[0], body: t.mr[1] },
    ]);
  }

  // ---- Unit economics assumptions (clearly labeled) ----
  await db.insert(s.appSettings).values([
    { key: "unit_economics", label: "Unit economics assumptions (DEMO DATA)", value: {
      avgTransactionValue: 1450, formalChannelValue: 1720, platformOperatingCost: 60, transactionCost: 25, potentialPlatformRevenue: 45, collectorBenefit: 270, currency: "INR", note: "ASSUMPTION — hypothetical values for prototype demonstration, not field research." } },
  ]);

  // ---- Field research samples (clearly labeled SAMPLE) ----
  await db.insert(s.fieldResearch).values([
    { participantRef: "SAMPLE-FR-001", generalLocation: "Pune — informal scrap market", materialHandled: "Mixed e-waste, cables, PCB", currentProcess: "Sells to local aggregator without price reference", priceAwareness: "Low — accepts first offer", formalAwareness: "Unaware of authorized recyclers", challenges: "No price transparency; unsafe cable burning observed" },
    { participantRef: "SAMPLE-FR-002", generalLocation: "Mumbai — door-to-door collector", materialHandled: "CRT, plastics, motors", currentProcess: "Weekly route, cash settlement", priceAwareness: "Medium — compares 2 buyers", formalAwareness: "Heard of recyclers but no direct contact", challenges: "Transport cost; no receipt or traceability" },
  ]);
}

// CLI entrypoint: `npx tsx src/db/seed.ts`
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log("K-SETU seed complete (demo data).");
      process.exit(0);
    })
    .catch((e) => {
      console.error("Seed failed:", e);
      process.exit(1);
    });
}
