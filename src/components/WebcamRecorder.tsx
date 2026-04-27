import { useEffect, useRef, useState } from "react";
import { Camera, Mic, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nProvider";

interface Props {
  maxSeconds: number;
  autoStart?: boolean;
  onRecorded: (blob: Blob, durationSec: number) => void | Promise<void>;
  uploading?: boolean;
}

export function WebcamRecorder({ maxSeconds, autoStart, onRecorded, uploading }: Props) {
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: true,
        });
        if (cancelled) {
          stream.getTracks().forEach((tr) => tr.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.muted = true;
          await videoRef.current.play().catch(() => {});
        }
        setReady(true);
        if (autoStart) startRecording(stream);
      } catch (e) {
        setError((e as Error).message ?? "Não foi possível acessar a câmera/microfone.");
      }
    })();
    return () => {
      cancelled = true;
      stopAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => {
      const sec = Math.floor((Date.now() - startedAtRef.current) / 1000);
      setElapsed(sec);
      if (sec >= maxSeconds) stopRecording();
    }, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording, maxSeconds]);

  function startRecording(streamArg?: MediaStream) {
    const stream = streamArg ?? streamRef.current;
    if (!stream) return;
    chunksRef.current = [];
    const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus"
      : "video/webm";
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 800_000 });
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    rec.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const dur = Math.floor((Date.now() - startedAtRef.current) / 1000);
      await onRecorded(blob, dur);
    };
    recorderRef.current = rec;
    startedAtRef.current = Date.now();
    rec.start(1000);
    setRecording(true);
  }

  function stopRecording() {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    setRecording(false);
  }

  function stopAll() {
    stopRecording();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  const remaining = Math.max(0, maxSeconds - elapsed);
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="relative overflow-hidden rounded-xl bg-black aspect-video">
        <video ref={videoRef} className="h-full w-full object-cover" playsInline />
        {recording && (
          <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-destructive px-3 py-1 text-xs font-semibold text-destructive-foreground">
            <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
            REC
          </div>
        )}
        <div className="absolute top-3 right-3 rounded-full bg-black/70 px-3 py-1 font-mono text-sm font-bold text-white">
          {mm}:{ss}
        </div>
        {!ready && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-white/80">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t.common.loading}
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-white">
            {error}
          </div>
        )}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Camera className="h-4 w-4" />
          <Mic className="h-4 w-4" />
          <span>{ready ? "OK" : "..."}</span>
        </div>
        {uploading ? (
          <Button disabled className="min-w-[180px]">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t.exam.uploading}
          </Button>
        ) : recording ? (
          <Button variant="destructive" onClick={stopRecording} className="min-w-[180px]">
            <Square className="mr-2 h-4 w-4" />
            {t.exam.stopRecording}
          </Button>
        ) : (
          <Button
            onClick={() => startRecording()}
            disabled={!ready}
            className="min-w-[180px] bg-gold text-gold-foreground hover:bg-gold/90"
          >
            <span className="mr-2 inline-block h-3 w-3 rounded-full bg-destructive" />
            {t.exam.startRecording}
          </Button>
        )}
      </div>
    </div>
  );
}
