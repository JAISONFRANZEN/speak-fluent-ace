import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  BellOff,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  RotateCcw,
  Shuffle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ALL_IDS, CARDS, LEVEL_COLORS, type CardLevel } from "@/lib/flashcards";
import { dueCards, getStats, todayStats } from "@/lib/srs";
import { getPref, permissionState, requestPermission, setPref } from "@/lib/reminders";

export const Route = createFileRoute("/_authenticated/karteikarten")({
  component: KarteikartenPage,
  head: () => ({
    meta: [
      { title: "Karteikarten — Simulador B1" },
      {
        name: "description",
        content: "25 Karteikarten zur Grammatik für die Goethe B1 Prüfung mit Spaced Repetition.",
      },
    ],
  }),
});

const LEVELS: ("Alle" | CardLevel)[] = ["Alle", "Einfach", "Mittel", "Schwer"];

function KarteikartenPage() {
  const [filter, setFilter] = useState<"Alle" | CardLevel>("Alle");
  const [order, setOrder] = useState<number[]>(() => CARDS.map((_, i) => i));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [due, setDue] = useState(0);
  const [stats, setStats] = useState(() => todayStats());

  useEffect(() => {
    const refresh = () => {
      setDue(dueCards(ALL_IDS).length);
      setStats(todayStats());
    };
    refresh();
    const id = window.setInterval(refresh, 30_000);
    return () => window.clearInterval(id);
  }, []);

  const filtered = useMemo(
    () => order.filter((i) => filter === "Alle" || CARDS[i].level === filter),
    [order, filter],
  );
  const current = CARDS[filtered[index] ?? filtered[0]];
  const total = filtered.length;
  const safeIndex = Math.min(index, total - 1);

  function go(delta: number) {
    setFlipped(false);
    setIndex((i) => (i + delta + total) % total);
  }
  function shuffle() {
    setOrder((arr) => [...arr].sort(() => Math.random() - 0.5));
    setIndex(0);
    setFlipped(false);
  }
  function reset() {
    setOrder(CARDS.map((_, i) => i));
    setIndex(0);
    setFlipped(false);
  }

  const last7 = getStats().slice(-7);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Karteikarten</h1>
        <span className="rounded-md border border-gold/30 bg-gold/10 px-2 py-0.5 text-xs font-semibold text-gold">
          B1 Grammatik
        </span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        25 Karteikarten zu den wichtigsten Grammatikthemen der Goethe B1 Prüfung.
      </p>

      <div className="mt-5 flex items-start gap-3 rounded-xl border border-gold/30 bg-gold/5 p-4">
        <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
        <p className="text-sm">
          <span className="font-semibold">Dica:</span> Para os flashcards, coloque a "Pergunta" na
          frente e a "Resposta" no verso. Se quiser praticar a escrita, tente responder sem olhar
          antes de virar o cartão!
        </p>
      </div>

      {/* SRS panel */}
      <section className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Fällig heute / Devidos
          </p>
          <p className="mt-1 font-display text-3xl font-extrabold text-gold">{due}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Hoje revisados
          </p>
          <p className="mt-1 font-display text-3xl font-extrabold">
            {stats.reviewed}
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              ({stats.reviewed > 0 ? Math.round((stats.correct / stats.reviewed) * 100) : 0}%)
            </span>
          </p>
        </div>
        <Link
          to="/review"
          className="group flex flex-col justify-between rounded-xl border border-gold bg-gold/10 p-4 transition-all hover:bg-gold/20 hover:shadow-[var(--shadow-gold)]"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-gold">
            Modo Repetição Espaçada
          </p>
          <p className="mt-1 flex items-center gap-2 font-display text-lg font-bold">
            <Sparkles className="h-5 w-5 text-gold" />
            Iniciar revisão
            <ChevronRight className="ml-auto h-5 w-5 transition-transform group-hover:translate-x-1" />
          </p>
        </Link>
      </section>

      <ReminderSettings dueCount={due} />

      {/* 7-day mini chart */}
      {last7.length > 0 && (
        <section className="mt-5 rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Últimos 7 dias
          </p>
          <div className="mt-3 flex items-end gap-1.5">
            {last7.map((d) => {
              const h = Math.min(60, d.reviewed * 4);
              return (
                <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-gold/70"
                    style={{ height: `${h}px`, minHeight: "4px" }}
                    title={`${d.date}: ${d.reviewed} revisões`}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {d.date.slice(5).replace("-", "/")}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {LEVELS.map((l) => (
            <button
              key={l}
              onClick={() => {
                setFilter(l);
                setIndex(0);
                setFlipped(false);
              }}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                filter === l
                  ? "border-gold bg-gold text-gold-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={shuffle}>
            <Shuffle className="mr-1 h-4 w-4" /> Mischen
          </Button>
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw className="mr-1 h-4 w-4" /> Reset
          </Button>
        </div>
      </div>

      {total > 0 && current && (
        <>
          <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Karte {safeIndex + 1} / {total}
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
            onKeyDown={(e) => {
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                setFlipped((f) => !f);
              }
              if (e.key === "ArrowRight") go(1);
              if (e.key === "ArrowLeft") go(-1);
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id + (flipped ? "-b" : "-f")}
                initial={{ rotateY: flipped ? -90 : 90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: flipped ? 90 : -90, opacity: 0 }}
                transition={{ duration: 0.35 }}
                className={`relative min-h-[280px] cursor-pointer rounded-2xl border p-8 shadow-[var(--shadow-gold)] sm:min-h-[340px] ${
                  flipped
                    ? "border-gold bg-gradient-to-br from-gold/10 to-background"
                    : "border-border bg-card"
                }`}
              >
                <span className="absolute right-4 top-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {flipped ? "Antwort / Resposta" : "Frage / Pergunta"}
                </span>
                <div className="flex h-full min-h-[220px] items-center justify-center sm:min-h-[280px]">
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

          <div className="mt-5 flex items-center justify-between">
            <Button variant="outline" onClick={() => go(-1)} disabled={total <= 1}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Zurück
            </Button>
            <Button
              onClick={() => setFlipped((f) => !f)}
              className="bg-gold text-gold-foreground hover:bg-gold/90"
            >
              Umdrehen
            </Button>
            <Button variant="outline" onClick={() => go(1)} disabled={total <= 1}>
              Weiter <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </main>
  );
}

function ReminderSettings({ dueCount: _dueCount }: { dueCount: number }) {
  const [pref, setPrefState] = useState(() => getPref());
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">(() =>
    permissionState(),
  );

  function update(next: typeof pref) {
    setPrefState(next);
    setPref(next);
  }

  async function toggle(enabled: boolean) {
    if (enabled) {
      const result = await requestPermission();
      setPerm(result);
      if (result !== "granted") {
        toast.error(
          result === "unsupported"
            ? "Seu navegador não suporta notificações."
            : "Permissão negada — habilite nas configurações do navegador.",
        );
        return;
      }
      toast.success("Lembretes diários ativados!");
    }
    update({ ...pref, enabled });
  }

  return (
    <section className="mt-5 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {pref.enabled && perm === "granted" ? (
            <Bell className="h-5 w-5 text-gold" />
          ) : (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-semibold">Tägliche Erinnerung / Lembrete diário</p>
            <p className="text-xs text-muted-foreground">
              Notificação no navegador quando houver cartões para revisar.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="time"
            value={pref.time}
            onChange={(e) => update({ ...pref, time: e.target.value })}
            className="w-28"
            disabled={!pref.enabled}
          />
          <Switch
            checked={pref.enabled && perm === "granted"}
            onCheckedChange={toggle}
            disabled={perm === "unsupported"}
          />
        </div>
      </div>
      {perm === "denied" && (
        <p className="mt-2 text-xs text-destructive">
          Notificações bloqueadas. Habilite manualmente nas configurações do navegador.
        </p>
      )}
    </section>
  );
}
