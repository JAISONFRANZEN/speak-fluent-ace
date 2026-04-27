import { Link, useNavigate } from "@tanstack/react-router";
import { Award, LogOut } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LangToggle } from "./LangToggle";

export function SiteHeader() {
  const { t } = useI18n();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gold text-gold-foreground">
            <Award className="h-5 w-5" />
          </span>
          <span className="font-display text-base font-bold tracking-tight">
            {t.appName}
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <LangToggle />
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:inline"
              >
                Dashboard
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
