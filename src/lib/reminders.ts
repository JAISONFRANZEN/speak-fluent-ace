// Daily reminders via Web Notifications API.
// Stored preference: enabled + time (HH:mm). Daily check runs while app open.

const PREF_KEY = "b1_reminder_pref_v1";
const LAST_SENT_KEY = "b1_reminder_last_v1";

export interface ReminderPref {
  enabled: boolean;
  time: string; // "HH:mm"
}

export function getPref(): ReminderPref {
  if (typeof window === "undefined") return { enabled: false, time: "19:00" };
  try {
    return JSON.parse(localStorage.getItem(PREF_KEY) || "") as ReminderPref;
  } catch {
    return { enabled: false, time: "19:00" };
  }
}

export function setPref(pref: ReminderPref) {
  localStorage.setItem(PREF_KEY, JSON.stringify(pref));
}

export function permissionState(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export async function requestPermission(): Promise<NotificationPermission | "unsupported"> {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  return Notification.requestPermission();
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function maybeSendReminder(dueCount: number) {
  if (typeof window === "undefined") return;
  const pref = getPref();
  if (!pref.enabled || dueCount === 0) return;
  if (permissionState() !== "granted") return;

  const [hh, mm] = pref.time.split(":").map(Number);
  const now = new Date();
  const scheduled = new Date();
  scheduled.setHours(hh, mm, 0, 0);
  if (now < scheduled) return; // not yet

  const last = localStorage.getItem(LAST_SENT_KEY);
  if (last === todayKey()) return; // already sent

  try {
    new Notification("Karteikarten — Hora de revisar!", {
      body: `Você tem ${dueCount} cartão${dueCount > 1 ? "ões" : ""} para revisar hoje. Mantenha sua sequência!`,
      icon: "/favicon.ico",
      tag: "b1-flashcards-daily",
    });
    localStorage.setItem(LAST_SENT_KEY, todayKey());
  } catch {
    // silently ignore
  }
}

// Hook-style helper: poll every minute while app open.
export function startReminderLoop(getDueCount: () => number) {
  if (typeof window === "undefined") return () => undefined;
  const tick = () => maybeSendReminder(getDueCount());
  tick();
  const id = window.setInterval(tick, 60_000);
  return () => window.clearInterval(id);
}
