import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Search, CheckCircle2, XCircle, Clock, Phone, Mail,
  ChevronRight, Building2, MapPin, Eye, Users as UsersIcon, Map as MapIcon, List
} from "lucide-react";
import { MosqueIcon } from "@/components/ui/mosque-icon";
import { useState, lazy, Suspense } from "react";

const MosqueMap = lazy(() => import("@/components/MosqueMap"));

export const Route = createFileRoute("/_app/mezquitas")({ component: MosquesPage });

function MosquesPage() {
  const { role, setManagingMosqueId } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "active" | "suspended">("all");
  const [view, setView] = useState<"list" | "map">("list");
  const navigate = useNavigate();

  if (role !== "super_admin") return <Navigate to="/dashboard" />;

  const { data: mosques, isLoading } = useQuery({
    queryKey: ["all-mosques"],
    queryFn: async () => {
      const { data } = await supabase.from("mosques").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("mosques").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["all-mosques"] }); toast.success("✓"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleManage = (mosqueId: string) => {
    setManagingMosqueId(mosqueId);
    navigate({ to: "/dashboard" });
  };

  const filtered = (mosques ?? []).filter(m => {
    if (filter !== "all" && m.status !== filter) return false;
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const statusIcon = (s: string) => {
    if (s === "active") return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    if (s === "pending") return <Clock className="h-4 w-4 text-amber-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const statusBadge = (s: string) => {
    const cls = s === "active" ? "bg-emerald-100 text-emerald-700" : s === "pending" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";
    const label = s === "active" ? t("active") : s === "pending" ? t("pending") : t("suspended");
    return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${cls}`}>{statusIcon(s)} {label as string}</span>;
  };

  const counts = {
    all: (mosques ?? []).length,
    pending: (mosques ?? []).filter(m => m.status === "pending").length,
    active: (mosques ?? []).filter(m => m.status === "active").length,
    suspended: (mosques ?? []).filter(m => m.status === "suspended").length,
  };

  return (
    <div className="space-y-5">
      <div className="animate-slide-up flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-display font-bold flex items-center gap-2.5">
          <MosqueIcon className="h-7 w-7 text-primary" />
          {t("mosques") as string}
        </h1>
        <div className="flex bg-muted/50 p-1 rounded-xl">
          <button onClick={() => setView("list")} className={`p-2 rounded-lg transition-all ${view === "list" ? "bg-background shadow-sm" : "text-muted-foreground hover:bg-background/50"}`}>
            <List className="h-4 w-4" />
          </button>
          <button onClick={() => setView("map")} className={`p-2 rounded-lg transition-all ${view === "map" ? "bg-background shadow-sm" : "text-muted-foreground hover:bg-background/50"}`}>
            <MapIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-slide-up">
        {(["all", "pending", "active", "suspended"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`p-3 rounded-xl border text-start transition-all ${filter === f ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/30"}`}>
            <p className="text-xl font-bold">{counts[f]}</p>
            <p className="text-[11px] text-muted-foreground capitalize">{f === "all" ? t("all_mosques") as string : t(f as any) as string}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative animate-slide-up">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder={t("search") as string}
          className="w-full ps-10 pe-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20" />
      </div>

      {/* Mosque list or Map */}
      {isLoading ? (
        <div className="py-12 text-center"><div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></div>
      ) : view === "map" ? (
        <Suspense fallback={<div className="h-[500px] flex items-center justify-center border rounded-xl"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
          <MosqueMap mosques={filtered} onManage={handleManage} />
        </Suspense>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-slide-up">
          {filtered.map(m => (
            <Card key={m.id} className="p-4 card-hover">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{m.name}</h3>
                  {m.address && <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" /> {m.address}</p>}
                </div>
                {statusBadge(m.status)}
              </div>

              <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground mb-3">
                {m.contact_phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {m.contact_phone}</span>}
                {m.contact_email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {m.contact_email}</span>}
                <span className="inline-flex items-center gap-1 font-medium text-foreground">{m.currency}</span>
              </div>

              <div className="flex gap-2 pt-2 border-t border-border/50">
                {m.status === "pending" && (
                  <Button size="sm" variant="default" className="flex-1 text-xs gap-1"
                    onClick={() => updateStatus.mutate({ id: m.id, status: "active" })}>
                    <CheckCircle2 className="h-3 w-3" /> {t("verify_mosque") as string}
                  </Button>
                )}
                {m.status === "active" && (
                  <Button size="sm" variant="outline" className="text-xs gap-1"
                    onClick={() => updateStatus.mutate({ id: m.id, status: "suspended" })}>
                    <XCircle className="h-3 w-3" /> {t("suspend_mosque") as string}
                  </Button>
                )}
                {m.status === "suspended" && (
                  <Button size="sm" variant="outline" className="text-xs gap-1"
                    onClick={() => updateStatus.mutate({ id: m.id, status: "active" })}>
                    <CheckCircle2 className="h-3 w-3" /> {t("verify_mosque") as string}
                  </Button>
                )}
                <Button size="sm" variant="outline" className="text-xs gap-1"
                  onClick={() => handleManage(m.id)}>
                  <Eye className="h-3 w-3" /> {t("manage") as string}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
