import dotenv from "dotenv";
import { eq } from "drizzle-orm";

dotenv.config({ path: ".env.local" });

import { db } from "./index";
import * as s from "./schema";
import { hashPassword } from "../lib/password";

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

const recyclerDefs = [
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
];

async function addKolkataRecyclers() {
  for (const def of recyclerDefs) {
    const email = `${def.name
      .toLowerCase()
      .replace(/[^a-z]+/g, ".")}@ksetu.demo`;

    const existing = await db
      .select()
      .from(s.users)
      .where(eq(s.users.email, email));

    if (existing.length) {
      console.log(`Already exists: ${def.name}`);
      continue;
    }

    const user = (
      await db
        .insert(s.users)
        .values({
          email,
          passwordHash: hashPassword("Recycler@123"),
          name: def.name,
          role: "recycler",
        })
        .returning()
    )[0];

    const rates: Record<string, number> = {};

    for (const material of def.mats) {
      rates[material] = Math.round(BASE_RATES[material] * 0.95);
    }

    await db.insert(s.recyclerProfiles).values({
      userId: user.id,
      name: def.name,
      facilityLocation: def.loc,
      serviceArea: def.area,
      materialsAccepted: def.mats,
      authorizationStatus: def.auth,
      authorizationDetails:
        "Demo authorization record — SAMPLE DATA",
      contact: "+91 9800000000",
      pickupAvailable: true,
      offeredRates: rates,
    });

    console.log(`Added: ${def.name}`);
  }

  console.log("Kolkata recyclers added.");
  process.exit(0);
}

addKolkataRecyclers().catch((error) => {
  console.error("Failed:", error);
  process.exit(1);
});