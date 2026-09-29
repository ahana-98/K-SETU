"use client";
import { useEffect, useState } from "react";
import { Badge, Btn, Card, DemoTag, Icon, logout } from "@/components/ui";
import { useLang } from "@/lib/i18n";
import { api } from "@/components/ui";

type Prof = { name: string; facilityLocation: string; serviceArea: string; authorizationStatus: string; authorizationDetails: string | null; contact: string; pickupAvailable: boolean; materialsAccepted: string[] };

export default function RecyclerProfile() {
  const { t } = useLang();
  const [prof, setProf] = useState<Prof | null>(null);
  useEffect(() => {
    api<any>("/recyclers").then((d) => {
      const list = d.recyclers ?? [];
      fetch("/api/auth/session").then((r) => r.json()).then((s) => {
        setProf(list.find((p: any) => p.userId === s.userId) ?? list[0] ?? null);
      });
    }).catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-xl font-extrabold text-forest">{t("nav.profile")}</h1>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-forest p-3 text-white"><Icon name="factory" size={26} /></span>
          <div>
            <p className="font-extrabold text-ink">{prof?.name ?? "—"}</p>
            <p className="text-xs text-sage">{prof?.facilityLocation} • {prof?.serviceArea}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {prof?.authorizationStatus === "demo_authorized"
            ? <Badge tone="ok"><Icon name="check" size={11} /> {t("rec.verified")}</Badge>
            : <Badge tone="warn">AUTH PENDING</Badge>}
          <Badge tone="neutral">{prof?.pickupAvailable ? t("rec.pickup") : t("rec.noPickup")}</Badge>
          <Badge tone="neutral"><Icon name="phone" size={11} /> {prof?.contact}</Badge>
        </div>
        {prof?.authorizationDetails && <p className="mt-2 text-[11px] text-sage">{prof.authorizationDetails}</p>}
      </Card>
      <Card className="p-4">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-sage">Accepted materials</h2>
        <div className="flex flex-wrap gap-1.5">
          {prof?.materialsAccepted.map((m) => <span key={m} className="rounded-md bg-mint px-2 py-1 text-xs font-bold text-forest">{m}</span>)}
        </div>
      </Card>
      <p className="text-[10px] text-sage"><DemoTag>SAMPLE RECYCLER</DemoTag> Demo authorization — not a verified real-world recycler.</p>
      <Btn full variant="danger" onClick={logout}><Icon name="logout" size={16} /> {t("common.logout")}</Btn>
    </div>
  );
}
