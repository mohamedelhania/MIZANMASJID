import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import {
  LayoutDashboard, Users, GraduationCap, HandCoins, Receipt,
  TrendingUp, Moon, Building2, LogOut, Menu, X, ChevronRight,
  BookOpen, Shield, Eye, UserCog, Landmark, ArrowLeft, ClipboardCheck, FileText
} from "lucide-react";
import logoImg from "@/assets/logo.png";
import { GlobalSearch } from "./GlobalSearch";

export function AppShell() {
  const { user, role, mosque, managingMosqueId, setManagingMosqueId, signOut } = useAuth();
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const navigate = useNavigate();

  const isSA = role === "super_admin";
  const isManaging = isSA && !!managingMosqueId;

  type NavItem = { to: string; label: string; icon: React.ReactNode; };

  // Build navigation based on role and whether SA is managing a mosque
  const navItems: NavItem[] = [];

  if (isSA && !isManaging) {
    // Super Admin global view — only Mosques
    navItems.push({ to: "/mezquitas", label: t("mosques") as string, icon: <Landmark className="h-5 w-5" /> });
  } else {
    // Dashboard visible for SA, gerente, supervisor
    if (role !== "profesorado") {
      navItems.push({ to: "/dashboard", label: t("dashboard") as string, icon: <LayoutDashboard className="h-5 w-5" /> });
    }

    // Students & Education: SA, gerente, profesorado
    if (isSA || role === "gerente" || role === "profesorado") {
      navItems.push({ to: "/alumnos", label: t("students") as string, icon: <GraduationCap className="h-5 w-5" /> });
      navItems.push({ to: "/aulas", label: t("classrooms") as string, icon: <BookOpen className="h-5 w-5" /> });
    }

    // Finance: SA, gerente, supervisor
    if (isSA || role === "gerente" || role === "supervisor") {
      navItems.push({ to: "/shart", label: t("shart") as string, icon: <HandCoins className="h-5 w-5" /> });
      navItems.push({ to: "/gastos", label: t("expenses") as string, icon: <Receipt className="h-5 w-5" /> });
      navItems.push({ to: "/ingresos", label: t("incomes") as string, icon: <TrendingUp className="h-5 w-5" /> });
      navItems.push({ to: "/ramadan", label: t("ramadan") as string, icon: <Moon className="h-5 w-5" /> });
    }

    // Users management: SA, gerente
    if (isSA || role === "gerente") {
      navItems.push({ to: "/usuarios", label: t("users") as string, icon: <Users className="h-5 w-5" /> });
    }
  }

  const isActive = (to: string) => loc.pathname === to || loc.pathname.startsWith(to + "/") || loc.pathname.startsWith(to + ".");

  // Role badge
  const roleBadge = () => {
    const roleMap: Record<string, { icon: React.ReactNode; cls: string }> = {
      super_admin: { icon: <Shield className="h-3 w-3" />, cls: "badge-admin" },
      gerente: { icon: <UserCog className="h-3 w-3" />, cls: "badge-admin" },
      profesorado: { icon: <GraduationCap className="h-3 w-3" />, cls: "badge-teacher" },
      supervisor: { icon: <Eye className="h-3 w-3" />, cls: "badge-supervisor" },
    };
    const r = roleMap[role || ""];
    if (!r) return null;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${r.cls}`}>
        {r.icon} {t(role as any) as string}
      </span>
    );
  };

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : (user?.email?.slice(0, 2).toUpperCase() || "??");

  const handleBackToMosques = () => {
    setManagingMosqueId(null);
    navigate({ to: "/mezquitas" });
    setOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* ── MOBILE MENU DRAWER ── */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setOpen(false)} />
          
          {/* Drawer Container */}
          <div className="relative w-[280px] h-full bg-background border-r border-border/50 shadow-2xl flex flex-col animate-slide-in-left overflow-y-auto z-10 text-foreground">
            {/* Header / Logo */}
            <div className="p-5 border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <img src={logoImg} alt="MizanMasjid" className="h-8 w-auto" />
                 <span className="font-display font-bold text-lg tracking-tight">
                   {isManaging ? mosque?.name : (isSA ? "MizanMasjid" : (mosque?.name || "MizanMasjid"))}
                 </span>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 text-muted-foreground hover:bg-muted rounded-full transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Back to Mosques button for SA managing */}
            {isManaging && (
              <button onClick={handleBackToMosques} className="flex items-center gap-2 w-full px-5 py-4 text-[15px] text-primary hover:bg-primary/5 transition-colors font-medium border-b border-border/50">
                <ArrowLeft className="h-4 w-4" /> {t("mosques") as string}
              </button>
            )}

            {/* Navigation */}
            <nav className="flex-1 py-4 px-3 space-y-1">
              {navItems.map(item => (
                <div key={item.to}>
                  <Link
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium transition-all ${
                      isActive(item.to)
                        ? "bg-primary/10 text-primary shadow-sm"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    {item.icon}
                    <span className="flex-1">{item.label}</span>
                    {isActive(item.to) && <ChevronRight className="h-4 w-4 text-primary/50" />}
                  </Link>
                  {item.to === "/dashboard" && (
                    <div className="px-4 py-3 mt-1 mb-2 bg-primary/5 rounded-xl border border-primary/10 text-center">
                      <p className="text-[12px] text-foreground font-bold font-arabic leading-relaxed opacity-100" dir="rtl">
                        لَا تَقُمْ فِيهِ أَبَدًۭا ۚ لَّمَسْجِدٌ أُسِّسَ عَلَى ٱلتَّقْوَىٰ مِنْ أَوَّلِ يَوْمٍ أَحَقُّ أَن تَقُومَ فِيهِ ۚ فِيهِ رِجَالٌۭ يُحِبُّونَ أَن يَتَطَهَّرُوا۟ ۚ وَٱللَّهُ يُحِبُّ ٱلْمُطَّهِّرِينَ 9:108
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* User & Settings */}
            <div className="p-4 border-t border-border/50 bg-muted/10 flex-col gap-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="avatar-initials text-xs shadow-sm border border-border/50">{initials}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate text-foreground">{user?.user_metadata?.full_name || user?.email}</p>
                  <div className="mt-0.5">{roleBadge()}</div>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-muted rounded-full p-1 mb-3 border border-border/50">
                <button onClick={() => setLang("es")}
                  className={`flex-1 text-[11px] py-2 rounded-full transition-all ${lang === "es" ? "bg-background shadow font-medium text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  🇪🇸 ES
                </button>
                <button onClick={() => setLang("ar")}
                  className={`flex-1 text-[11px] py-2 rounded-full transition-all ${lang === "ar" ? "bg-background shadow font-medium text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  🇸🇦 AR
                </button>
              </div>

              <button onClick={() => signOut()} className="flex items-center justify-center gap-2 w-full py-3 text-sm font-medium text-muted-foreground hover:text-destructive bg-background hover:bg-destructive/10 border border-border/50 rounded-xl transition-all shadow-sm">
                <LogOut className="h-4 w-4" /> {t("logout") as string}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-border/50 bg-background/50 backdrop-blur-xl z-10">
        {/* Logo */}
        <div className="p-5 border-b border-border/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="MizanMasjid" className="h-10 w-auto" />
            <div className="min-w-0">
              <h1 className="text-base font-display font-bold text-foreground leading-none tracking-tight">MizanMasjid</h1>
              {isManaging && mosque && (
                <p className="text-[11px] text-primary font-medium truncate mt-1">{mosque.name}</p>
              )}
              {!isManaging && mosque && (
                <p className="text-[11px] text-muted-foreground truncate mt-1">{mosque.name}</p>
              )}
              {isSA && !isManaging && <p className="text-[11px] text-primary font-medium mt-1">Super Admin</p>}
            </div>
          </div>
        </div>

        {/* Back to Mosques button for SA managing */}
        {isManaging && (
          <button
            onClick={handleBackToMosques}
            className="flex items-center gap-2 w-full px-5 py-3 text-sm text-primary hover:bg-primary/5 border-b border-border/50 transition-colors font-medium flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" /> ← {t("mosques") as string}
          </button>
        )}

        {/* Nav links */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map(item => (
            <div key={item.to}>
              <Link
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive(item.to)
                    ? "bg-primary/10 text-primary nav-active-indicator"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                {item.icon}
                <span className="flex-1 truncate">{item.label}</span>
                {isActive(item.to) && <ChevronRight className="h-4 w-4 text-primary/50" />}
              </Link>
              {item.to === "/dashboard" && (
                <div className="px-3 py-3 mt-1.5 mb-2.5 bg-primary/5 rounded-xl border border-primary/10 text-center">
                  <p className="text-[11px] text-foreground font-bold font-arabic leading-relaxed opacity-100" dir="rtl">
                    لَا تَقُمْ فِيهِ أَبَدًۭا ۚ لَّمَسْجِدٌ أُسِّسَ عَلَى ٱلتَّقْوَىٰ مِنْ أَوَّلِ يَوْمٍ أَحَقُّ أَن تَقُومَ فِيهِ ۚ فِيهِ رِجَالٌۭ يُحِبُّونَ أَن يَتَطَهَّرُوا۟ ۚ وَٱللَّهُ يُحِبُّ ٱلْمُطَّهِّرِينَ 9:108
                  </p>
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-border/50 bg-muted/10 flex-shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="avatar-initials text-xs shadow-sm border border-border/50">{initials}</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate text-foreground">{user?.user_metadata?.full_name || user?.email}</p>
              <div className="mt-0.5">{roleBadge()}</div>
            </div>
          </div>

          {/* Language toggle */}
          <div className="flex items-center gap-1 bg-muted rounded-full p-1 mb-3 border border-border/50">
            <button onClick={() => setLang("es")}
              className={`flex-1 text-[11px] py-1.5 rounded-full transition-all ${lang === "es" ? "bg-background shadow font-medium text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              🇪🇸 ES
            </button>
            <button onClick={() => setLang("ar")}
              className={`flex-1 text-[11px] py-1.5 rounded-full transition-all ${lang === "ar" ? "bg-background shadow font-medium text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              🇸🇦 AR
            </button>
          </div>

          <button onClick={() => signOut()} className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm font-medium text-muted-foreground hover:text-destructive bg-background hover:bg-destructive/10 border border-border/50 rounded-xl transition-all shadow-sm">
            <LogOut className="h-4 w-4" /> {t("logout") as string}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden relative">
        {/* Top bar (Mobile + Desktop Search) */}
        <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <button onClick={() => setOpen(true)} className="lg:hidden p-2 -ml-2 rounded-xl text-foreground hover:bg-muted/80 transition-colors">
              <Menu className="h-6 w-6" />
            </button>
            <div className="lg:hidden flex items-center gap-2.5 min-w-0">
              <img src={logoImg} alt="MizanMasjid" className="h-8 w-auto" />
              <span className="text-base font-display font-bold flex-1 truncate tracking-tight text-foreground">
                {isManaging ? mosque?.name : (isSA ? "MizanMasjid" : (mosque?.name || "MizanMasjid"))}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full max-w-xs justify-end">
            <GlobalSearch />
          </div>
        </div>

        <div className="p-4 md:p-6 lg:p-8 animate-fade-in flex-1 overflow-y-auto custom-scrollbar">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
