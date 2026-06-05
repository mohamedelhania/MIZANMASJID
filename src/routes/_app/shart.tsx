import { useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HandCoins, Plus, Trash2, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_app/shart")({ component: ShartPage });

function ShartPage() {
  const { mosqueId, canAccessFinance, canModifyData, formatCurrency } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [year, setYear] = useState(new Date().getFullYear());
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("10");

  if (!canAccessFinance()) return <Navigate to="/dashboard" />;

  const { data: contributors, isLoading } = useQuery({
    queryKey: ["shart", mosqueId, year],
    queryFn: async () => {
      if (!mosqueId) return [];
      const { data } = await supabase.from("shart_contributors").select("*, shart_payments(*)").eq("mosque_id", mosqueId).eq("year", year).order("name");
      return data ?? [];
    },
    enabled: !!mosqueId,
  });

  const addContributor = useMutation({
    mutationFn: async () => {
      const { data: c, error } = await supabase.from("shart_contributors").insert({ name: newName, year, monthly_amount: Number(newAmount), mosque_id: mosqueId! }).select().single();
      if (error) throw error;
      // Create payment rows for all 12 months
      const payments = Array.from({ length: 12 }, (_, i) => ({ contributor_id: c.id, month: i + 1, paid: false }));
      await supabase.from("shart_payments").insert(payments);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["shart"] }); setNewName(""); setShowForm(false); toast.success("✓"); },
  });

  const togglePayment = useMutation({
    mutationFn: async ({ id, paid }: { id: string; paid: boolean }) => {
      await supabase.from("shart_payments").update({ paid }).eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shart"] }),
  });

  const deleteContributor = useMutation({
    mutationFn: async (id: string) => { await supabase.from("shart_contributors").delete().eq("id", id); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["shart"] }); toast.success("✓"); },
  });

  const readOnly = !canModifyData();
  const monthsShort = t("months") as readonly string[];
  const totalYear = (contributors ?? []).reduce((s, c: any) => {
    const paid = (c.shart_payments ?? []).filter((p: any) => p.paid).length;
    return s + paid * Number(c.monthly_amount);
  }, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-slide-up">
        <h1 className="text-2xl md:text-3xl font-display font-bold flex items-center gap-2.5">
          <HandCoins className="h-7 w-7 text-primary" /> {t("shart") as string}
        </h1>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setYear(y => y - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm font-medium">{year}</span>
          <Button size="sm" variant="outline" onClick={() => setYear(y => y + 1)}><ChevronRight className="h-4 w-4" /></Button>
          {!readOnly && (
            <Button size="sm" className="gap-1 text-xs" onClick={() => setShowForm(true)}>
              <Plus className="h-3.5 w-3.5" /> {t("add_contributor") as string}
            </Button>
          )}
        </div>
      </div>

      {readOnly && <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700">👁️ {t("read_only") as string}</div>}

      <Card className="p-3 text-center animate-slide-up">
        <p className="text-[11px] text-muted-foreground">{t("total") as string} {year}</p>
        <p className="text-2xl font-bold text-primary">{formatCurrency(totalYear)}</p>
      </Card>

      {showForm && (
        <Card className="p-4 animate-scale-in">
          <div className="flex gap-3">
            <input placeholder={t("name") as string} value={newName} onChange={e => setNewName(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-sm" />
            <input type="number" placeholder={t("amount") as string} value={newAmount} onChange={e => setNewAmount(e.target.value)}
              className="w-24 px-3 py-2 rounded-xl border border-border bg-background text-sm" />
            <Button size="sm" className="text-xs" disabled={!newName} onClick={() => addContributor.mutate()}>{t("save") as string}</Button>
          </div>
        </Card>
      )}

      {isLoading ? (
        <div className="py-12 text-center"><div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></div>
      ) : (
        <div className="overflow-x-auto animate-slide-up">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-start py-2 px-2 text-xs font-medium text-muted-foreground sticky start-0 bg-background">{t("contributor") as string}</th>
                {monthsShort.map((m, i) => <th key={i} className="py-2 px-1 text-xs font-medium text-muted-foreground text-center">{m}</th>)}
                {!readOnly && <th className="w-8"></th>}
              </tr>
            </thead>
            <tbody>
              {(contributors ?? []).map((c: any) => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="py-2 px-2 sticky start-0 bg-background">
                    <div className="flex items-center gap-2">
                      <div className="avatar-initials text-[10px] h-7 w-7">{c.name[0]?.toUpperCase()}</div>
                      <div>
                        <p className="font-medium text-xs truncate max-w-[120px]">{c.name}</p>
                        <p className="text-[10px] text-muted-foreground">{formatCurrency(Number(c.monthly_amount))}/m</p>
                      </div>
                    </div>
                  </td>
                  {Array.from({ length: 12 }, (_, i) => {
                    const payment = (c.shart_payments ?? []).find((p: any) => p.month === i + 1);
                    const isPaid = payment?.paid;
                    return (
                      <td key={i} className="py-1 px-1 text-center">
                        <button disabled={readOnly}
                          onClick={() => payment && togglePayment.mutate({ id: payment.id, paid: !isPaid })}
                          className={`w-7 h-7 rounded-lg text-[10px] font-medium transition-all ${
                            isPaid ? "bg-emerald-100 text-emerald-700" : "bg-red-50 text-red-400 hover:bg-red-100"
                          } ${readOnly ? "cursor-default" : "cursor-pointer"}`}>
                          {isPaid ? "✓" : "·"}
                        </button>
                      </td>
                    );
                  })}
                  {!readOnly && (
                    <td className="py-1">
                      <button onClick={() => { if (confirm(t("confirm_delete") as string)) deleteContributor.mutate(c.id); }}
                        className="p-1 text-destructive/50 hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {(contributors ?? []).length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">{t("no_contributors") as string}</p>}
        </div>
      )}
    </div>
  );
}
