import { NextResponse } from "next/server";
import { getSessionFromHeaders } from "@/lib/auth";
import { verifyHandoverOtp } from "@/lib/services";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromHeaders(req.headers);

    if (!session || session.role !== "recycler") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    const otp = String(body.otp ?? "").trim();

    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { error: "Enter a valid 6-digit OTP." },
        { status: 400 }
      );
    }

    const result = await verifyHandoverOtp(
      Number(id),
      otp,
      session.sub
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Handover OTP verification error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to verify handover OTP.",
      },
      { status: 400 }
    );
  }
}