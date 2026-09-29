import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { localDemoModeEnabled } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  let database = "OFFLINE";
  try {
    await db.execute(sql`select 1`);
    database = "CONNECTED";
  } catch {
    database = "OFFLINE";
  }
  return NextResponse.json({
    app: "K-SETU",
    tagline: "COLLECT • CONNECT • RECYCLE",
    api: "ONLINE",
    database,
    mlService: "AVAILABLE (prototype heuristic)",
    localStorage: "AVAILABLE",
    localDemo: localDemoModeEnabled() ? "READY" : "DISABLED",
    time: new Date().toISOString(),
  });
}
