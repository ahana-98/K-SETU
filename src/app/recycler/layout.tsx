"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon, Logo, logout } from "@/components/ui";
import { useLang } from "@/lib/i18n";
import SessionGuard from "@/components/SessionGuard";

const NAV = [
  { href: "/recycler", icon: "home", key: "recy.dashboard", exact: true },
  { href: "/recycler/lots", icon: "box", key: "recy.incoming" },
  { href: "/recycler/quotes", icon: "receipt", key: "recy.quotes" },
  { href: "/recycler/handovers", icon: "truck", key: "recy.handovers" },
  { href: "/recycler/transactions", icon: "wallet", key: "recy.transactions" },
  { href: "/recycler/profile", icon: "user", key: "nav.profile" },
];

export default function RecyclerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useLang();
  const [name, setName] = useState("");
  useEffect(() => {
    fetch("/api/auth/session").then((r) => (r.ok ? r.json() : null)).then((d) => d && setName(d.name));
  }, []);

  const isActive = (n: (typeof NAV)[number]) => (n.exact ? pathname === n.href : pathname.startsWith(n.href));

  return (
    <SessionGuard>
    <div className="min-h-screen bg-paper lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col bg-forest text-white lg:flex">
        <div className="px-5 py-6"><Logo size={40} withWordmark dark /></div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition ${isActive(n) ? "bg-pine text-white" : "text-[#9DB8AA] hover:bg-white/5"}`}>
              <Icon name={n.icon} size={18} /> {t(n.key)}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <p className="truncate text-xs font-bold text-[#9DB8AA]">{name}</p>
          <button onClick={logout} className="mt-2 flex items-center gap-2 text-xs font-bold text-[#9DB8AA] hover:text-white"><Icon name="logout" size={14} /> {t("common.logout")}</button>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="bg-forest px-4 pb-2 pt-4 text-white lg:hidden">
          <div className="flex items-center justify-between">
            <Logo size={30} withWordmark dark />
            <div className="flex items-center gap-2">
              <span className="max-w-[120px] truncate text-[11px] font-bold text-[#9DB8AA]">{name}</span>
              <button onClick={logout} className="rounded-md bg-white/10 p-1.5" aria-label={t("common.logout")}><Icon name="logout" size={15} /></button>
            </div>
          </div>
          <nav className="-mx-1 mt-3 flex gap-1 overflow-x-auto no-scrollbar pb-1">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold ${isActive(n) ? "bg-pine text-white" : "bg-white/10 text-[#9DB8AA]"}`}>
                <Icon name={n.icon} size={13} /> {t(n.key)}
              </Link>
            ))}
          </nav>
        </header>

        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
    </SessionGuard>
  );
}
