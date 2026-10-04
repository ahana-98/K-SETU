import { NextResponse } from "next/server";
import { getSessionFromHeaders } from "@/lib/auth";
import { syncLots, type CreateLotInput } from "@/lib/services";

export async function POST(req: Request) {
  try {
    const session = await getSessionFromHeaders(req.headers);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.role !== "collector") {
      return NextResponse.json(
        { error: "Only collectors can sync lots" },
        { status: 403 }
      );
    }

    const body = await req.json();

    if (!body || !Array.isArray(body.lots)) {
      return NextResponse.json(
        { error: "Invalid sync payload" },
        { status: 400 }
      );
    }

    const lots: CreateLotInput[] = body.lots.map((item: any) => ({
      ...item,
      collectorId: session.sub,
    }));

    const created = await syncLots(lots);

    return NextResponse.json({
      ok: true,
      synced: created.length,
      lots: created,
    });
  } catch (error) {
    console.error("Sync failed:", error);

    return NextResponse.json(
      { error: "Sync failed" },
      { status: 500 }
    );
  }
}