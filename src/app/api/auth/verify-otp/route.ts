import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  DEMO_USERS,
  hashOtp,
  localDemoModeEnabled,
  signSession,
  SESSION_COOKIE,
} from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const phone = String(body.phone ?? "").trim();
    const otp = String(body.otp ?? "").trim();

    if (!/^\+?[1-9]\d{9,14}$/.test(phone)) {
      return NextResponse.json(
        { error: "Enter a valid mobile number." },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { error: "Enter the 6-digit OTP." },
        { status: 400 }
      );
    }

    /*
     * Local Demo Mode
     *
     * The OTP displayed on the login page is generated client-session-side
     * for demo purposes. Accept the displayed demo OTP through a short-lived
     * client-provided value.
     *
     * For the prototype, use the fixed demo OTP:
     * 123456
     */
    if (localDemoModeEnabled() && otp === "123456") {
      const user = DEMO_USERS[0];

      const session = await signSession({
        sub: user.id,
        role: user.role,
        name: user.name,
        demo: true,
      });

      const response = NextResponse.json({
        ok: true,
        role: user.role,
        name: user.name,
        demoFallback: true,
      });

      const proto =
        req.headers.get("x-forwarded-proto") ||
        new URL(req.url).protocol.replace(":", "");

      const secure = proto === "https";

      response.cookies.set(SESSION_COOKIE, session, {
        httpOnly: true,
        sameSite: secure ? "none" : "lax",
        secure,
        partitioned: secure,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      return response;
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.phone, phone))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "No K-SETU account is registered with this mobile number." },
        { status: 404 }
      );
    }

    if (!user.otpHash || !user.otpExpiresAt) {
      return NextResponse.json(
        { error: "No active OTP. Please request a new OTP." },
        { status: 400 }
      );
    }

    if (user.otpAttempts >= 5) {
      return NextResponse.json(
        { error: "Too many incorrect attempts. Please request a new OTP." },
        { status: 429 }
      );
    }

    if (user.otpExpiresAt.getTime() < Date.now()) {
      return NextResponse.json(
        { error: "OTP has expired. Please request a new OTP." },
        { status: 400 }
      );
    }

    const submittedHash = await hashOtp(otp);

    if (submittedHash !== user.otpHash) {
      await db
        .update(users)
        .set({
          otpAttempts: user.otpAttempts + 1,
        })
        .where(eq(users.id, user.id));

      return NextResponse.json(
        { error: "Incorrect OTP." },
        { status: 401 }
      );
    }

    await db
      .update(users)
      .set({
        otpHash: null,
        otpExpiresAt: null,
        otpAttempts: 0,
        otpCreatedAt: null,
      })
      .where(eq(users.id, user.id));

    const session = await signSession({
      sub: user.id,
      role: user.role as "collector" | "recycler" | "admin",
      name: user.name,
    });

    const response = NextResponse.json({
      ok: true,
      role: user.role,
      name: user.name,
    });

    const proto =
      req.headers.get("x-forwarded-proto") ||
      new URL(req.url).protocol.replace(":", "");

    const secure = proto === "https";

    response.cookies.set(SESSION_COOKIE, session, {
      httpOnly: true,
      sameSite: secure ? "none" : "lax",
      secure,
      partitioned: secure,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("OTP verification error:", error);

    return NextResponse.json(
      { error: "Unable to verify OTP." },
      { status: 500 }
    );
  }
}