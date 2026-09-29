"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n";

const stepKeys = [
  {
    number: "01",
    icon: "👤",
    title: "guidelines.step1.title",
    description: "guidelines.step1.description",
    action: "guidelines.step1.action",
  },
  {
    number: "02",
    icon: "♻️",
    title: "guidelines.step2.title",
    description: "guidelines.step2.description",
    action: "guidelines.step2.action",
  },
  {
    number: "03",
    icon: "💰",
    title: "guidelines.step3.title",
    description: "guidelines.step3.description",
    action: "guidelines.step3.action",
  },
  {
    number: "04",
    icon: "📦",
    title: "guidelines.step4.title",
    description: "guidelines.step4.description",
    action: "guidelines.step4.action",
  },
  {
    number: "05",
    icon: "🔎",
    title: "guidelines.step5.title",
    description: "guidelines.step5.description",
    action: "guidelines.step5.action",
  },
  {
    number: "06",
    icon: "📊",
    title: "guidelines.step6.title",
    description: "guidelines.step6.description",
    action: "guidelines.step6.action",
  },
  {
    number: "07",
    icon: "🤝",
    title: "guidelines.step7.title",
    description: "guidelines.step7.description",
    action: "guidelines.step7.action",
  },
  {
    number: "08",
    icon: "🚚",
    title: "guidelines.step8.title",
    description: "guidelines.step8.description",
    action: "guidelines.step8.action",
  },
  {
    number: "09",
    icon: "🔎",
    title: "guidelines.step9.title",
    description: "guidelines.step9.description",
    action: "guidelines.step9.action",
  },
  {
    number: "10",
    icon: "📈",
    title: "guidelines.step10.title",
    description: "guidelines.step10.description",
    action: "guidelines.step10.action",
  },
  {
    number: "11",
    icon: "✅",
    title: "guidelines.step11.title",
    description: "guidelines.step11.description",
    action: "guidelines.step11.action",
  },
];
export default function GuidelinesPage() {
  const { t } = useLang();

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 pb-10">
      {/* Header */}
      <section className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-3xl dark:bg-emerald-950">
            📘
          </div>

          <div>
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              {t("guidelines.badge")}
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
              {t("guidelines.title")}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              {t("guidelines.description")}
            </p>
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
        <div>
          <h2 className="text-xl font-semibold">
            {t("guidelines.workflowTitle")}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {t("guidelines.workflowDescription")}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
          {[
            "guidelines.workflow.collect",
            "guidelines.workflow.add",
            "guidelines.workflow.lot",
            "guidelines.workflow.recycler",
            "guidelines.workflow.handover",
            "guidelines.workflow.verify",
            "guidelines.workflow.track",
          ].map((key, index, items) => (
            <div key={key} className="flex items-center gap-2">
              <span className="rounded-full border bg-muted px-3 py-1.5 font-medium">
                {t(key)}
              </span>

              {index < items.length - 1 && (
                <span className="text-muted-foreground">→</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section>
        <div className="mb-5">
          <h2 className="text-2xl font-bold">
            {t("guidelines.stepsTitle")}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {t("guidelines.stepsDescription")}
          </p>
        </div>

        <div className="space-y-4">
          {stepKeys.map((step) => (
            <article
              key={step.number}
              className="group rounded-3xl border bg-card p-5 shadow-sm transition hover:shadow-md sm:p-6"
            >
              <div className="flex gap-4 sm:gap-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-sm font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  {step.number}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-3">
                      <span className="text-2xl" aria-hidden="true">
                        {step.icon}
                      </span>

                      <div>
                        <h3 className="text-lg font-semibold">
                          {t(step.title)}
                        </h3>

                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {t(step.description)}
                        </p>
                      </div>
                    </div>

                    <span className="w-fit shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                      {t(step.action)}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Important */}
      <section className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-xl dark:bg-amber-950">
            💡
          </div>

          <div>
            <h2 className="text-xl font-semibold">
              {t("guidelines.rememberTitle")}
            </h2>

            <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
              {[
                "guidelines.remember1",
                "guidelines.remember2",
                "guidelines.remember3",
                "guidelines.remember4",
                "guidelines.remember5",
              ].map((key) => (
                <li key={key} className="flex gap-2">
                  <span className="font-bold text-emerald-600">✓</span>
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="flex flex-col gap-3 rounded-3xl border bg-card p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold">
            {t("guidelines.readyTitle")}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {t("guidelines.readyDescription")}
          </p>
        </div>

        <Link
          href="/collector"
          className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          {t("guidelines.dashboardButton")} →
        </Link>
      </section>
    </main>
  );
}