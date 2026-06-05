import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Role = "super_admin" | "gerente" | "profesorado" | "supervisor";

export interface MosqueInfo {
  id: string;
  name: string;
  currency: string;
  initial_budget: number;
  bank_account: string | null;
  address: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  classes_paid: boolean;
  status: string;
}

interface AuthCtx {
  user: User | null;
  session: Session | null;
  role: Role | null;
  mosqueId: string | null;
  mosque: MosqueInfo | null;
  mustChangePassword: boolean;
  loading: boolean;
  /** Super Admin: ID of the mosque currently being managed */
  managingMosqueId: string | null;
  setManagingMosqueId: (id: string | null) => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<{ error: string | null }>;
  reloadAuth: () => Promise<void>;
  canAccessFinance: () => boolean;
  canAccessStudents: () => boolean;
  canModifyData: () => boolean;
  isSuperAdmin: () => boolean;
  formatCurrency: (amount: number) => string;
}

const CURRENCY_MAP: Record<string, { locale: string; code: string }> = {
  EUR: { locale: "es-ES", code: "EUR" },
  MAD: { locale: "fr-MA", code: "MAD" },
  USD: { locale: "en-US", code: "USD" },
  GBP: { locale: "en-GB", code: "GBP" },
  SAR: { locale: "ar-SA", code: "SAR" },
  TRY: { locale: "tr-TR", code: "TRY" },
  DZD: { locale: "ar-DZ", code: "DZD" },
  TND: { locale: "ar-TN", code: "TND" },
};

const Ctx = createContext<AuthCtx>({
  user: null, session: null, role: null, mosqueId: null, mosque: null,
  mustChangePassword: false, loading: true,
  managingMosqueId: null, setManagingMosqueId: () => {},
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  changePassword: async () => ({ error: null }),
  reloadAuth: async () => {},
  canAccessFinance: () => false,
  canAccessStudents: () => false,
  canModifyData: () => false,
  isSuperAdmin: () => false,
  formatCurrency: (n) => String(n),
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [baseMosqueId, setBaseMosqueId] = useState<string | null>(null);
  const [baseMosque, setBaseMosque] = useState<MosqueInfo | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [loading, setLoading] = useState(true);

  // Super Admin managing a specific mosque
  const [managingMosqueId, setManagingMosqueIdState] = useState<string | null>(() => {
    return typeof window !== "undefined" ? sessionStorage.getItem("managingMosqueId") : null;
  });
  const [managingMosque, setManagingMosque] = useState<MosqueInfo | null>(null);

  const setManagingMosqueId = (id: string | null) => {
    setManagingMosqueIdState(id);
    if (typeof window !== "undefined") {
      if (id) sessionStorage.setItem("managingMosqueId", id);
      else sessionStorage.removeItem("managingMosqueId");
    }
  };

  // Load managing mosque data when managingMosqueId changes
  useEffect(() => {
    if (!managingMosqueId) {
      setManagingMosque(null);
      return;
    }
    supabase.from("mosques").select("*").eq("id", managingMosqueId).single().then(({ data }) => {
      if (data) setManagingMosque(data as unknown as MosqueInfo);
    });
  }, [managingMosqueId]);

  // Effective mosque = managingMosque if SA is managing, else base mosque
  const isSA = role === "super_admin";
  const effectiveMosqueId = isSA && managingMosqueId ? managingMosqueId : baseMosqueId;
  const effectiveMosque = isSA && managingMosqueId ? managingMosque : baseMosque;

  const loadUserData = async (uid: string) => {
    // Load role + mosque
    const { data: roles } = await supabase.from("user_roles").select("role, mosque_id").eq("user_id", uid);
    if (!roles || roles.length === 0) { setRole(null); setBaseMosqueId(null); return; }

    // Priority: super_admin > gerente > profesorado > supervisor
    const sa = roles.find(r => r.role === "super_admin");
    if (sa) {
      setRole("super_admin");
      setBaseMosqueId(null);
      setBaseMosque(null);
    } else {
      const priority: Role[] = ["gerente", "profesorado", "supervisor"];
      const sorted = roles.sort((a, b) => priority.indexOf(a.role as Role) - priority.indexOf(b.role as Role));
      const topRole = sorted[0];
      setRole(topRole.role as Role);
      setBaseMosqueId(topRole.mosque_id);

      if (topRole.mosque_id) {
        const { data: m } = await supabase.from("mosques").select("*").eq("id", topRole.mosque_id).single();
        if (m) setBaseMosque(m as unknown as MosqueInfo);
      }
    }

    // Check must_change_password
    const { data: profile } = await supabase.from("profiles").select("must_change_password").eq("id", uid).single();
    setMustChangePassword(profile?.must_change_password ?? false);
  };

  const reloadAuth = async () => {
    const { data: { session: s } } = await supabase.auth.getSession();
    if (s?.user) {
      setSession(s);
      setUser(s.user);
      await loadUserData(s.user.id);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setTimeout(() => loadUserData(s.user.id), 0);
      } else {
        setRole(null); setBaseMosqueId(null); setBaseMosque(null); setMustChangePassword(false);
        setManagingMosqueId(null); setManagingMosque(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) loadUserData(s.user.id).finally(() => setLoading(false));
      else setLoading(false);
    }).catch((err) => {
      console.error("Auth init error:", err);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => { await supabase.auth.signOut(); };

  const changePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (!error && user) {
      await supabase.from("profiles").update({ must_change_password: false }).eq("id", user.id);
      setMustChangePassword(false);
    }
    return { error: error?.message ?? null };
  };

  // Super Admin can access EVERYTHING when managing a mosque
  const canAccessFinance = () => role === "super_admin" || role === "gerente" || role === "supervisor";
  const canAccessStudents = () => role === "super_admin" || role === "gerente" || role === "profesorado";
  const canModifyData = () => role === "super_admin" || role === "gerente" || role === "profesorado";
  const isSuperAdminFn = () => role === "super_admin";

  const formatCurrency = (amount: number) => {
    const cur = effectiveMosque?.currency || "EUR";
    const cfg = CURRENCY_MAP[cur] || CURRENCY_MAP.EUR;
    return new Intl.NumberFormat(cfg.locale, { style: "currency", currency: cfg.code }).format(amount || 0);
  };

  return (
    <Ctx.Provider value={{
      user, session, role,
      mosqueId: effectiveMosqueId,
      mosque: effectiveMosque,
      mustChangePassword, loading,
      managingMosqueId, setManagingMosqueId,
      signIn, signOut, changePassword, reloadAuth,
      canAccessFinance, canAccessStudents, canModifyData,
      isSuperAdmin: isSuperAdminFn, formatCurrency,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
