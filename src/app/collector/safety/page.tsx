"use client";
import { useEffect, useState } from "react";
import { Card, ErrorBox, Icon, Spinner } from "@/components/ui";
import { useLang, speak } from "@/lib/i18n";
import { api } from "@/components/ui";

type Topic = { topicKey: string; iconKey: string; title: string; body: string };

export default function SafetyPage() {
  const { t, lang } = useLang();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [open, setOpen] = useState<Topic | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  setLoading(true);
    api<Topic[]>(`/safety?lang=${lang}`)
      .then(setTopics)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [lang]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold text-forest">{t("safety.title")}</h1>
      {err && <ErrorBox text={err} />}
      {loading && <div className="flex justify-center py-8 text-pine"><Spinner /></div>}
      <div className="grid grid-cols-2 gap-2.5">
        {topics.map((tp) => (
          <button key={tp.topicKey} onClick={() => setOpen(tp)} className="flex flex-col items-center gap-2 rounded-xl border border-[#dcebe0] bg-white px-2 py-4 text-center transition active:scale-95">
            <span className="rounded-full bg-mint p-3 text-pine"><Icon name={tp.iconKey} size={26} /></span>
            <span className="text-xs font-extrabold leading-tight text-ink">{tp.title}</span>
          </button>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-forest/50 sm:items-center sm:p-4" onClick={() => setOpen(null)}>
          <div className="rise w-full max-w-md rounded-t-2xl bg-white p-5 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3">
              <span className="rounded-full bg-mint p-3 text-pine"><Icon name={open.iconKey} size={28} /></span>
              <div className="flex-1">
                <h3 className="font-extrabold text-forest">{open.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink">{open.body}</p>
              </div>
              <button onClick={() => setOpen(null)} className="text-sage"><Icon name="x" size={18} /></button>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => speak(`${open.title}. ${open.body}`, lang)} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-okbg px-3 py-2.5 text-sm font-bold text-leaf">
                <Icon name="mic" size={16} /> {t("common.listen")}
              </button>
            </div>
            <p className="mt-3 text-[10px] text-sage">Safety guidance only — no instructions for hazardous chemical processing are provided.</p>
          </div>
        </div>
      )}
    </div>
  );
}
