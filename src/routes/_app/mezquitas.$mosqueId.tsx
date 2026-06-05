import { useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { createUserOnServer } from "@/lib/create-user.api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Building2, Phone, Mail, MapPin, Banknote, Shield,
  UserPlus, Copy, GraduationCap, Eye, UserCog, KeyRound, Loader2, Trash2,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/mezquitas/$mosqueId")({ component: MosqueDetailPage });

const ROLES = [
  { value: "gerente", icon: <UserCog className="h-3.5 w-3.5" /> },
  { value: "profesorado", icon: <GraduationCap className="h-3.5 w-3.5" /> },
  { value: "supervisor", icon: <Eye className="h-3.5 w-3.5" /> },
];

function MosqueDetailPage() {
  const { mosqueId } = Route.useParams();
  const { role, session } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();

  const isSA = role === "super_admin";
  const isGerente = role === "gerente";
  if (!isSA && !isGerente) return <Navigate to="/dashboard" />;

  const { data: mosque } = useQuery({
    queryKey: ["mosque", mosqueId],
    queryFn: async () => {
      const { data } = await supabase.from("mosques").select("*").eq("id", mosqueId).single();
      return data;
    },
  });

  const { data: users } = useQuery({
    queryKey: ["mosque-users", mosqueId],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("id, user_id, role, profiles(full_name)").eq("mosque_id", mosqueId);
      return roles ?? [];
    },
  });

  // Create user dialog
  const [showCreate, setShowCreate] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("gerente");
  const [createdPwd, setCreatedPwd] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const createUser = async () => {
    if (!session?.access_token) return;
    setCreating(true);
    try {
      const result = await createUserOnServer({
        data: {
          email: newEmail,
          full_name: newName,
          role: newRole,
          mosque_id: mosqueId,
          caller_token: session.access_token,
        },
      });
      setCreatedPwd(result.password);
      qc.invalidateQueries({ queryKey: ["mosque-users", mosqueId] });
      toast.success("✓ Usuario creado");
    } catch (e: any) {
      toast.error(e.message);
    }
    setCreating(false);
  };

  const deleteUserRole = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase.from("user_roles").delete().eq("id", roleId);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mosque-users", mosqueId] }); toast.success("✓"); },
  });

  if (!mosque) return <div className="py-12 text-center"><div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {isSA && (
        <Link to="/mezquitas" className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> {t("back") as string}
        </Link>
      )}

      {/* Mosque header */}
      <Card className="p-5 animate-slide-up">
        <h2 className="text-xl font-display font-bold flex items-center gap-2 mb-3">
          <Building2 className="h-6 w-6 text-primary" /> {mosque.name}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
          {mosque.address && <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {mosque.address}</p>}
          {mosque.contact_phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> {mosque.contact_phone}</p>}
          {mosque.contact_email && <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> {mosque.contact_email}</p>}
          {mosque.bank_account && <p className="flex items-center gap-2"><Banknote className="h-4 w-4" /> {mosque.bank_account}</p>}
          <p className="flex items-center gap-2 font-medium text-foreground">
            💰 {mosque.currency} · {t("initial_budget") as string}: {Number(mosque.initial_budget).toLocaleString()}
          </p>
          <p className="flex items-center gap-2">
            📚 {mosque.classes_paid ? t("classes_paid") as string : t("classes_free") as string}
          </p>
        </div>
      </Card>

      {/* Users section */}
      <Card className="p-5 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-display font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" /> {t("users") as string}
          </h3>
          <Button size="sm" className="text-xs gap-1" onClick={() => { setShowCreate(true); setCreatedPwd(null); setNewEmail(""); setNewName(""); }}>
            <UserPlus className="h-3.5 w-3.5" /> {t("create_user") as string}
          </Button>
        </div>

        {/* User list */}
        <div className="space-y-2">
          {(users ?? []).map((ur: any) => (
            <div key={ur.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
              <div className="flex items-center gap-2.5">
                <div className="avatar-initials text-xs">
                  {(ur.profiles?.full_name || "?").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-medium">{ur.profiles?.full_name || ur.user_id.slice(0, 8)}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    ur.role === "gerente" ? "badge-admin" : ur.role === "profesorado" ? "badge-teacher" : "badge-supervisor"
                  }`}>{t(ur.role) as string}</span>
                </div>
              </div>
              <Button size="sm" variant="ghost" className="text-destructive h-8 w-8 p-0"
                onClick={() => { if (confirm(t("confirm_delete") as string)) deleteUserRole.mutate(ur.id); }}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          {(users ?? []).length === 0 && <p className="text-sm text-muted-foreground text-center py-4">{t("nothing_yet") as string}</p>}
        </div>
      </Card>

      {/* Dynamic Config section */}
      <Card className="p-5 animate-slide-up">
        <h3 className="text-lg font-display font-semibold flex items-center gap-2 mb-4">
          <Banknote className="h-5 w-5 text-primary" /> Configuración de Gastos/Ingresos Fijos
        </h3>
        <MosqueConfigManager mosqueId={mosqueId} />
      </Card>

      {/* Create user dialog */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <Card className="w-full max-w-sm p-5 animate-scale-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" /> {t("create_user") as string}
            </h3>

            {createdPwd ? (
              <div className="space-y-3">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">{t("generated_password") as string}</p>
                  <div className="flex items-center gap-2">
                    <code className="text-lg font-mono font-bold text-emerald-700 flex-1">{createdPwd}</code>
                    <button onClick={() => { navigator.clipboard.writeText(createdPwd); toast.success("Copiado!"); }}
                      className="p-2 rounded-lg hover:bg-emerald-100"><Copy className="h-4 w-4" /></button>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                    <KeyRound className="h-3 w-3" /> {t("must_change_pwd") as string}
                  </p>
                </div>
                <Button className="w-full text-xs" onClick={() => setShowCreate(false)}>{t("save") as string}</Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">{t("email") as string}</label>
                  <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" />
                </div>
                <div>
                  <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">{t("full_name") as string}</label>
                  <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" />
                </div>
                <div>
                  <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">{t("role") as string}</label>
                  <div className="flex gap-2">
                    {ROLES.map(r => (
                      <button key={r.value} onClick={() => setNewRole(r.value)}
                        className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-medium border transition-all ${
                          newRole === r.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                        }`}>
                        {r.icon} {t(r.value as any) as string}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 text-xs" onClick={() => setShowCreate(false)}>{t("cancel") as string}</Button>
                  <Button className="flex-1 text-xs gap-1" disabled={creating || !newEmail} onClick={createUser}>
                    {creating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {t("create_user") as string}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

function MosqueConfigManager({ mosqueId }: { mosqueId: string }) {
  const qc = useQueryClient();
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<"rent" | "water" | "electricity" | "income">("electricity");

  const { data: configs } = useQuery({
    queryKey: ["mosque-config", mosqueId],
    queryFn: async () => {
      const { data } = await supabase.from("mosque_fixed_config").select("*").eq("mosque_id", mosqueId).order("sort_order");
      return data ?? [];
    },
  });

  const addConfig = useMutation({
    mutationFn: async () => {
      await supabase.from("mosque_fixed_config").insert({ mosque_id: mosqueId, config_type: newType, label: newLabel, sort_order: (configs?.length || 0) + 1 });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mosque-config"] }); setNewLabel(""); toast.success("Añadido"); },
  });

  const deleteConfig = useMutation({
    mutationFn: async (id: string) => { await supabase.from("mosque_fixed_config").delete().eq("id", id); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mosque-config"] }); toast.success("Eliminado"); },
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <select value={newType} onChange={e => setNewType(e.target.value as any)}
          className="px-3 py-2 rounded-xl border border-border bg-background text-sm">
          <option value="electricity">Electricidad</option>
          <option value="water">Agua</option>
          <option value="rent">Alquiler</option>
          <option value="income">Ingreso Fijo</option>
        </select>
        <input placeholder="Ej. Luz Planta Baja" value={newLabel} onChange={e => setNewLabel(e.target.value)}
          className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-sm" />
        <Button size="sm" className="text-xs" disabled={!newLabel} onClick={() => addConfig.mutate()}>Añadir</Button>
      </div>

      <div className="space-y-2 mt-4">
        {(configs ?? []).map(c => (
          <div key={c.id} className="flex items-center justify-between p-2.5 bg-muted/30 rounded-xl">
            <div>
              <span className="text-xs font-medium bg-background px-2 py-0.5 rounded border mr-2 uppercase tracking-wide text-muted-foreground">{c.config_type}</span>
              <span className="text-sm">{c.label}</span>
            </div>
            <button onClick={() => deleteConfig.mutate(c.id)} className="text-destructive/50 hover:text-destructive p-1">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
