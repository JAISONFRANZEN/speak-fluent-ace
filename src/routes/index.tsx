import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Award, Clock, Sparkles, FileText, Languages, ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { t } = useI18n();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            className="absolute inset-0 -z-10 opacity-40"
            style={{
              background:
                "radial-gradient(60% 60% at 50% 0%, oklch(0.78 0.13 86 / 0.25) 0%, transparent 70%)",
            }}
          />
          <div className="mx-auto max-w-6xl px-4 pb-12 pt-12 sm:pb-16 sm:pt-28">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mx-auto max-w-3xl text-center"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-foreground sm:text-xs">
                <Languages className="h-3.5 w-3.5 text-gold" />
                <span className="truncate">Goethe-Institut · Mündliche Prüfung</span>
              </span>
              <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
                {t.landing.hero1}{" "}
                <span className="text-gold">{t.landing.hero2}</span>
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:mt-6 sm:text-lg">
                {t.landing.sub}
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-3">
                <Button
                  size="lg"
                  onClick={() => navigate({ to: "/signup" })}
                  className="bg-gold text-gold-foreground shadow-[var(--shadow-gold)] hover:bg-gold/90"
                >
                  {t.cta.signup}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate({ to: "/login" })}
                >
                  {t.cta.login}
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-border bg-secondary/40">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Clock, title: t.landing.feature1Title, body: t.landing.feature1 },
                { icon: Sparkles, title: t.landing.feature2Title, body: t.landing.feature2 },
                { icon: Languages, title: t.landing.feature3Title, body: t.landing.feature3 },
                { icon: FileText, title: t.landing.feature4Title, body: t.landing.feature4 },
              ].map(({ icon: Icon, title, body }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="rounded-xl border border-border bg-card p-6 shadow-sm"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-4xl px-4 py-20 text-center">
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            {t.tagline}
          </h2>
          <Button
            size="lg"
            onClick={() => navigate({ to: "/signup" })}
            className="mt-8 bg-gold text-gold-foreground hover:bg-gold/90"
          >
            <Award className="mr-2 h-5 w-5" />
            {t.cta.signup}
          </Button>
          <p className="mt-4 text-xs text-muted-foreground">
            Acesso vitalício · Sem cobrança
          </p>
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} #SemLacunas · Simulador B1 Sob Pressão
      </footer>
    </div>
  );
}
