import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Loader2, CheckCircle2, Building2, Phone, Mail, MapPin, ArrowLeft } from "lucide-react";
import logoImg from "@/assets/logo.png";

export const Route = createFileRoute("/registrar-mezquita")({ component: RegisterMosquePage });

const CURRENCIES = [
  { code: "EUR", label: "EUR (€)" },
  { code: "MAD", label: "MAD (د.م.)" },
  { code: "USD", label: "USD ($)" },
  { code: "GBP", label: "GBP (£)" },
  { code: "SAR", label: "SAR (﷼)" },
  { code: "TRY", label: "TRY (₺)" },
  { code: "DZD", label: "DZD (د.ج)" },
  { code: "TND", label: "TND (د.ت)" },
];

function RegisterMosquePage() {
  const { t, lang, setLang } = useI18n();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    name: "", address: "", contact_phone: "", contact_email: "",
    bank_account: "", currency: "EUR", initial_budget: "",
    classes_paid: false,
  });

  const up = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Attempt geocoding
    let lat = null;
    let lng = null;
    if (form.address) {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(form.address)}`);
        const json = await res.json();
        if (json && json.length > 0) {
          lat = parseFloat(json[0].lat);
          lng = parseFloat(json[0].lon);
        }
      } catch (e) {
        console.error("Geocoding error", e);
      }
    }

    const { error } = await supabase.from("mosques").insert({
      name: form.name,
      address: form.address || null,
      lat,
      lng,
      contact_phone: form.contact_phone || null,
      contact_email: form.contact_email || null,
      bank_account: form.bank_account || null,
      currency: form.currency as any,
      initial_budget: Number(form.initial_budget) || 0,
      classes_paid: form.classes_paid,
      status: "pending",
    });
    setLoading(false);
    if (!error) setDone(true);
  };

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 islamic-pattern">
        <div className="max-w-sm text-center animate-slide-up glass rounded-2xl p-8">
          <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-lg font-display font-bold mb-2">🕌 {form.name}</h2>
          <p className="text-sm text-muted-foreground mb-4">{t("mosque_registered") as string}</p>
          <Link to="/login" className="text-sm text-primary hover:underline font-medium">{t("login") as string}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 islamic-pattern">
      <div className="max-w-lg mx-auto animate-slide-up">
        {/* Header */}
        <div className="text-center mb-5">
          <img src={logoImg} alt="MizanMasjid" className="h-14 mx-auto mb-2" />
          <h1 className="text-xl font-display font-bold">{t("create_mosque") as string}</h1>
          <p className="text-xs text-muted-foreground mt-1">{t("app_subtitle") as string}</p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-2xl p-5 space-y-4">
          {/* Mosque Name */}
          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 block">{t("mosque_name") as string} *</label>
            <div className="relative">
              <Building2 className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="text" required value={form.name} onChange={e => up("name", e.target.value)}
                className="w-full ps-10 pe-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 block">{t("address") as string}</label>
            <div className="relative">
              <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="text" value={form.address} onChange={e => up("address", e.target.value)}
                placeholder="Calle, Ciudad, País"
                className="w-full ps-10 pe-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>

          {/* Contact phone & email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 block">{t("phone") as string} *</label>
              <div className="relative">
                <Phone className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="tel" required value={form.contact_phone} onChange={e => up("contact_phone", e.target.value)}
                  className="w-full ps-10 pe-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 block">{t("email") as string}</label>
              <div className="relative">
                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="email" value={form.contact_email} onChange={e => up("contact_email", e.target.value)}
                  className="w-full ps-10 pe-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>
          </div>

          {/* Bank + Currency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 block">{t("bank_account") as string}</label>
              <input type="text" value={form.bank_account} onChange={e => up("bank_account", e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 block">{t("currency") as string}</label>
              <select value={form.currency} onChange={e => up("currency", e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20">
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
            </div>
          </div>

          {/* Initial budget */}
          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 block">{t("initial_budget") as string}</label>
            <input type="number" step="0.01" value={form.initial_budget} onChange={e => up("initial_budget", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20"
              placeholder="0.00" />
          </div>

          {/* Classes paid radio buttons */}
          <div className="p-3 bg-muted/30 border border-border/50 rounded-xl space-y-3">
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground block">Tipo de Educación (Clases)</label>
            <div className="space-y-2">
              <label className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-background/50 transition-colors">
                <input type="radio" name="classes_paid" checked={!form.classes_paid} onChange={() => up("classes_paid", false)}
                  className="mt-1 w-4 h-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Clases gratuitas (Maktab)</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">La enseñanza es impartida sin coste para los alumnos, asumiendo la mezquita los gastos.</p>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-background/50 transition-colors">
                <input type="radio" name="classes_paid" checked={form.classes_paid} onChange={() => up("classes_paid", true)}
                  className="mt-1 w-4 h-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Clases de pago (Cuotas mensuales)</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Los alumnos deben abonar una cuota mensual por su formación educativa.</p>
                </div>
              </label>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("create_mosque") as string}
          </button>

          <div className="text-center">
            <Link to="/login" className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" /> {t("login") as string}
            </Link>
          </div>
        </form>

        {/* Language toggle */}
        <div className="flex justify-center mt-4">
          <div className="flex gap-1 bg-background/80 rounded-full p-0.5 shadow-sm border border-border/50">
            <button onClick={() => setLang("es")} className={`px-3 py-1 text-xs rounded-full transition-all ${lang === "es" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"}`}>🇪🇸 ES</button>
            <button onClick={() => setLang("ar")} className={`px-3 py-1 text-xs rounded-full transition-all ${lang === "ar" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"}`}>🇸🇦 AR</button>
          </div>
        </div>
      </div>
    </div>
  );
}
