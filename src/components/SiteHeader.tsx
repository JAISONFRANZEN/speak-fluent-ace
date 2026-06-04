import { Link } from "@tanstack/react-router";
import { Award } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { LangToggle } from "./LangToggle";
import { dueCards } from "@/lib/srs";
import { ALL_IDS } from "@/lib/flashcards";

export function SiteHeader() {
  const { t } = useI18n();
  const [due, setDue] = useState(0);

  useEffect(() => {
    const tick = () => setDue(dueCards(ALL_IDS).length);
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-3 sm:px-4">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gold text-gold-foreground">
            <Award className="h-5 w-5" />
          </span>
          <span className="truncate font-display text-sm font-bold tracking-tight sm:text-base">
            {t.appName}
          </span>
        </Link>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <LangToggle />
          <Link
            to="/dashboard"
            className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:inline"
          >
            Dashboard
          </Link>
          <Link
            to="/karteikarten"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Karteikarten
            {due > 0 && (
              <span className="rounded-full bg-gold px-1.5 py-0.5 text-[10px] font-bold leading-none text-gold-foreground">
                {due}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}

