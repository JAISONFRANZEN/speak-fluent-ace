import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ResultPdfInput {
  fullName: string;
  email: string;
  whatsapp: string;
  date: string;
  themeTitle: string;
  totalScore: number;
  scores: Record<string, number>;
  perPart: Record<
    string,
    {
      strengths: string[];
      improvements: string[];
      grammarErrors: { error: string; correction: string }[];
      redemittel: string[];
      transcript?: string;
    }
  >;
}

const LABELS: Record<string, string> = {
  pronuncia: "Pronúncia / Aussprache",
  fluencia: "Fluência / Flüssigkeit",
  estrutura: "Estrutura / Struktur",
  vocabulario: "Vocabulário / Wortschatz",
  gramatica: "Gramática / Grammatik",
};

export function generateResultPdf(input: ResultPdfInput) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 40;
  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Simulador B1 — Resultado / Ergebnis", margin, y);
  y += 24;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Nome / Name: ${input.fullName}`, margin, y); y += 14;
  doc.text(`Email: ${input.email}`, margin, y); y += 14;
  doc.text(`WhatsApp: ${input.whatsapp}`, margin, y); y += 14;
  doc.text(`Data / Datum: ${input.date}`, margin, y); y += 14;
  doc.text(`Tema / Thema: ${input.themeTitle}`, margin, y); y += 24;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text(`${input.totalScore} / 100`, margin, y);
  y += 30;

  autoTable(doc, {
    startY: y,
    head: [["Categoria / Kategorie", "Nota / Note"]],
    body: Object.entries(input.scores).map(([k, v]) => [LABELS[k] ?? k, String(v)]),
    headStyles: { fillColor: [212, 175, 55] },
    margin: { left: margin, right: margin },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;

  Object.entries(input.perPart).forEach(([part, fb]) => {
    if (y > 720) { doc.addPage(); y = margin; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`Parte / Teil ${part}`, margin, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const block = (title: string, items: string[]) => {
      if (!items?.length) return;
      doc.setFont("helvetica", "bold");
      doc.text(title, margin, y); y += 12;
      doc.setFont("helvetica", "normal");
      items.forEach((it) => {
        const lines = doc.splitTextToSize(`• ${it}`, 515);
        doc.text(lines, margin, y);
        y += lines.length * 12;
        if (y > 760) { doc.addPage(); y = margin; }
      });
      y += 6;
    };

    block("Pontos fortes / Stärken:", fb.strengths);
    block("Pontos a melhorar / Verbesserungen:", fb.improvements);
    if (fb.grammarErrors?.length) {
      block(
        "Erros gramaticais / Grammatikfehler:",
        fb.grammarErrors.map((g) => `${g.error}  →  ${g.correction}`),
      );
    }
    block("Redemittel:", fb.redemittel);
    y += 8;
  });

  doc.save(`resultado-b1-${Date.now()}.pdf`);
}
