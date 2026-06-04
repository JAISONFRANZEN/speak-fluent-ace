import { Link, useNavigate } from "@tanstack/react-router";
import { Award, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LangToggle } from "./LangToggle";
import { dueCards } from "@/lib/srs";
import { ALL_IDS } from "@/lib/flashcards";

export function SiteHeader() {
  const { t } = useI18n();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [due, setDue] = useState(0);

  useEffect(() => {
    if (!user) return;
    const tick = () => setDue(dueCards(ALL_IDS).length);
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [user]);

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
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:inline"
              >
                Dashboard
              </Link>
              <Link
                to="/karteikarten"
                className="hidden items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground sm:inline-flex"
              >
                Karteikarten
                {due > 0 && (
                  <span className="rounded-full bg-gold px-1.5 py-0.5 text-[10px] font-bold leading-none text-gold-foreground">
                    {due}
                  </span>
                )}
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await signOut();
                  navigate({ to: "/" });
                }}
              >
                <LogOut className="mr-1 h-4 w-4" />
                {t.cta.logout}
              </Button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {t.cta.login}
              </Link>
              <Button
                size="sm"
                onClick={() => navigate({ to: "/signup" })}
                className="bg-gold text-gold-foreground hover:bg-gold/90"
              >
                {t.cta.signup}
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
