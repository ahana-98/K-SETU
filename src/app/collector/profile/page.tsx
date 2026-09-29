"use client";
import { useEffect, useState } from "react";
import { Btn, Card, DemoTag, Icon, logout, useToast } from "@/components/ui";
import { useLang, LANGS, type Lang } from "@/lib/i18n";
import { useSync } from "@/lib/offline";

export default function ProfilePage() {
  const { t, lang, setLang } = useLang();
  const { push } = useToast();
  const { online, count, state, flush } = useSync((n) => push(`${n} lot(s) synced`, "ok"));
  const [user, setUser] = useState<{ name: string; role: string; demo: boolean } | null>(null);
  useEffect(() => {
    fetch("/api/auth/session").then((r) => (r.ok ? r.json() : null)).then(setUser);
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold text-forest">{t("profile.title")}</h1>

<Card className="space-y-4 p-4">
  <section>
    <h2 className="mb-1 text-xs font-bold uppercase tracking-widest text-sage">
      {t("profile.about")}
    </h2>
    <p className="text-xs leading-relaxed text-sage">
      K-SETU is a Smart India Hackathon 2026 prototype connecting informal
      e-waste collectors with authorized recyclers. All prices, recyclers
      and transactions shown are <DemoTag>DEMO DATA</DemoTag>. ML outputs
      are <DemoTag>ML PROTOTYPE</DemoTag> heuristics.
    </p>
  </section>

  <div className="border-t border-pine/10 pt-3">
    <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-sage">
      Help
    </h2>
    <div className="space-y-2 text-xs leading-relaxed text-sage">
      <p>
        <strong className="text-ink">1. Create a lot:</strong>{" "}
        Open Sell E-Waste, enter the e-waste details and submit your lot.
      </p>
      <p>
        <strong className="text-ink">2. Find a recycler:</strong>{" "}
        Browse available recyclers and review quotes for your lot.
      </p>
      <p>
        <strong className="text-ink">3. Complete handover:</strong>{" "}
        Follow the transaction steps and use the OTP when prompted.
      </p>
      <p>
        <strong className="text-ink">4. Check your earnings:</strong>{" "}
        Visit Earnings to review payment information.
      </p>
      <p>
        <strong className="text-ink">Offline use:</strong>{" "}
        Lots created offline can sync when your connection returns.
      </p>
      <p>
        For safe handling, open the Safety and Guidelines sections from the
        collector dashboard.
      </p>
    </div>
  </div>
</Card>
      <Card className="p-4">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-sage">{t("profile.language")}</h2>
        <div className="flex gap-2">
          {LANGS.map((l) => (
            <button key={l.code} onClick={() => setLang(l.code as Lang)} className={`flex-1 rounded-lg border-2 px-3 py-2.5 text-sm font-bold ${lang === l.code ? "border-pine bg-mint text-forest" : "border-transparent bg-white text-sage"}`}>
              {l.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-sage">{t("profile.sync")}</h2>
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm text-ink">
            <span className={`h-2 w-2 rounded-full ${online ? "bg-leaf" : "bg-warn"}`} />
            {online ? t("common.online") : t("common.offline")} • {count ? `${count} ${t("common.pendingSync")}` : t("common.synced")}
            {state === "syncing" && ` • ${t("common.syncing")}`}
          </p>
          <Btn size="sm" variant="outline" onClick={flush} disabled={!online || !count}><Icon name="sync" size={14} /> Sync now</Btn>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="mb-1 text-xs font-bold uppercase tracking-widest text-sage">{t("profile.about")}</h2>
        <p className="text-xs leading-relaxed text-sage">
          K-SETU is a Smart India Hackathon 2026 prototype connecting informal e-waste collectors with authorized recyclers. All prices, recyclers and transactions shown are <DemoTag>DEMO DATA</DemoTag>. ML outputs are <DemoTag>ML PROTOTYPE</DemoTag> heuristics.
        </p>
      </Card>

      <Btn full variant="danger" onClick={logout}><Icon name="logout" size={16} /> {t("common.logout")}</Btn>
    </div>
  );
}
