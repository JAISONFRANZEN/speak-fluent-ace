// SM-2 spaced repetition algorithm + localStorage persistence.
// Quality scale: 0 (esqueci) | 3 (difícil) | 4 (bom) | 5 (fácil).

export interface CardProgress {
  cardId: number;
  ease: number;
  interval: number; // days
  repetitions: number;
  dueAt: number; // ms epoch
  lastReviewedAt: number | null;
  lastQuality: number | null;
}

const STORAGE_KEY = "b1_srs_progress_v1";
const STATS_KEY = "b1_srs_stats_v1";

export interface DailyStats {
  date: string; // YYYY-MM-DD
  reviewed: number;
  correct: number;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function readAll(): Record<number, CardProgress> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeAll(map: Record<number, CardProgress>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function getProgress(cardId: number): CardProgress {
  const all = readAll();
  return (
    all[cardId] ?? {
      cardId,
      ease: 2.5,
      interval: 0,
      repetitions: 0,
      dueAt: Date.now(),
      lastReviewedAt: null,
      lastQuality: null,
    }
  );
}

export function getAllProgress(cardIds: number[]): CardProgress[] {
  return cardIds.map((id) => getProgress(id));
}

export function dueCards(cardIds: number[], now = Date.now()): CardProgress[] {
  return getAllProgress(cardIds)
    .filter((p) => p.dueAt <= now)
    .sort((a, b) => a.dueAt - b.dueAt);
}

export function recordReview(cardId: number, quality: 0 | 3 | 4 | 5): CardProgress {
  const prev = getProgress(cardId);
  let { ease, interval, repetitions } = prev;

  if (quality < 3) {
    repetitions = 0;
    interval = 0;
  } else {
    repetitions += 1;
    if (repetitions === 1) interval = 1;
    else if (repetitions === 2) interval = 6;
    else interval = Math.round(interval * ease);

    ease = Math.max(
      1.3,
      ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
    );
  }

  const dueAt =
    interval === 0
      ? Date.now() + 10 * 60 * 1000 // 10 minutes
      : Date.now() + interval * 24 * 60 * 60 * 1000;

  const next: CardProgress = {
    cardId,
    ease: Number(ease.toFixed(2)),
    interval,
    repetitions,
    dueAt,
    lastReviewedAt: Date.now(),
    lastQuality: quality,
  };
  const all = readAll();
  all[cardId] = next;
  writeAll(all);

  bumpStats(quality >= 3);
  return next;
}

export function resetProgress() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STATS_KEY);
}

function bumpStats(correct: boolean) {
  if (typeof window === "undefined") return;
  let stats: DailyStats[] = [];
  try {
    stats = JSON.parse(localStorage.getItem(STATS_KEY) || "[]");
  } catch {
    stats = [];
  }
  const today = todayKey();
  let entry = stats.find((s) => s.date === today);
  if (!entry) {
    entry = { date: today, reviewed: 0, correct: 0 };
    stats.push(entry);
  }
  entry.reviewed += 1;
  if (correct) entry.correct += 1;
  // keep last 30 days
  stats = stats.slice(-30);
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export function getStats(): DailyStats[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STATS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function todayStats(): DailyStats {
  const today = todayKey();
  return (
    getStats().find((s) => s.date === today) ?? { date: today, reviewed: 0, correct: 0 }
  );
}

export function nextDueDate(cardIds: number[]): Date | null {
  const all = getAllProgress(cardIds);
  if (all.length === 0) return null;
  const min = Math.min(...all.map((p) => p.dueAt));
  return new Date(min);
}
