import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Award, Download, RotateCw } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { generateResultPdf } from "@/lib/result-pdf";

export const Route = createFileRoute("/_authenticated/exam/$sessionId/result")({
  component: ResultPage,
});

interface FullSession {
  id: string;
  total_score: number | null;
  scores: Record<string, number> | null;
  feedback: Record<
    string,
    {
      strengths: string[];
      improvements: string[];
      grammarErrors: { error: string; correction: string }[];
      redemittel: string[];
      transcript?: string;
    }
  > | null;
  started_at: string;
  exam_themes: { title_pt: string; title_de: string } | null;
}

function ResultPage() {
  const { t, lang } = useI18n();
  const { profile } = useAuth();
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();

  const { data: session, isLoading } = useQuery({
    queryKey: ["session-result", sessionId],
    refetchInterval: (q) =>
      (q.state.data as FullSession | undefined)?.total_score == null ? 3000 : false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_sessions")
        .select("id, total_score, scores, feedback, started_at, exam_themes(title_pt, title_de)")
        .eq("id", sessionId)
        .single();
      if (error) throw error;
      return data as unknown as FullSession;
    },
  });

  if (isLoading || !session) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-muted-foreground">{t.common.loading}</p>
      </main>
    );
  }

  if (session.total_score == null) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h2 className="font-display text-xl font-bold">{t.exam.processing}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t.exam.processingSub}</p>
      </main>
    );
  }

  const scores = session.scores ?? {};
  const feedback = session.feedback ?? {};

  function downloadPdf() {
    if (!profile || !session) return;
    generateResultPdf({
      fullName: profile.full_name,
      email: profile.email,
      whatsapp: profile.whatsapp,
      date: new Date(session.started_at).toLocaleString(lang === "pt" ? "pt-BR" : "de-DE"),
      themeTitle: lang === "pt"
        ? session.exam_themes?.title_pt ?? ""
        : session.exam_themes?.title_de ?? "",
      totalScore: session.total_score ?? 0,
      scores,
      perPart: feedback,
    });
  }

  const total = session.total_score;
  const tone =
    total >= 75 ? "text-success" : total >= 50 ? "text-warning" : "text-destructive";

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-extrabold">{t.feedback.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {lang === "pt" ? session.exam_themes?.title_pt : session.exam_themes?.title_de}
        </p>
      </motion.div>

      {/* Total */}
      <section className="mt-6 rounded-2xl border border-gold/40 bg-gradient-to-br from-gold/10 to-transparent p-8 text-center">
        <Award className="mx-auto h-10 w-10 text-gold" />
        <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.feedback.total}
        </p>
        <p className={`mt-2 font-display text-7xl font-extrabold ${tone}`}>{total}</p>
        <p className="text-sm text-muted-foreground">/ 100</p>
      </section>

      {/* Categories */}
      <section className="mt-8 grid gap-3 sm:grid-cols-5">
        {Object.entries(scores).map(([key, val]) => (
          <CategoryCard
            key={key}
            label={(t.feedback.categories as Record<string, string>)[key] ?? key}
            value={val}
          />
        ))}
      </section>

      {/* Per-part feedback */}
      <section className="mt-10 space-y-6">
        {Object.entries(feedback).map(([part, fb]) => (
          <div key={part} className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-xl font-bold">
              {t.feedback.perPart} — {part}
            </h2>
            <div className="mt-4 grid gap-6 md:grid-cols-2">
              <FbList title={t.feedback.strengths} items={fb.strengths} tone="success" />
              <FbList title={t.feedback.improvements} items={fb.improvements} tone="warning" />
            </div>
            {fb.grammarErrors?.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {t.feedback.grammar}
                </h3>
                <ul className="mt-2 space-y-1 text-sm">
                  {fb.grammarErrors.map((g, i) => (
                    <li key={i} className="rounded-md bg-destructive/5 px-3 py-2">
                      <span className="line-through text-destructive">{g.error}</span>
                      <span className="mx-2 text-muted-foreground">→</span>
                      <span className="font-semibold text-success">{g.correction}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {fb.redemittel?.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {t.feedback.suggestions}
                </h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {fb.redemittel.map((r, i) => (
                    <span
                      key={i}
                      className="rounded-md border border-gold/40 bg-gold/10 px-2 py-0.5 text-xs"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button onClick={downloadPdf} className="bg-gold text-gold-foreground hover:bg-gold/90">
          <Download className="mr-2 h-4 w-4" />
          {t.cta.downloadPdf}
        </Button>
        <Button variant="outline" onClick={() => navigate({ to: "/exam/run" })}>
          <RotateCw className="mr-2 h-4 w-4" />
          {t.cta.retry}
        </Button>
        <Button variant="ghost" onClick={() => navigate({ to: "/dashboard" })}>
          {t.cta.back}
        </Button>
      </div>
    </main>
  );
}

function CategoryCard({ label, value }: { label: string; value: number }) {
  const tone = value >= 7.5 ? "success" : value >= 5 ? "warning" : "destructive";
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={`mt-2 font-display text-3xl font-extrabold text-${tone}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground">/ 10</p>
    </div>
  );
}

function FbList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "success" | "warning";
}) {
  if (!items?.length) return null;
  const dot = tone === "success" ? "bg-success" : "bg-warning";
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <ul className="mt-2 space-y-2">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-sm">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
