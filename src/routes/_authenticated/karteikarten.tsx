import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, RotateCcw, Shuffle, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/karteikarten")({
  component: KarteikartenPage,
  head: () => ({
    meta: [
      { title: "Karteikarten — Simulador B1" },
      { name: "description", content: "25 Karteikarten zur Grammatik für die Goethe B1 Prüfung." },
    ],
  }),
});

type Level = "Einfach" | "Mittel" | "Schwer";

interface Card {
  id: number;
  level: Level;
  q: string;
  a: string;
}

const CARDS: Card[] = [
  // Einfach
  { id: 1, level: "Einfach", q: "Como se forma o Partizip II dos verbos fracos (regulares)?", a: "Prefixo ge- + radical + sufixo -t (ex: gemacht)." },
  { id: 2, level: "Einfach", q: "Qual é a principal diferença entre weil e denn na posição do verbo?", a: "Weil é subordinativa (verbo vai para o final); denn é coordenativa (verbo fica na 2ª posição)." },
  { id: 3, level: "Einfach", q: "Quais são os artigos definidos no Nominativ para Masculino, Feminino, Neutro e Plural?", a: "der, die, das, die." },
  { id: 4, level: "Einfach", q: "Como se diz \"Eu gostaria de...\" usando o verbo mögen no Konjunktiv II?", a: "Ich möchte..." },
  { id: 5, level: "Einfach", q: "Qual caso a preposição mit sempre exige?", a: "Dativo." },
  { id: 6, level: "Einfach", q: "Qual é o comparativo de gut?", a: "besser." },
  { id: 7, level: "Einfach", q: "Como se conjuga o verbo können na 1ª pessoa do singular (Ich)?", a: "Ich kann." },
  { id: 8, level: "Einfach", q: "Qual o superlativo de viel?", a: "am meisten." },
  { id: 9, level: "Einfach", q: "O que acontece com o verbo na frase quando usamos a conjunção aber?", a: "O verbo permanece na 2ª posição (não há mudança de ordem)." },
  { id: 10, level: "Einfach", q: "Como se diz \"Eu vou para casa\" em alemão?", a: "Ich gehe nach Hause." },
  // Mittel
  { id: 11, level: "Mittel", q: "Qual a regra de formação do Passiv Präsens?", a: "Verbo werden (conjugado) + Partizip II." },
  { id: 12, level: "Mittel", q: "O que é a N-Deklination e a quais substantivos geralmente se aplica?", a: "É a adição de -n ou -en a substantivos masculinos (ex: Student, Polizist) em todos os casos, exceto o Nominativ." },
  { id: 13, level: "Mittel", q: "Qual a diferença de uso entre als e wenn para eventos passados?", a: "Als para um evento único no passado; wenn para eventos repetitivos (sempre que/toda vez que)." },
  { id: 14, level: "Mittel", q: "Como se forma o imperativo para a 2ª pessoa do plural (ihr)?", a: "Apenas o verbo conjugado no presente (sem o pronome 'ihr'). Ex: Macht!" },
  { id: 15, level: "Mittel", q: "Quais são as Wechselpräpositionen (dupla regência) que exigem Dativo quando indicam localização?", a: "an, auf, hinter, in, neben, über, unter, vor, zwischen." },
  { id: 16, level: "Mittel", q: "O que indica o Konjunktiv II quando usado com verbos como würden?", a: "Situações hipotéticas, irreais ou pedidos muito polidos." },
  { id: 17, level: "Mittel", q: "Complete: \"Ich erinnere mich ____ den Urlaub.\" (Preposição correta)", a: "an." },
  { id: 18, level: "Mittel", q: "Qual é a forma do pronome relativo no Nominativ para um substantivo masculino?", a: "der." },
  { id: 19, level: "Mittel", q: "O que é o Zustandspassiv (Passivo de estado) e qual auxiliar utiliza?", a: "Indica um estado resultante de uma ação concluída; usa o auxiliar sein." },
  { id: 20, level: "Mittel", q: "Quando o verbo modal sollen é usado no Konjunktiv II (sollte), qual é o seu sentido?", a: "Expressar um conselho ou recomendação." },
  // Schwer
  { id: 21, level: "Schwer", q: "Qual a diferença entre dass (conjunção) e das (artigo/pronome)?", a: "Dass introduz uma oração subordinada (conjunção); das é artigo definido neutro ou pronome relativo/demonstrativo." },
  { id: 22, level: "Schwer", q: "Como se forma o Genitiv para substantivos masculinos e neutros?", a: "Adiciona-se o sufixo -s ou -es ao substantivo e o artigo altera-se para des." },
  { id: 23, level: "Schwer", q: "Transforme para Passivo: \"Er schreibt einen Brief.\"", a: "Ein Brief wird geschrieben." },
  { id: 24, level: "Schwer", q: "Qual a diferença entre während (como conjunção) e während (como preposição)?", a: "Como conjunção, rege oração subordinada (verbo no final); como preposição, rege sempre o Genitiv." },
  { id: 25, level: "Schwer", q: "O que caracteriza o Perfekt dos verbos modais (müssen, können, etc.) quando acompanhados de um verbo principal no infinitivo?", a: "Forma-se o Ersatzinfinitiv: haben + infinitivo modal + infinitivo principal (ex: Ich habe das machen müssen)." },
];

const LEVELS: ("Alle" | Level)[] = ["Alle", "Einfach", "Mittel", "Schwer"];

function KarteikartenPage() {
  const [filter, setFilter] = useState<"Alle" | Level>("Alle");
  const [order, setOrder] = useState<number[]>(() => CARDS.map((_, i) => i));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const filtered = useMemo(
    () => order.filter((i) => filter === "Alle" || CARDS[i].level === filter),
    [order, filter],
  );
  const current = CARDS[filtered[index] ?? filtered[0]];
  const total = filtered.length;
  const safeIndex = Math.min(index, total - 1);

  function go(delta: number) {
    setFlipped(false);
    setIndex((i) => {
      const n = (i + delta + total) % total;
      return n;
    });
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

  const levelColor: Record<Level, string> = {
    Einfach: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    Mittel: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    Schwer: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center gap-3">
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
              className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${levelColor[current.level]}`}
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
