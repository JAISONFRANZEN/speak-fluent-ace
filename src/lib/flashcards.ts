export type CardLevel = "Einfach" | "Mittel" | "Schwer";

export interface FlashCard {
  id: number;
  level: CardLevel;
  q: string;
  a: string;
}

export const CARDS: FlashCard[] = [
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
  { id: 21, level: "Schwer", q: "Qual a diferença entre dass (conjunção) e das (artigo/pronome)?", a: "Dass introduz uma oração subordinada (conjunção); das é artigo definido neutro ou pronome relativo/demonstrativo." },
  { id: 22, level: "Schwer", q: "Como se forma o Genitiv para substantivos masculinos e neutros?", a: "Adiciona-se o sufixo -s ou -es ao substantivo e o artigo altera-se para des." },
  { id: 23, level: "Schwer", q: "Transforme para Passivo: \"Er schreibt einen Brief.\"", a: "Ein Brief wird geschrieben." },
  { id: 24, level: "Schwer", q: "Qual a diferença entre während (como conjunção) e während (como preposição)?", a: "Como conjunção, rege oração subordinada (verbo no final); como preposição, rege sempre o Genitiv." },
  { id: 25, level: "Schwer", q: "O que caracteriza o Perfekt dos verbos modais (müssen, können, etc.) quando acompanhados de um verbo principal no infinitivo?", a: "Forma-se o Ersatzinfinitiv: haben + infinitivo modal + infinitivo principal (ex: Ich habe das machen müssen)." },
];

export const ALL_IDS = CARDS.map((c) => c.id);
export const LEVEL_COLORS: Record<CardLevel, string> = {
  Einfach: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Mittel: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Schwer: "bg-rose-500/15 text-rose-400 border-rose-500/30",
};
