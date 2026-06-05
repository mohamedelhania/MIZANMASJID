import { useState } from "react";
import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import logoImg from "@/assets/logo.png";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const { user, loading: authLoading, signIn } = useAuth();
  const { lang, setLang, t } = useI18n();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (authLoading) return null;
  if (user) return <Navigate to="/dashboard" />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error: err } = await signIn(email, pw);
    if (err) setError(t("invalid_credentials") as string);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8 islamic-pattern">
      <div className="w-full max-w-sm animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-6">
          <img src={logoImg} alt="MizanMasjid" className="h-16 md:h-20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{t("welcome_back") as string}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 block">{t("email") as string}</label>
            <div className="relative">
              <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email"
                className="w-full ps-10 pe-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="correo@ejemplo.com" />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 block">{t("password") as string}</label>
            <div className="relative">
              <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type={showPw ? "text" : "password"} value={pw} onChange={e => setPw(e.target.value)} required autoComplete="current-password"
                className="w-full ps-10 pe-10 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="••••••" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-destructive text-center">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("login") as string}
          </button>

          <div className="text-center pt-2 border-t border-border/50">
            <Link to="/registrar-mezquita" className="text-xs text-primary hover:underline font-medium">
              🕌 {t("create_mosque") as string}
            </Link>
          </div>
        </form>

        {/* Language toggle */}
        <div className="flex justify-center mt-4">
          <div className="flex gap-1 bg-background/80 rounded-full p-0.5 shadow-sm border border-border/50">
            <button onClick={() => setLang("es")}
              className={`px-3 py-1 text-xs rounded-full transition-all ${lang === "es" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"}`}>
              🇪🇸 Español
            </button>
            <button onClick={() => setLang("ar")}
              className={`px-3 py-1 text-xs rounded-full transition-all ${lang === "ar" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"}`}>
              العربية
            </button>
          </div>
        </div>

        {/* Quote */}
        <div className="mt-8 text-center px-4">
          <p className="text-[13px] text-foreground font-arabic leading-relaxed font-bold opacity-100" dir="rtl">
            لَا تَقُمْ فِيهِ أَبَدًۭا ۚ لَّمَسْجِدٌ أُسِّسَ عَلَى ٱلتَّقْوَىٰ مِنْ أَوَّلِ يَوْمٍ أَحَقُّ أَن تَقُومَ فِيهِ ۚ فِيهِ رِجَالٌۭ يُحِبُّونَ أَن يَتَطَهَّرُوا۟ ۚ وَٱللَّهُ يُحِبُّ ٱلْمُطَّهِّرِينَ 9:108
          </p>
        </div>
      </div>
    </div>
  );
}
