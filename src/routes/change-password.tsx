import { useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Lock, Loader2, ShieldCheck } from "lucide-react";
import logoImg from "@/assets/logo.png";

export const Route = createFileRoute("/change-password")({ component: ChangePasswordPage });

function ChangePasswordPage() {
  const { user, mustChangePassword, changePassword, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" />;
  if (!mustChangePassword) return <Navigate to="/dashboard" />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) { setError("Mínimo 8 caracteres"); return; }
    if (pw !== confirm) { setError("Las contraseñas no coinciden"); return; }
    setLoading(true);
    setError("");
    const { error: err } = await changePassword(pw);
    if (err) setError(err);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8 islamic-pattern">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="text-center mb-6">
          <img src={logoImg} alt="MizanMasjid" className="h-14 mx-auto mb-3" />
          <ShieldCheck className="h-10 w-10 text-primary mx-auto mb-2" />
          <h1 className="text-lg font-display font-bold">{t("change_password") as string}</h1>
          <p className="text-xs text-muted-foreground mt-1">{t("change_password_msg") as string}</p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 block">{t("new_password") as string}</label>
            <div className="relative">
              <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="password" value={pw} onChange={e => setPw(e.target.value)} required
                className="w-full ps-10 pe-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="••••••••" />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 block">{t("confirm_password") as string}</label>
            <div className="relative">
              <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
                className="w-full ps-10 pe-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="••••••••" />
            </div>
          </div>

          {error && <p className="text-xs text-destructive text-center">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("change_password") as string}
          </button>
        </form>
      </div>
    </div>
  );
}
