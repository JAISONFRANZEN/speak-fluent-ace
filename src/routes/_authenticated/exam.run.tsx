import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles, Timer } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { WebcamRecorder } from "@/components/WebcamRecorder";
import { analyzeSession } from "@/lib/exam-server";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/exam/run")({
  component: ExamRun,
});

type Stage =
  | "instructions"
  | "drawing"
  | "prep1"
  | "record1"
  | "transition2"
  | "prep2"
  | "record2"
  | "transition3"
  | "prep3"
  | "record3"
  | "processing";

interface Theme {
  id: string;
  title_pt: string;
  title_de: string;
  description_pt: string;
  description_de: string;
  redemittel: string[];
  tips_pt: string[];
  tips_de: string[];
  discussion_questions_pt: string[];
  discussion_questions_de: string[];
}
interface ImageRow {
  id: string;
  url: string;
  description_pt: string;
  description_de: string;
}

const PREP1_SEC = 15 * 60;
const PREP2_SEC = 30;
const PREP3_SEC = 60;
const REC_MAX_SEC = 4 * 60;

function ExamRun() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stage, setStage] = useState<Stage>("instructions");
  const [theme, setTheme] = useState<Theme | null>(null);
  const [images, setImages] = useState<ImageRow[]>([]);
  const [chosenImage, setChosenImage] = useState<ImageRow | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [prepLeft, setPrepLeft] = useState(0);
  const prepEndRef = useRef(0);

  // Countdown for prep stages
  useEffect(() => {
    if (!["prep1", "prep2", "prep3"].includes(stage)) return;
    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil((prepEndRef.current - Date.now()) / 1000));
      setPrepLeft(left);
      if (left <= 0) {
        clearInterval(id);
        if (stage === "prep1") setStage("record1");
        if (stage === "prep2") setStage("record2");
        if (stage === "prep3") setStage("record3");
      }
    }, 250);
    return () => clearInterval(id);
  }, [stage]);

  function startPrep(seconds: number, next: Stage) {
    prepEndRef.current = Date.now() + seconds * 1000;
    setPrepLeft(seconds);
    setStage(next);
  }

  async function startSession() {
    if (!user) return;
    setStage("drawing");

    // Pick random theme + load images
    const [{ data: themes }, { data: imgs }] = await Promise.all([
      supabase.from("exam_themes").select("*"),
      supabase.from("exam_images").select("*"),
    ]);
    if (!themes || themes.length === 0) {
      toast.error("Nenhum tema disponível");
      setStage("instructions");
      return;
    }
    const t1 = themes[Math.floor(Math.random() * themes.length)] as Theme;
    const pool = (imgs ?? []) as ImageRow[];
    // Shuffle and pick 3
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
    setTheme(t1);
    setImages(shuffled);

    // Create session
    const { data: created, error } = await supabase
      .from("exam_sessions")
      .insert({
        user_id: user.id,
        mode: "completa",
        theme_id: t1.id,
        status: "in_progress",
      })
      .select("id")
      .single();
    if (error || !created) {
      toast.error("Erro ao criar sessão");
      setStage("instructions");
      return;
    }
    setSessionId(created.id);
    startPrep(PREP1_SEC, "prep1");
  }

  async function uploadRecording(part: 1 | 2 | 3, blob: Blob, durationSec: number) {
    if (!user || !sessionId) return;
    setUploading(true);
    try {
      const path = `${user.id}/${sessionId}/part-${part}-${Date.now()}.webm`;
      const { error: upErr } = await supabase.storage
        .from("recordings")
        .upload(path, blob, { contentType: "video/webm", upsert: true });
      if (upErr) throw upErr;
      const { error: insErr } = await supabase.from("exam_recordings").insert({
        session_id: sessionId,
        user_id: user.id,
        part,
        storage_path: path,
        duration_sec: durationSec,
      });
      if (insErr) throw insErr;
      toast.success(t.exam.recordingDone);

      if (part === 1) setStage("transition2");
      else if (part === 2) setStage("transition3");
      else if (part === 3) await runAnalysis();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function runAnalysis() {
    if (!sessionId) return;
    setStage("processing");
    try {
      // Save notes to session
      await supabase.from("exam_sessions").update({ notes }).eq("id", sessionId);
      const {
        data: { session: authSession },
      } = await supabase.auth.getSession();
      await analyzeSession({
        data: { sessionId },
        headers: authSession?.access_token
          ? { Authorization: `Bearer ${authSession.access_token}` }
          : undefined,
      } as never);
      navigate({ to: "/exam/$sessionId/result", params: { sessionId } });
    } catch (e) {
      toast.error("Falha na análise: " + (e as Error).message);
      setStage("record3");
    }
  }

  const themeTitle = theme ? (lang === "pt" ? theme.title_pt : theme.title_de) : "";
  const themeDesc = theme ? (lang === "pt" ? theme.description_pt : theme.description_de) : "";
  const themeQuestions = theme
    ? lang === "pt"
      ? theme.discussion_questions_pt
      : theme.discussion_questions_de
    : [];

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <AnimatePresence mode="wait">
        {stage === "instructions" && (
          <Step key="instr">
            <h1 className="font-display text-3xl font-extrabold">{t.exam.instructionsTitle}</h1>
            <p className="mt-3 text-muted-foreground">{t.exam.instructionsBody}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <PartCard title={t.exam.part1Title} desc={t.exam.part1Desc} />
              <PartCard title={t.exam.part2Title} desc={t.exam.part2Desc} />
              <PartCard title={t.exam.part3Title} desc={t.exam.part3Desc} />
            </div>
            <Button
              size="lg"
              className="mt-8 bg-gold text-gold-foreground hover:bg-gold/90"
              onClick={startSession}
            >
              {t.exam.drawTheme}
            </Button>
          </Step>
        )}

        {stage === "drawing" && (
          <Step key="draw">
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-gold" />
              <p className="mt-4 font-display text-lg">{t.common.loading}</p>
            </div>
          </Step>
        )}

        {stage === "prep1" && theme && (
          <Step key="prep1">
            <PrepHeader stageLabel="Parte 1" prepLeft={prepLeft} />
            <ThemeBlock
              title={themeTitle}
              desc={themeDesc}
              redemittel={theme.redemittel}
              tips={lang === "pt" ? theme.tips_pt : theme.tips_de}
            />
            <NotesArea notes={notes} setNotes={setNotes} placeholder={t.exam.notesPh} title={t.exam.notes} />
            <Button
              className="mt-6 bg-gold text-gold-foreground hover:bg-gold/90"
              onClick={() => setStage("record1")}
            >
              {t.exam.readyPart1}
            </Button>
          </Step>
        )}

        {stage === "record1" && (
          <Step key="rec1">
            <PrepHeader stageLabel="Parte 1 — Gravação" prepLeft={null} />
            <p className="mt-2 text-sm text-muted-foreground">{themeTitle}</p>
            <div className="mt-4">
              <WebcamRecorder
                maxSeconds={REC_MAX_SEC}
                autoStart
                uploading={uploading}
                onRecorded={(blob, dur) => uploadRecording(1, blob, dur)}
              />
            </div>
          </Step>
        )}

        {stage === "transition2" && (
          <Step key="t2">
            <h2 className="font-display text-2xl font-bold">{t.exam.part2Title}</h2>
            <p className="mt-2 text-muted-foreground">{t.exam.part2Desc}</p>
            <div className="mt-6 rounded-xl border border-border bg-card p-5">
              <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {lang === "pt" ? "Pergunta" : "Frage"}
              </p>
              <p className="mt-2 font-display text-lg">
                {themeQuestions[Math.floor(Math.random() * Math.max(1, themeQuestions.length))]}
              </p>
            </div>
            <Button
              className="mt-6 bg-gold text-gold-foreground hover:bg-gold/90"
              onClick={() => startPrep(PREP2_SEC, "prep2")}
            >
              {t.cta.continue}
            </Button>
          </Step>
        )}

        {stage === "prep2" && (
          <Step key="prep2">
            <PrepHeader stageLabel="Parte 2 — Preparação" prepLeft={prepLeft} />
            <p className="mt-3 text-muted-foreground">
              {lang === "pt" ? "Pense em sua resposta..." : "Denken Sie über Ihre Antwort nach..."}
            </p>
          </Step>
        )}

        {stage === "record2" && (
          <Step key="rec2">
            <PrepHeader stageLabel="Parte 2 — Gravação" prepLeft={null} />
            <div className="mt-4">
              <WebcamRecorder
                maxSeconds={REC_MAX_SEC}
                autoStart
                uploading={uploading}
                onRecorded={(blob, dur) => uploadRecording(2, blob, dur)}
              />
            </div>
          </Step>
        )}

        {stage === "transition3" && (
          <Step key="t3">
            <h2 className="font-display text-2xl font-bold">{t.exam.part3Title}</h2>
            <p className="mt-2 text-muted-foreground">{t.exam.pickImage}</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => {
                    setChosenImage(img);
                    startPrep(PREP3_SEC, "prep3");
                  }}
                  className="group overflow-hidden rounded-xl border border-border bg-card text-left transition-all hover:border-gold hover:shadow-[var(--shadow-gold)]"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={lang === "pt" ? img.description_pt : img.description_de}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <p className="p-3 text-xs text-muted-foreground">
                    {lang === "pt" ? img.description_pt : img.description_de}
                  </p>
                </button>
              ))}
            </div>
          </Step>
        )}

        {stage === "prep3" && chosenImage && (
          <Step key="prep3">
            <PrepHeader stageLabel="Parte 3 — Preparação" prepLeft={prepLeft} />
            <div className="mt-4 overflow-hidden rounded-xl border border-border">
              <img
                src={chosenImage.url}
                alt=""
                className="max-h-96 w-full object-contain bg-black"
              />
            </div>
          </Step>
        )}

        {stage === "record3" && chosenImage && (
          <Step key="rec3">
            <PrepHeader stageLabel="Parte 3 — Gravação" prepLeft={null} />
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="overflow-hidden rounded-xl border border-border bg-black">
                <img src={chosenImage.url} alt="" className="h-full w-full object-contain" />
              </div>
              <WebcamRecorder
                maxSeconds={REC_MAX_SEC}
                autoStart
                uploading={uploading}
                onRecorded={(blob, dur) => uploadRecording(3, blob, dur)}
              />
            </div>
          </Step>
        )}

        {stage === "processing" && (
          <Step key="proc">
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="relative">
                <Sparkles className="h-16 w-16 text-gold" />
                <Loader2 className="absolute inset-0 m-auto h-20 w-20 animate-spin text-gold/40" />
              </div>
              <h2 className="mt-6 font-display text-2xl font-bold">{t.exam.processing}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{t.exam.processingSub}</p>
            </div>
          </Step>
        )}
      </AnimatePresence>
    </main>
  );
}

function Step({ children }: { children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.section>
  );
}

function PartCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="font-display font-bold">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}

function PrepHeader({ stageLabel, prepLeft }: { stageLabel: string; prepLeft: number | null }) {
  const mm = prepLeft !== null ? String(Math.floor(prepLeft / 60)).padStart(2, "0") : null;
  const ss = prepLeft !== null ? String(prepLeft % 60).padStart(2, "0") : null;
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-3">
      <span className="font-display text-sm font-bold uppercase tracking-wider">{stageLabel}</span>
      {prepLeft !== null && (
        <span className="flex items-center gap-2 font-mono text-xl font-bold text-gold">
          <Timer className="h-5 w-5" />
          {mm}:{ss}
        </span>
      )}
    </div>
  );
}

function ThemeBlock({
  title,
  desc,
  redemittel,
  tips,
}: {
  title: string;
  desc: string;
  redemittel: string[];
  tips: string[];
}) {
  return (
    <div className="mt-4 rounded-xl border border-gold/30 bg-gold/5 p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-gold">Thema / Tema</p>
      <h2 className="mt-1 font-display text-2xl font-bold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
      {redemittel.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Redemittel
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {redemittel.map((r, i) => (
              <span
                key={i}
                className="rounded-md border border-border bg-background px-2 py-0.5 text-xs"
              >
                {r}
              </span>
            ))}
          </div>
        </div>
      )}
      {tips.length > 0 && (
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {tips.map((tip, i) => (
            <li key={i}>{tip}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NotesArea({
  notes,
  setNotes,
  placeholder,
  title,
}: {
  notes: string;
  setNotes: (v: string) => void;
  placeholder: string;
  title: string;
}) {
  return (
    <div className="mt-4">
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </label>
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={placeholder}
        className="mt-2 min-h-[140px]"
      />
    </div>
  );
}
