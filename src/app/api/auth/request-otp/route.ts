import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  DEMO_USERS,
  generateOtp,
  hashOtp,
  localDemoModeEnabled,
} from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const phone = String(body.phone ?? "").trim();

    if (!/^\+?[1-9]\d{9,14}$/.test(phone)) {
      return NextResponse.json(
        { error: "Enter a valid mobile number." },
        { status: 400 }
      );
    }

    /*
     * Local Demo Mode
     *
     * Use the same demo OTP that verify-otp/route.ts accepts.
     * This allows mobile OTP login even when the database is unavailable.
     */
    if (localDemoModeEnabled()) {
      const demoUser = DEMO_USERS[0];

      return NextResponse.json({
        message: "Demo OTP generated successfully.",
        expiresInSeconds: 300,
        demoOtp: "123456",
        demoRole: demoUser.role,
        demoPhone: phone,
      });
    }

    /*
     * Normal database OTP flow
     */
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.phone, phone))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        {
          error:
            "No K-SETU account is registered with this mobile number.",
        },
        { status: 404 }
      );
    }

    const now = Date.now();

    if (
      user.otpCreatedAt &&
      now - user.otpCreatedAt.getTime() < 30_000
    ) {
      return NextResponse.json(
        {
          error:
            "Please wait 30 seconds before requesting another OTP.",
        },
        { status: 429 }
      );
    }

    const otp = generateOtp();
    const otpHash = await hashOtp(otp);
    const expiresAt = new Date(now + 5 * 60_000);

    await db
      .update(users)
      .set({
        otpHash,
        otpExpiresAt: expiresAt,
        otpAttempts: 0,
        otpCreatedAt: new Date(now),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({
      message: "OTP generated successfully.",
      expiresInSeconds: 300,
      demoOtp: otp,
    });
  } catch (error) {
    console.error("OTP request error:", error);

    return NextResponse.json(
      { error: "Unable to generate OTP." },
      { status: 500 }
    );
  }
}