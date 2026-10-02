"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon, Logo } from "@/components/ui";
import { useLang, LANGS, type Lang } from "@/lib/i18n";
import { useSync } from "@/lib/offline";
import { useToast } from "@/components/ui";
import VoiceAssistant from "@/components/VoiceAssistant";
import SessionGuard from "@/components/SessionGuard";
const NAV = [
  { href: "/collector", icon: "home", key: "nav.home", exact: true },
  { href: "/collector/sell", icon: "sell", key: "nav.sell" },
  { href: "/collector/prices", icon: "chart", key: "nav.price" },
  { href: "/collector/recyclers", icon: "factory", key: "nav.recycler" },
  { href: "/collector/earnings", icon: "wallet", key: "nav.earnings" },
];

export default function CollectorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t, lang, setLang } = useLang();
  const { push } = useToast();
  const { online, count, state } = useSync((n) => push(`${n} offline lot(s) synced`, "ok"));
  const [name, setName] = useState("");
  useEffect(() => {
    fetch("/api/auth/session").then((r) => (r.ok ? r.json() : null)).then((d) => d && setName(d.name));
  }, []);

  const nextLang = () => {
    const i = LANGS.findIndex((l) => l.code === lang);
    setLang(LANGS[(i + 1) % LANGS.length].code as Lang);
  };

  return (
    <SessionGuard>
    <div className="min-h-screen bg-paper">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-paper shadow-[0_0_40px_rgba(22,60,51,0.06)]">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-forest px-4 pb-3 pt-4 text-white">
          <div className="flex items-center justify-between">
            <Logo size={34} withWordmark dark />
            <div className="flex items-center gap-1.5">
              <span
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold ${online ? "bg-white/10 text-[#9fe08a]" : "bg-warn text-white"}`}
                title={online ? t("common.online") : t("common.offline")}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-leaf pulse-dot" : "bg-white"}`} />
                {online ? (state === "syncing" ? t("common.syncing") : count ? `${t("common.pendingSync")} (${count})` : t("common.synced")) : t("common.offline")}
              </span>
              <button onClick={nextLang} className="rounded-md bg-white/10 px-2 py-1 text-[10px] font-bold text-white" aria-label="change language">
                {lang.toUpperCase()}
              </button>
              <Link href="/collector/profile" className="rounded-md bg-white/10 p-1.5 text-white" aria-label={t("nav.profile")}>
                <Icon name="user" size={15} />
              </Link>
            </div>
          </div>
        </header>

        {!online && (
          <div className="flex items-center gap-2 bg-warn px-4 py-1.5 text-[11px] font-bold text-white">
            <Icon name="alert" size={13} /> {t("common.offline")}
          </div>
        )}

        <main className="flex-1 px-4 pb-28 pt-4">{children}</main>

        {/* Bottom nav */}
        <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md border-t border-[#dcebe0] bg-white pb-[env(safe-area-inset-bottom)]">
          <div className="grid grid-cols-5">
            {NAV.map((n) => {
              const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
              return (
                <Link key={n.href} href={n.href} className={`flex min-h-[60px] flex-col items-center justify-center gap-1 ${active ? "text-pine" : "text-sage"}`}>
                  <span className={`rounded-lg px-3 py-1 ${active ? "bg-mint" : ""}`}><Icon name={n.icon} size={21} /></span>
                  <span className="text-[10px] font-bold">{t(n.key)}</span>
                </Link>
              );
            })}
          </div>
       </nav>

        {/* Voice Assistant */}
        <VoiceAssistant mode="collector" />
      </div>
    </div>
    </SessionGuard>
  );
}