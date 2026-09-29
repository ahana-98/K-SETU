import { NextRequest, NextResponse } from "next/server";
import { getSessionFromHeaders } from "@/lib/auth";
import {
  getLotByCode,
  metalConservationForLot,
  updateMetalRecovery,
} from "@/lib/services";

export async function GET(request: NextRequest) {
  try {
    const lotRef = request.nextUrl.searchParams.get("lotId")?.trim();

    if (!lotRef) {
      return NextResponse.json(
        { error: "A lot ID or lot code is required." },
        { status: 400 }
      );
    }

    let lotId: number;

    if (/^\d+$/.test(lotRef)) {
      lotId = Number(lotRef);

      if (!Number.isSafeInteger(lotId) || lotId <= 0) {
        return NextResponse.json(
          { error: "A valid lot ID is required." },
          { status: 400 }
        );
      }
    } else {
      const lot = await getLotByCode(lotRef);

      if (!lot) {
        return NextResponse.json(
          { error: "Lot not found." },
          { status: 404 }
        );
      }

      lotId = lot.id;
    }

    const records = await metalConservationForLot(lotId);
    return NextResponse.json({ records });
  } catch (error) {
    console.error("Metal conservation API error:", error);

    return NextResponse.json(
      { error: "Failed to fetch metal conservation records." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromHeaders(request.headers);

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    if (session.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can update metal recovery records." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, recoveredKg } = body;

    if (
      !Number.isSafeInteger(id) ||
      id <= 0 ||
      typeof recoveredKg !== "number" ||
      !Number.isFinite(recoveredKg) ||
      recoveredKg < 0
    ) {
      return NextResponse.json(
        { error: "A valid record ID and non-negative recovered weight are required." },
        { status: 400 }
      );
    }

    const updated = await updateMetalRecovery(id, recoveredKg);

    return NextResponse.json({
      message: "Recovered metal weight updated successfully.",
      record: updated,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update recovery record.";

    if (
      message === "Metal conservation record not found." ||
      message === "Recovered weight cannot exceed the estimated weight." ||
      message === "Recovered weight must be a valid non-negative number."
    ) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error("Metal recovery update error:", error);

    return NextResponse.json(
      { error: "Failed to update metal recovery record." },
      { status: 500 }
    );
  }
}