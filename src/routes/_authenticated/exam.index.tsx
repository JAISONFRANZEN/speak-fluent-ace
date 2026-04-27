import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Clock, Mic, BookOpen, Library } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/exam/")({
  component: ExamModeSelect,
});

function ExamModeSelect() {
  const { t } = useI18n();
  const navigate = useNavigate();

  const modes = [
    {
      key: "completa" as const,
      icon: Clock,
      title: t.modes.completa,
      desc: t.modes.completaDesc,
      featured: true,
    },
    { key: "rapida" as const, icon: Mic, title: t.modes.rapida, desc: t.modes.rapidaDesc },
    { key: "tema" as const, icon: BookOpen, title: t.modes.tema, desc: t.modes.temaDesc },
    {
      key: "themes" as const,
      icon: Library,
      title: t.modes.themes,
      desc: t.modes.themesDesc,
    },
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">{t.modes.title}</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {modes.map((m, i) => (
          <motion.button
            key={m.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            type="button"
            disabled={m.key !== "completa"}
            onClick={() => {
              if (m.key === "completa") navigate({ to: "/exam/run" });
            }}
            className={`group rounded-2xl border p-6 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              m.featured
                ? "border-gold/40 bg-gold/5 hover:border-gold hover:bg-gold/10 hover:shadow-[var(--shadow-gold)]"
                : "border-border bg-card hover:border-foreground/30"
            }`}
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                m.featured ? "bg-gold text-gold-foreground" : "bg-primary text-primary-foreground"
              }`}
            >
              <m.icon className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-display text-xl font-bold">{m.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{m.desc}</p>
            {m.key !== "completa" && (
              <span className="mt-3 inline-block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Em breve
              </span>
            )}
          </motion.button>
        ))}
      </div>
      <Button variant="outline" className="mt-8" onClick={() => navigate({ to: "/dashboard" })}>
        {t.cta.back}
      </Button>
    </main>
  );
}
