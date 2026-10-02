import "dotenv/config";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "./index";
import * as s from "./schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../lib/password";

const demoUsers = [
  {
    email: "collector@ksetu.demo",
    password: "Collector@123",
    name: "Ramesh Kumar",
    role: "collector",
  },
  {
    email: "recycler@ksetu.demo",
    password: "Recycler@123",
    name: "GreenCycle Recyclers",
    role: "recycler",
  },
  {
    email: "admin@ksetu.demo",
    password: "Admin@123",
    name: "K-SETU Admin",
    role: "admin",
  },
] as const;

async function seedDemoUsers() {
  for (const demo of demoUsers) {
    const existing = await db
      .select()
      .from(s.users)
      .where(eq(s.users.email, demo.email));

    let userId: number;

    if (existing.length > 0) {
      userId = existing[0].id;
      console.log(`Already exists: ${demo.email}`);
    } else {
      const [user] = await db
        .insert(s.users)
        .values({
          email: demo.email,
          passwordHash: hashPassword(demo.password),
          name: demo.name,
          role: demo.role,
        })
        .returning({ id: s.users.id });

      userId = user.id;
      console.log(`Created: ${demo.email}`);
    }

    // Create a basic profile if one does not already exist.
    if (demo.role === "collector") {
      const profiles = await db
        .select({ id: s.collectorProfiles.id })
        .from(s.collectorProfiles)
        .where(eq(s.collectorProfiles.userId, userId));

      if (profiles.length === 0) {
        await db.insert(s.collectorProfiles).values({
          userId,
          generalLocation: "Kolkata",
          operatingSince: "2024",
        });
      }
    }

    if (demo.role === "recycler") {
      const profiles = await db
        .select({ id: s.recyclerProfiles.id })
        .from(s.recyclerProfiles)
        .where(eq(s.recyclerProfiles.userId, userId));

      if (profiles.length === 0) {
        await db.insert(s.recyclerProfiles).values({
          userId,
          name: demo.name,
          facilityLocation: "Kolkata",
          serviceArea: "Kolkata",
          materialsAccepted: ["PCB", "Cables", "Copper"],
          authorizationStatus: "pending",
          authorizationDetails: "Demo profile — sample data",
          contact: "+910000000000",
          pickupAvailable: true,
          offeredRates: {
            PCB: 180,
            Cables: 120,
            Copper: 420,
          },
        });
      }
    }
  }

  console.log("Demo user seeding completed.");
}

seedDemoUsers()
  .then(async () => {
    await db.$client.end();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Demo user seeding failed:", error);
    await db.$client.end();
    process.exit(1);
  });