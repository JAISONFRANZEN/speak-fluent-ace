import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const FeedbackSchema = z.object({
  sessionId: z.string().uuid(),
});

interface PartFeedback {
  scores: {
    pronuncia: number;
    fluencia: number;
    estrutura: number;
    vocabulario: number;
    gramatica: number;
  };
  strengths: string[];
  improvements: string[];
  grammarErrors: { error: string; correction: string }[];
  redemittel: string[];
  transcript: string;
}

/**
 * Analyzes all recordings of a session using Lovable AI Gateway (Gemini multimodal).
 * Downloads each video from Storage, sends to Gemini, parses structured JSON, persists.
 */
export const analyzeSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { sessionId: string }) => FeedbackSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    // Fetch session + theme + image
    const { data: session, error: sErr } = await supabase
      .from("exam_sessions")
      .select("*, exam_themes(*), exam_images(*)")
      .eq("id", data.sessionId)
      .eq("user_id", userId)
      .single();
    if (sErr || !session) throw new Error("Session not found");

    const { data: recordings, error: rErr } = await supabase
      .from("exam_recordings")
      .select("*")
      .eq("session_id", data.sessionId)
      .order("part", { ascending: true });
    if (rErr) throw new Error("Failed to load recordings");
    if (!recordings || recordings.length === 0) throw new Error("No recordings");

    const partResults: Record<number, PartFeedback> = {};

    for (const rec of recordings) {
      // Get signed URL and download
      const { data: signed } = await supabase.storage
        .from("recordings")
        .createSignedUrl(rec.storage_path, 600);
      if (!signed?.signedUrl) continue;

      const audioRes = await fetch(signed.signedUrl);
      const audioBuf = await audioRes.arrayBuffer();
      const base64 = bufferToBase64(audioBuf);

      const promptContext = buildPromptForPart(rec.part, session);

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content:
                "Você é um examinador certificado do Goethe-Institut B1. Analise a fala do candidato e responda APENAS com JSON válido seguindo exatamente o schema solicitado. Notas de 1 a 10. Seja específico, técnico e construtivo.",
            },
            {
              role: "user",
              content: [
                { type: "text", text: promptContext },
                {
                  type: "input_audio",
                  input_audio: { data: base64, format: "webm" },
                },
              ],
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "exam_feedback",
              strict: true,
              schema: {
                type: "object",
                additionalProperties: false,
                properties: {
                  transcript: { type: "string" },
                  scores: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      pronuncia: { type: "number" },
                      fluencia: { type: "number" },
                      estrutura: { type: "number" },
                      vocabulario: { type: "number" },
                      gramatica: { type: "number" },
                    },
                    required: [
                      "pronuncia",
                      "fluencia",
                      "estrutura",
                      "vocabulario",
                      "gramatica",
                    ],
                  },
                  strengths: { type: "array", items: { type: "string" } },
                  improvements: { type: "array", items: { type: "string" } },
                  grammarErrors: {
                    type: "array",
                    items: {
                      type: "object",
                      additionalProperties: false,
                      properties: {
                        error: { type: "string" },
                        correction: { type: "string" },
                      },
                      required: ["error", "correction"],
                    },
                  },
                  redemittel: { type: "array", items: { type: "string" } },
                },
                required: [
                  "transcript",
                  "scores",
                  "strengths",
                  "improvements",
                  "grammarErrors",
                  "redemittel",
                ],
              },
            },
          },
        }),
      });

      if (!response.ok) {
        const txt = await response.text();
        console.error("AI gateway error", response.status, txt);
        // fallback minimal
        partResults[rec.part] = fallbackFeedback();
      } else {
        const json = await response.json();
        const content = json.choices?.[0]?.message?.content;
        try {
          const parsed = JSON.parse(content) as PartFeedback;
          partResults[rec.part] = parsed;
        } catch {
          partResults[rec.part] = fallbackFeedback();
        }
      }

      await supabase
        .from("exam_recordings")
        .update({
          transcript: partResults[rec.part].transcript,
          part_feedback: partResults[rec.part] as never,
        })
        .eq("id", rec.id);
    }

    // Aggregate
    const parts = Object.values(partResults);
    const cats = ["pronuncia", "fluencia", "estrutura", "vocabulario", "gramatica"] as const;
    const avgScores = Object.fromEntries(
      cats.map((c) => [
        c,
        parts.length
          ? Math.round(
              (parts.reduce((s, p) => s + (p.scores[c] ?? 0), 0) / parts.length) * 10,
            ) / 10
          : 0,
      ]),
    ) as Record<(typeof cats)[number], number>;

    const totalScore = Math.round(
      ((avgScores.pronuncia +
        avgScores.fluencia +
        avgScores.estrutura +
        avgScores.vocabulario +
        avgScores.gramatica) /
        5) *
        10,
    );

    await supabase
      .from("exam_sessions")
      .update({
        scores: avgScores as never,
        feedback: partResults as never,
        total_score: totalScore,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", data.sessionId);

    return { ok: true, totalScore, scores: avgScores };
  });

function buildPromptForPart(
  part: number,
  session: {
    exam_themes?: {
      title_pt?: string;
      title_de?: string;
      description_pt?: string;
      description_de?: string;
      discussion_questions_pt?: string[];
      redemittel?: string[];
    } | null;
    exam_images?: { description_pt?: string; description_de?: string } | null;
  },
): string {
  const theme = session.exam_themes;
  const image = session.exam_images;
  const themeTxt = theme
    ? `Tema: ${theme.title_pt} / ${theme.title_de}\nDescrição: ${theme.description_pt}`
    : "";
  const redemittel = theme?.redemittel?.join(", ") ?? "";

  if (part === 1) {
    return `PARTE 1 — Apresentação (3-4 min) sobre o tema sorteado.\n${themeTxt}\nRedemittel B1 esperados: ${redemittel}\n\nAvalie a apresentação do candidato. Transcreva em alemão. Dê notas 1-10 em pronúncia, fluência, estrutura (introdução/desenvolvimento/conclusão), vocabulário (B1) e gramática. Liste pontos fortes, pontos a melhorar, erros gramaticais com correção e Redemittel B1 que faltaram.`;
  }
  if (part === 2) {
    return `PARTE 2 — Discussão (3-4 min) sobre perguntas relacionadas ao tema.\n${themeTxt}\nPerguntas possíveis: ${theme?.discussion_questions_pt?.join(" | ") ?? ""}\n\nAvalie a resposta do candidato. Transcreva em alemão. Dê notas 1-10 e feedback estruturado.`;
  }
  return `PARTE 3 — Spontansprache (3-4 min) descrevendo uma imagem.\nImagem: ${image?.description_pt ?? ""} / ${image?.description_de ?? ""}\n\nAvalie a descrição espontânea da imagem. Transcreva em alemão. Dê notas 1-10 e feedback estruturado.`;
}

function fallbackFeedback(): PartFeedback {
  return {
    transcript: "",
    scores: { pronuncia: 5, fluencia: 5, estrutura: 5, vocabulario: 5, gramatica: 5 },
    strengths: [],
    improvements: ["Não foi possível processar o áudio. Tente gravar novamente."],
    grammarErrors: [],
    redemittel: [],
  };
}

function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
  }
  // eslint-disable-next-line no-undef
  return typeof btoa !== "undefined" ? btoa(binary) : Buffer.from(binary, "binary").toString("base64");
}
