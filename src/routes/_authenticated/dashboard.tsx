import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Award, ChartLine, Play, Trophy } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useI18n, fmt } from "@/i18n/I18nProvider";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

interface SessionRow {
  id: string;
  total_score: number | null;
  status: string;
  started_at: string;
  completed_at: string | null;
  mode: string;
}

function Dashboard() {
  const { t, lang } = useI18n();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const { data: sessions = [] } = useQuery({
    queryKey: ["sessions", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_sessions")
        .select("id, total_score, status, started_at, completed_at, mode")
        .order("started_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as SessionRow[];
    },
  });

  const completed = sessions.filter((s) => s.status === "completed" && s.total_score !== null);
  const total = completed.length;
  const avg =
    total > 0
      ? Math.round(completed.reduce((sum, s) => sum + (s.total_score ?? 0), 0) / total)
      : 0;
  const best = total > 0 ? Math.max(...completed.map((s) => s.total_score ?? 0)) : 0;

  const chartData = [...completed]
    .reverse()
    .slice(-10)
    .map((s, i) => ({
      n: `#${i + 1}`,
      score: s.total_score,
    }));

  const firstName = profile?.full_name?.split(" ")[0] ?? "";

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"
      >
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">
            {fmt(t.dashboard.title, { name: firstName })}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.dashboard.subtitle}</p>
        </div>
        <Button
          size="lg"
          onClick={() => navigate({ to: "/exam" })}
          className="bg-gold text-gold-foreground shadow-[var(--shadow-gold)] hover:bg-gold/90"
        >
          <Play className="mr-1 h-4 w-4" />
          {t.cta.newExam}
        </Button>
      </motion.div>

      {/* Stats */}
      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Award className="h-5 w-5" />}
          label={t.dashboard.stats.total}
          value={String(total)}
        />
        <StatCard
          icon={<ChartLine className="h-5 w-5" />}
          label={t.dashboard.stats.avg}
          value={`${avg}/100`}
        />
        <StatCard
          icon={<Trophy className="h-5 w-5" />}
          label={t.dashboard.stats.best}
          value={`${best}/100`}
          highlight
        />
      </section>

      {/* Chart */}
      <section className="mt-8 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-bold">{t.dashboard.evolution}</h2>
        <div className="mt-4 h-64">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="n" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="var(--gold)"
                  strokeWidth={3}
                  dot={{ fill: "var(--gold)", r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              {t.dashboard.empty}
            </div>
          )}
        </div>
      </section>

      {/* History */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-bold">{t.dashboard.history}</h2>
        <div className="mt-4 grid gap-3">
          {sessions.length === 0 && (
            <p className="text-sm text-muted-foreground">{t.dashboard.empty}</p>
          )}
          {sessions.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
            >
              <div>
                <div className="text-sm font-semibold">
                  {new Date(s.started_at).toLocaleString(lang === "pt" ? "pt-BR" : "de-DE")}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground capitalize">
                  {s.mode} · {s.status}
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-2xl font-extrabold text-gold">
                  {s.total_score ?? "—"}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  / 100
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-5 ${
        highlight
          ? "border-gold/40 bg-gold/10"
          : "border-border bg-card"
      }`}
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-3 font-display text-3xl font-extrabold tracking-tight">{value}</div>
    </div>
  );
}
