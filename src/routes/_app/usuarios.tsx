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
  Users, UserPlus, Trash2, Copy, KeyRound, Shield, GraduationCap, Eye, UserCog, Loader2, Search
} from "lucide-react";

export const Route = createFileRoute("/_app/usuarios")({ component: UsuariosPage });

const ROLES = [
  { value: "gerente", icon: <UserCog className="h-3.5 w-3.5" /> },
  { value: "profesorado", icon: <GraduationCap className="h-3.5 w-3.5" /> },
  { value: "supervisor", icon: <Eye className="h-3.5 w-3.5" /> },
];

function UsuariosPage() {
  const { role, mosqueId, session } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"todos" | "gerente" | "profesorado" | "supervisor">("todos");

  if (role !== "gerente" && role !== "super_admin" && role !== "supervisor") return <Navigate to="/dashboard" />;

  const isReadOnly = role === "supervisor";

  const { data: users, isLoading } = useQuery({
    queryKey: ["users", mosqueId],
    queryFn: async () => {
      if (!mosqueId) return [];
      
      const { data: rolesData, error } = await supabase
        .from("user_roles")
        .select("id, user_id, role")
        .eq("mosque_id", mosqueId);
        
      if (error || !rolesData || rolesData.length === 0) return [];

      const userIds = rolesData.map(r => r.user_id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const profilesMap = new Map();
      if (profilesData) {
        profilesData.forEach(p => profilesMap.set(p.id, p));
      }

      let combined = rolesData.map(r => ({
        ...r,
        profiles: profilesMap.get(r.user_id) || null
      }));

      // Role visibility rules:
      // Gerente shouldn't see Super Admins ("ve debajo de él no por encima")
      if (role !== "super_admin") {
        combined = combined.filter(u => u.role !== "super_admin");
      }

      return combined;
    },
    enabled: !!mosqueId,
  });

  const [showCreate, setShowCreate] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("profesorado");
  const [createdPwd, setCreatedPwd] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const createUser = async () => {
    if (!mosqueId || !session?.access_token) return;
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
      qc.invalidateQueries({ queryKey: ["users", mosqueId] });
      toast.success("✓ Usuario creado");
    } catch (e: any) { toast.error(e.message); }
    setCreating(false);
  };

  const deleteRole = useMutation({
    mutationFn: async (roleId: string) => { await supabase.from("user_roles").delete().eq("id", roleId); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users", mosqueId] }); toast.success("✓"); },
  });

  const roleBadgeClass = (r: string) =>
    r === "gerente" ? "badge-admin" : r === "profesorado" ? "badge-teacher" : "badge-supervisor";

  const filteredUsers = (users ?? []).filter(u => {
    if (filter !== "todos" && u.role !== filter) return false;
    if (search) {
      const name = (u.profiles?.full_name || "").toLowerCase();
      const s = search.toLowerCase();
      if (!name.includes(s) && !u.user_id.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-slide-up">
        <h1 className="text-2xl md:text-3xl font-display font-bold flex items-center gap-2.5">
          <Users className="h-7 w-7 text-primary" /> {t("users") as string}
        </h1>
        {!isReadOnly && (
          <Button size="sm" className="gap-1 text-xs" onClick={() => { setShowCreate(true); setCreatedPwd(null); setNewEmail(""); setNewName(""); }}>
            <UserPlus className="h-3.5 w-3.5" /> {t("create_user") as string}
          </Button>
        )}
      </div>

      {isReadOnly && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700 w-fit">
          👁️ Modo Solo Lectura
        </div>
      )}

      {/* Filtros y Buscador */}
      <div className="space-y-3 animate-slide-up">
        <div className="flex flex-wrap gap-2">
          {(["todos", "gerente", "profesorado", "supervisor"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all ${
                filter === f
                  ? "border-primary bg-primary/10 text-primary shadow-sm"
                  : "border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              {f === "todos" ? t("all") as string || "Todos" : t(f as any) as string}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t("search") as string || "Buscar..."}
            className="w-full ps-10 pe-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center"><div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></div>
      ) : (
        <div className="space-y-2 animate-slide-up">
          {filteredUsers.map((ur: any) => (
            <Card key={ur.id} className="p-4 card-hover flex items-center gap-3">
              <div className="avatar-initials text-xs flex-shrink-0">
                {(ur.profiles?.full_name || "?").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{ur.profiles?.full_name || ur.user_id.slice(0, 8)}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${roleBadgeClass(ur.role)}`}>{t(ur.role) as string}</span>
              </div>
              {!isReadOnly && (
                (() => {
                  const rolePriority: Record<string, number> = {
                    super_admin: 4,
                    gerente: 3,
                    profesorado: 2,
                    supervisor: 1,
                  };
                  const myPriority = rolePriority[role || ""] || 0;
                  const targetPriority = rolePriority[ur.role] || 0;
                  const canDelete = myPriority > targetPriority;

                  if (!canDelete) return null;

                  return (
                    <Button size="sm" variant="ghost" className="text-destructive h-8 w-8 p-0"
                      onClick={() => { if (confirm(t("confirm_delete") as string)) deleteRole.mutate(ur.id); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  );
                })()
              )}
            </Card>
          ))}
          {(users ?? []).length === 0 && <p className="text-center py-8 text-muted-foreground">{t("nothing_yet") as string}</p>}
        </div>
      )}

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
                <div><label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">{t("email") as string}</label>
                  <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" /></div>
                <div><label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">{t("full_name") as string}</label>
                  <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" /></div>
                <div>
                  <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">{t("role") as string}</label>
                  <div className="flex gap-2">
                    {ROLES.map(r => (
                      <button key={r.value} onClick={() => setNewRole(r.value)}
                        className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-medium border transition-all ${
                          newRole === r.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                        }`}>
                        {r.icon} {t(r.value as any) as string}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 text-xs" onClick={() => setShowCreate(false)}>{t("cancel") as string}</Button>
                  <Button className="flex-1 text-xs gap-1" disabled={creating || !newEmail} onClick={createUser}>
                    {creating && <Loader2 className="h-3.5 w-3.5 animate-spin" />} {t("create_user") as string}
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
