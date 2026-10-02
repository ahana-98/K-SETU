"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon, Logo, logout } from "@/components/ui";
import { useLang } from "@/lib/i18n";
import SessionGuard from "@/components/SessionGuard";

const NAV = [
  { href: "/admin", icon: "home", key: "admin.dashboard", exact: true },
  { href: "/admin/analytics", icon: "chart", key: "admin.analytics" },
  { href: "/admin/records", icon: "box", key: "admin.records" },
  { href: "/admin/insights", icon: "info", key: "admin.insights" },
  { href: "/admin/system", icon: "shield", key: "admin.system" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useLang();
  const [drawer, setDrawer] = useState(false);
  const isActive = (n: (typeof NAV)[number]) => (n.exact ? pathname === n.href : pathname.startsWith(n.href));

  const Nav = (
    <nav className="flex-1 space-y-1 px-3">
      {NAV.map((n) => (
        <Link key={n.href} href={n.href} onClick={() => setDrawer(false)} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition ${isActive(n) ? "bg-pine text-white" : "text-[#9DB8AA] hover:bg-white/5"}`}>
          <Icon name={n.icon} size={18} /> {t(n.key)}
        </Link>
      ))}
    </nav>
  );

  return (
    <SessionGuard>
    <div className="min-h-screen bg-paper lg:flex">
      <aside className="hidden w-60 shrink-0 flex-col bg-forest text-white lg:flex">
        <div className="px-5 py-6"><Logo size={40} withWordmark dark /></div>
        {Nav}
        <div className="border-t border-white/10 p-4">
          <p className="text-xs font-bold text-[#9DB8AA]">K-SETU Admin</p>
          <button onClick={logout} className="mt-2 flex items-center gap-2 text-xs font-bold text-[#9DB8AA] hover:text-white"><Icon name="logout" size={14} /> {t("common.logout")}</button>
        </div>
      </aside>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setDrawer(false)}>
          <div className="absolute inset-0 bg-forest/60" />
          <aside className="rise absolute inset-y-0 left-0 flex w-64 flex-col bg-forest text-white" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-5">
              <Logo size={34} withWordmark dark />
              <button onClick={() => setDrawer(false)}><Icon name="x" size={18} /></button>
            </div>
            {Nav}
            <div className="border-t border-white/10 p-4">
              <button onClick={logout} className="flex items-center gap-2 text-xs font-bold text-[#9DB8AA]"><Icon name="logout" size={14} /> {t("common.logout")}</button>
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between bg-forest px-4 py-3 text-white lg:hidden">
          <button onClick={() => setDrawer(true)} className="rounded-md bg-white/10 p-2" aria-label="menu"><Icon name="box" size={18} /></button>
          <Logo size={28} withWordmark dark />
          <button onClick={logout} className="rounded-md bg-white/10 p-2" aria-label={t("common.logout")}><Icon name="logout" size={15} /></button>
        </header>
        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
    </SessionGuard>
  );
}
