import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CARDS, LEVEL_COLORS, ALL_IDS, type FlashCard } from "@/lib/flashcards";
import { dueCards, recordReview, todayStats } from "@/lib/srs";

export const Route = createFileRoute("/_authenticated/review")({
  component: ReviewPage,
  head: () => ({
    meta: [{ title: "Revisão Espaçada — Simulador B1" }],
  }),
});

type Quality = 0 | 3 | 4 | 5;

const QUALITY_BUTTONS: { q: Quality; label: string; sub: string; cls: string }[] = [
  { q: 0, label: "Esqueci", sub: "< 10 min", cls: "bg-destructive text-destructive-foreground hover:bg-destructive/90" },
  { q: 3, label: "Difícil", sub: "Curto", cls: "bg-amber-500 text-white hover:bg-amber-600" },
  { q: 4, label: "Bom", sub: "Normal", cls: "bg-emerald-600 text-white hover:bg-emerald-700" },
  { q: 5, label: "Fácil", sub: "Longo", cls: "bg-gold text-gold-foreground hover:bg-gold/90" },
];

function ReviewPage() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState<FlashCard[]>([]);
  const [done, setDone] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sessionStart] = useState(() => todayStats().reviewed);

  useEffect(() => {
    const ids = dueCards(ALL_IDS).map((p) => p.cardId);
    const byId = new Map(CARDS.map((c) => [c.id, c]));
    setQueue(ids.map((id) => byId.get(id)!).filter(Boolean));
  }, []);

  const current = queue[0];
  const total = done + queue.length;

  function answer(q: Quality) {
    if (!current) return;
    recordReview(current.id, q);
    setDone((d) => d + 1);
    setFlipped(false);
    setQueue((arr) => arr.slice(1));
  }

  const finishedAll = done > 0 && queue.length === 0;
  const empty = queue.length === 0 && done === 0;

  const stats = useMemo(() => todayStats(), [done]);
  const sessionReviewed = stats.reviewed - sessionStart;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link
        to="/karteikarten"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Karteikarten
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          Wiederholung / Revisão
        </h1>
        <span className="rounded-md border border-gold/30 bg-gold/10 px-2 py-0.5 text-xs font-semibold text-gold">
          SM-2
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Algoritmo de repetição espaçada — avalie sua resposta para ajustar o próximo intervalo.
      </p>

      {!empty && (
        <div className="mt-6 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-gold transition-all"
            style={{ width: `${total === 0 ? 0 : (done / total) * 100}%` }}
          />
        </div>
      )}

      {empty && (
        <div className="mt-10 rounded-2xl border border-border bg-card p-10 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-gold" />
          <h2 className="mt-4 font-display text-xl font-bold">Nichts fällig! / Nada para revisar</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Você está em dia. Volte mais tarde ou pratique livre nos flashcards.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => navigate({ to: "/karteikarten" })}
            >
              Praticar livre
            </Button>
            <Button
              className="bg-gold text-gold-foreground hover:bg-gold/90"
              onClick={() => {
                // force-review all cards
                const all = CARDS.slice().sort(() => Math.random() - 0.5);
                setQueue(all);
              }}
            >
              Revisar todos mesmo assim
            </Button>
          </div>
        </div>
      )}

      {finishedAll && !empty && (
        <div className="mt-10 rounded-2xl border border-gold/40 bg-gradient-to-br from-gold/10 to-transparent p-10 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-gold" />
          <h2 className="mt-4 font-display text-2xl font-bold">Sessão concluída!</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Você revisou {done} cartão{done > 1 ? "ões" : ""} nesta sessão.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Hoje: {stats.reviewed} revisões •{" "}
            {stats.reviewed > 0
              ? Math.round((stats.correct / stats.reviewed) * 100)
              : 0}
            % de acerto
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => navigate({ to: "/karteikarten" })}
            >
              Voltar
            </Button>
            <Button
              className="bg-gold text-gold-foreground hover:bg-gold/90"
              onClick={() => navigate({ to: "/dashboard" })}
            >
              Dashboard
            </Button>
          </div>
        </div>
      )}

      {current && (
        <>
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {done + 1} / {total} • {queue.length - 1} restantes
            </span>
            <span
              className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${LEVEL_COLORS[current.level]}`}
            >
              {current.level}
            </span>
          </div>

          <div
            className="mt-3 [perspective:1500px]"
            onClick={() => setFlipped((f) => !f)}
            role="button"
            tabIndex={0}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id + (flipped ? "-b" : "-f")}
                initial={{ rotateY: flipped ? -90 : 90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: flipped ? 90 : -90, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={`relative min-h-[280px] cursor-pointer rounded-2xl border p-8 shadow-[var(--shadow-gold)] sm:min-h-[320px] ${
                  flipped
                    ? "border-gold bg-gradient-to-br from-gold/10 to-background"
                    : "border-border bg-card"
                }`}
              >
                <span className="absolute right-4 top-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {flipped ? "Antwort / Resposta" : "Frage / Pergunta"}
                </span>
                <div className="flex h-full min-h-[220px] items-center justify-center sm:min-h-[260px]">
                  <p className="text-center font-display text-xl font-bold leading-relaxed sm:text-2xl">
                    {flipped ? current.a : current.q}
                  </p>
                </div>
                <p className="absolute bottom-3 left-0 right-0 text-center text-[11px] text-muted-foreground">
                  Klicken zum Umdrehen
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {!flipped ? (
            <Button
              className="mt-5 w-full bg-gold text-gold-foreground hover:bg-gold/90"
              onClick={() => setFlipped(true)}
            >
              Mostrar resposta
            </Button>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {QUALITY_BUTTONS.map((b) => (
                <button
                  key={b.q}
                  onClick={() => answer(b.q)}
                  className={`flex flex-col items-center rounded-xl px-3 py-3 text-sm font-bold transition-all ${b.cls}`}
                >
                  <span>{b.label}</span>
                  <span className="text-[10px] font-normal opacity-80">{b.sub}</span>
                </button>
              ))}
            </div>
          )}

          {sessionReviewed > 0 && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Sessão: {sessionReviewed} • Hoje: {stats.reviewed} revisões
            </p>
          )}
        </>
      )}
    </main>
  );
}
