import { useI18n } from "@/i18n/I18nProvider";
import { Button } from "@/components/ui/button";

export function LangToggle() {
  const { lang, setLang } = useI18n();
  return (
    <div className="inline-flex rounded-md border border-border overflow-hidden text-xs">
      <button
        type="button"
        onClick={() => setLang("pt")}
        className={`px-2.5 py-1 font-semibold transition-colors ${
          lang === "pt" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-secondary"
        }`}
      >
        PT
      </button>
      <button
        type="button"
        onClick={() => setLang("de")}
        className={`px-2.5 py-1 font-semibold transition-colors ${
          lang === "de" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-secondary"
        }`}
      >
        DE
      </button>
    </div>
  );
}
