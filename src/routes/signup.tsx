import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { SiteHeader } from "@/components/SiteHeader";
import { maskWhatsapp, isValidWhatsapp } from "@/lib/whatsapp";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function genCaptcha() {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  return { a, b, answer: a + b };
}

function SignupPage() {
  const { t } = useI18n();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [captcha, setCaptcha] = useState(() => genCaptcha());
  const [form, setForm] = useState({
    name: "",
    email: "",
    whatsapp: "",
    password: "",
    captcha: "",
    consent: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(2, t.common.requiredField).max(100),
        email: z.string().trim().email(t.common.invalidEmail).max(255),
        whatsapp: z.string().refine(isValidWhatsapp, t.common.invalidWhatsapp),
        password: z.string().min(8, t.common.passwordShort).max(72),
        captcha: z
          .string()
          .refine((v) => Number(v) === captcha.answer, t.common.invalidCaptcha),
        consent: z.literal(true, { errorMap: () => ({ message: t.common.mustConsent }) }),
      }),
    [captcha.answer, t]
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((iss) => {
        if (iss.path[0]) errs[String(iss.path[0])] = iss.message;
      });
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    const redirectUrl = `${window.location.origin}/dashboard`;
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: parsed.data.name,
          whatsapp: parsed.data.whatsapp,
          consent_marketing: parsed.data.consent,
        },
      },
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      setCaptcha(genCaptcha());
      setForm((f) => ({ ...f, captcha: "" }));
      return;
    }
    toast.success(t.signup.success);
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col px-4 py-12">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-elegant)]">
          <h1 className="font-display text-2xl font-extrabold tracking-tight">
            {t.signup.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.signup.subtitle}</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="name">{t.signup.name}</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                autoComplete="name"
                maxLength={100}
              />
              {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
            </div>

            <div>
              <Label htmlFor="email">{t.signup.email}</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
              />
              {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
            </div>

            <div>
              <Label htmlFor="whatsapp">{t.signup.whatsapp}</Label>
              <Input
                id="whatsapp"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: maskWhatsapp(e.target.value) })}
                placeholder={t.signup.whatsappPh}
                inputMode="tel"
                autoComplete="tel"
              />
              {errors.whatsapp && (
                <p className="mt-1 text-xs text-destructive">{errors.whatsapp}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password">{t.signup.password}</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={t.signup.passwordPh}
                autoComplete="new-password"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-destructive">{errors.password}</p>
              )}
            </div>

            <div className="rounded-md border border-border bg-secondary/50 p-3">
              <Label htmlFor="captcha" className="text-sm">
                {t.signup.captcha}{" "}
                <span className="font-semibold">
                  {captcha.a} + {captcha.b} = ?
                </span>
              </Label>
              <Input
                id="captcha"
                value={form.captcha}
                onChange={(e) => setForm({ ...form, captcha: e.target.value })}
                placeholder={t.signup.captchaPh}
                inputMode="numeric"
                className="mt-2 max-w-[120px]"
              />
              {errors.captcha && (
                <p className="mt-1 text-xs text-destructive">{errors.captcha}</p>
              )}
            </div>

            <label className="flex items-start gap-3 rounded-md border border-border bg-background p-3">
              <Checkbox
                id="consent"
                checked={form.consent}
                onCheckedChange={(v) => setForm({ ...form, consent: v === true })}
                className="mt-0.5"
              />
              <span className="text-xs leading-relaxed text-muted-foreground">
                {t.signup.consent}
              </span>
            </label>
            {errors.consent && (
              <p className="-mt-2 text-xs text-destructive">{errors.consent}</p>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
              size="lg"
            >
              {submitting ? "..." : t.signup.submit}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t.signup.already}{" "}
            <Link to="/login" className="font-semibold text-foreground hover:underline">
              {t.signup.loginLink}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
