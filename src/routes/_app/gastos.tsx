import { useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Receipt, Plus, Trash2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_app/gastos")({ component: GastosPage });

function GastosPage() {
  const { mosqueId, canAccessFinance, canModifyData, formatCurrency } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [concept, setConcept] = useState("");
  const [amount, setAmount] = useState("");
  const months = t("months_full") as readonly string[];

  if (!canAccessFinance()) return <Navigate to="/dashboard" />;

  const { data: variable } = useQuery({
    queryKey: ["variable-expenses", mosqueId, year, month],
    queryFn: async () => {
      const { data } = await supabase.from("variable_expenses").select("*").eq("mosque_id", mosqueId!).eq("year", year).eq("month", month).order("entry_date", { ascending: false });
      return data ?? [];
    },
    enabled: !!mosqueId,
  });

  const addVariable = useMutation({
    mutationFn: async () => {
      await supabase.from("variable_expenses").insert({ mosque_id: mosqueId!, year, month, concept, amount: Number(amount) });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["variable-expenses"] }); setConcept(""); setAmount(""); toast.success("✓"); },
  });

  const deleteVariable = useMutation({
    mutationFn: async (id: string) => { await supabase.from("variable_expenses").delete().eq("id", id); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["variable-expenses"] }); toast.success("✓"); },
  });

  const readOnly = !canModifyData();
  const prev = () => { if (month === 1) { setYear(y => y - 1); setMonth(12); } else setMonth(m => m - 1); };
  const next = () => { if (month === 12) { setYear(y => y + 1); setMonth(1); } else setMonth(m => m + 1); };
  const variableTotal = (variable ?? []).reduce((s, v) => s + Number(v.amount), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-slide-up">
        <h1 className="text-2xl md:text-3xl font-display font-bold flex items-center gap-2.5">
          <Receipt className="h-7 w-7 text-primary" /> {t("expenses") as string}
        </h1>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={prev}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm font-medium min-w-[120px] text-center">{months[month - 1]} {year}</span>
          <Button size="sm" variant="outline" onClick={next}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      {readOnly && <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700">👁️ {t("read_only") as string}</div>}

      {/* Summary */}
      <div className="grid grid-cols-1 gap-3 animate-slide-up">
        <Card className="p-4 text-center border-primary/20 bg-primary/5">
          <p className="text-xs text-primary font-medium mb-1">Total Gastos</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(variableTotal)}</p>
        </Card>
      </div>

      {/* Expenses */}
      <Card className="p-4 animate-slide-up">
        <h3 className="text-sm font-semibold mb-3">Registrar Gasto</h3>
        {!readOnly && (
          <div className="flex gap-2 mb-4">
            <input placeholder={t("concept") as string} value={concept} onChange={e => setConcept(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-sm" />
            <input type="number" placeholder={t("amount") as string} value={amount} onChange={e => setAmount(e.target.value)}
              className="w-28 px-3 py-2 rounded-xl border border-border bg-background text-sm" />
            <Button size="sm" className="text-xs px-4" disabled={!concept || !amount || addVariable.isPending} onClick={() => addVariable.mutate()}>
              {addVariable.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
        )}
        <div className="space-y-2">
          {(variable ?? []).map(v => (
            <div key={v.id} className="flex items-center justify-between p-3 bg-muted/20 hover:bg-muted/40 transition-colors rounded-xl border border-transparent hover:border-border">
              <div>
                <p className="text-sm font-medium">{v.concept}</p>
                <p className="text-[10px] text-muted-foreground">{new Date(v.entry_date).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-base font-bold text-red-600">-{formatCurrency(Number(v.amount))}</span>
                {!readOnly && (
                  <Button size="sm" variant="ghost" onClick={() => { if (confirm("¿Borrar?")) deleteVariable.mutate(v.id); }} className="text-destructive/50 hover:text-destructive h-8 w-8 p-0">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          {(variable ?? []).length === 0 && <p className="text-center text-sm text-muted-foreground py-6">No hay gastos registrados este mes.</p>}
        </div>
      </Card>
    </div>
  );
}
