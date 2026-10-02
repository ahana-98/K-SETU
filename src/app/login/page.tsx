"use client";

import { useState } from "react";
import { Btn, Card, Icon, Logo, Spinner, inputCls, Field, DemoTag } from "@/components/ui";
import { useLang, LANGS, type Lang } from "@/lib/i18n";
import { DEMO_USERS, SESSION_COOKIE, signSession, roleHome } from "@/lib/auth";
import VoiceAssistant from "@/components/VoiceAssistant";

export default function LoginPage() {
  const { t, lang, setLang } = useLang();

  const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [demoOtp, setDemoOtp] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  async function clientDemoFallback(demo: (typeof DEMO_USERS)[number]) {
    const token = await signSession({
      sub: demo.id,
      role: demo.role,
      name: demo.name,
      demo: true,
    });

    const secure = window.location.protocol === "https:";

    document.cookie =
      `${SESSION_COOKIE}=${token}; path=/; max-age=604800; ` +
      `SameSite=${secure ? "None" : "Lax"}` +
      `${secure ? "; Secure; Partitioned" : ""}`;

    setDemoMode(true);
    window.location.href = roleHome(demo.role);
  }

  async function requestOtp() {
    setError(null);
    setBusy("otp");

    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || "Unable to send OTP.");
        return;
      }

      setDemoOtp(data?.demoOtp || "");
      setOtpSent(true);
    } catch {
      setError("Unable to connect to the authentication server.");
    } finally {
      setBusy(null);
    }
  }

  async function verifyOtp() {
    setError(null);
    setBusy("verify");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          otp: otp.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || "Unable to verify OTP.");
        return;
      }

      window.location.href = roleHome(data.role);
    } catch {
      setError("Unable to connect to the authentication server.");
    } finally {
      setBusy(null);
    }
  }

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();

    if (!otpSent) {
      await requestOtp();
    } else {
      await verifyOtp();
    }
  }

  async function submitEmailPassword(e: React.FormEvent) {
  e.preventDefault();
  setError(null);
  setBusy("email");

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data?.error || "Invalid email or password.");
      return;
    }

    if (data.demoFallback) {
      setDemoMode(true);
    }

    window.location.href = data.redirect || "/";
  } catch {
    setError("Unable to connect to the authentication server.");
  } finally {
    setBusy(null);
  }
}
  async function submitDemoRole(demoRole: string) {
    setError(null);
    setBusy(demoRole);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demoRole }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || t("login.error"));
        return;
      }

      if (data.demoFallback) setDemoMode(true);
      window.location.href = data.redirect || "/";
    } catch {
      const demo = DEMO_USERS.find((d) => d.role === demoRole);

      if (demo) {
        await clientDemoFallback(demo);
      } else {
        setError(t("login.serverDown"));
      }
    } finally {
      setBusy(null);
    }
  }

  function handleVoiceRole(role: "collector" | "recycler" | "admin") {
    submitDemoRole(role);
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper lg:flex-row">
      {/* Brand panel */}
      <div className="flex flex-col justify-between bg-forest px-6 py-8 text-white lg:w-[44%] lg:px-12 lg:py-12">
        <Logo size={52} withWordmark dark />

        <div className="my-8 hidden lg:block">
          <p className="max-w-md text-lg font-semibold leading-relaxed text-[#DCEBE0]">
            {t("app.desc")}
          </p>

          <div className="mt-8 grid grid-cols-3 gap-3 text-center">
            {[
              { icon: "sell", label: "Collect" },
              { icon: "factory", label: "Connect" },
              { icon: "leaf", label: "Recycle" },
            ].map((f) => (
              <div key={f.label} className="rounded-xl bg-white/5 px-3 py-4">
                <span className="mx-auto mb-2 block w-fit text-leaf">
                  <Icon name={f.icon} size={26} />
                </span>
                <span className="text-xs font-bold tracking-widest text-[#9DB8AA]">
                  {f.label.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-[#7FA192]">
          Smart India Hackathon 2026 • Prototype build •{" "}
          <DemoTag>DEMO DATA</DemoTag>
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <Logo size={44} withWordmark />
          </div>

          <Card className="p-6 sm:p-8">
            <h1 className="text-xl font-extrabold text-forest">
              {t("login.title")}
            </h1>

            <p className="mt-1 text-sm text-sage lg:hidden">
              {t("app.desc")}
            </p>

            {/* Language selector */}
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sage">
                <Icon name="globe" size={16} />
              </span>

              <div className="flex gap-1 rounded-lg bg-mint p-1">
                {LANGS.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setLang(l.code as Lang)}
                    className={`rounded-md px-3 py-1 text-xs font-bold transition ${
                      lang === l.code
                        ? "bg-pine text-white"
                        : "text-sage"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={submit} className="mt-5 space-y-4">
              <Field label="Mobile number">
                <input
                  className={inputCls}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+919999999999"
                  disabled={otpSent}
                  required
                />
              </Field>

              {otpSent && (
                <Field label="6-digit OTP">
                  <input
                    className={inputCls}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="Enter OTP"
                    required
                  />
                </Field>
              )}

              {demoOtp && otpSent && (
                <div className="rounded-lg border border-warn/30 bg-warnbg px-3 py-2 text-xs font-semibold text-warn">
                  Demo OTP: <span className="font-extrabold">{demoOtp}</span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-dangerbg px-3 py-2 text-sm font-semibold text-danger">
                  <Icon name="alert" size={15} />
                  {error}
                </div>
              )}

              {demoMode && (
                <div className="rounded-lg border border-warn/30 bg-warnbg px-3 py-2 text-xs font-semibold text-warn">
                  {t("login.demoMode")}
                </div>
              )}

              <Btn
                type="submit"
                full
                size="lg"
                disabled={busy !== null}
              >
                {busy ? (
                  <Spinner />
                ) : (
                  <Icon
                    name={otpSent ? "shield" : "logout"}
                    size={18}
                    className={otpSent ? "" : "rotate-180"}
                  />
                )}

                {busy === "otp"
                  ? "Sending OTP..."
                  : busy === "verify"
                    ? "Verifying..."
                    : otpSent
                      ? "Verify OTP"
                      : "Send OTP"}
              </Btn>

              {otpSent && (
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp("");
                    setDemoOtp("");
                    setError(null);
                  }}
                  className="w-full text-center text-xs font-bold text-pine hover:underline"
                >
                  Change mobile number
                </button>
              )}
            </form>

<div className="my-5 flex items-center gap-3">
  <span className="h-px flex-1 bg-[#dcebe0]" />
  <span className="text-[11px] font-bold tracking-widest text-sage">
    OR LOGIN WITH EMAIL
  </span>
  <span className="h-px flex-1 bg-[#dcebe0]" />
</div>

<form onSubmit={submitEmailPassword} className="space-y-4">
  <Field label="Email address">
    <input
      className={inputCls}
      type="email"
      autoComplete="username"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      placeholder="you@example.com"
      required
      disabled={busy !== null}
    />
  </Field>

  <Field label="Password">
    <input
      className={inputCls}
      type="password"
      autoComplete="current-password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      placeholder="Enter your password"
      required
      disabled={busy !== null}
    />
  </Field>

  <Btn
    type="submit"
    full
    size="lg"
    disabled={busy !== null}
  >
    {busy === "email" ? (
      <Spinner />
    ) : (
      <Icon name="lock" size={18} />
    )}
    {busy === "email" ? "Signing in..." : "Login with Email"}
  </Btn>
</form>
            <div className="my-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-[#dcebe0]" />
              <span className="text-[11px] font-bold tracking-widest text-sage">
                {t("login.demo")} • {t("login.demoOnly")}
              </span>
              <span className="h-px flex-1 bg-[#dcebe0]" />
            </div>

            <div className="grid gap-2">
              <Btn
                variant="primary"
                full
                disabled={busy !== null}
                onClick={() => submitDemoRole("collector")}
              >
                {busy === "collector" ? (
                  <Spinner />
                ) : (
                  <Icon name="user" size={18} />
                )}
                {t("login.asCollector")}
              </Btn>

              <Btn
                variant="secondary"
                full
                disabled={busy !== null}
                onClick={() => submitDemoRole("recycler")}
              >
                {busy === "recycler" ? (
                  <Spinner />
                ) : (
                  <Icon name="factory" size={18} />
                )}
                {t("login.asRecycler")}
              </Btn>

              <Btn
                variant="outline"
                full
                disabled={busy !== null}
                onClick={() => submitDemoRole("admin")}
              >
                {busy === "admin" ? (
                  <Spinner />
                ) : (
                  <Icon name="shield" size={18} />
                )}
                {t("login.asAdmin")}
              </Btn>
            </div>

            <p className="mt-3 text-center text-[10px] text-sage">
              OTP login is enabled for registered mobile numbers.
            </p>
          </Card>
        </div>
      </div>

      <VoiceAssistant
        mode="login"
        onRoleSelect={handleVoiceRole}
      />
    </div>
  );
}