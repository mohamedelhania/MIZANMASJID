import { useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_app/ingresos")({ component: IngresosPage });

function IngresosPage() {
  const { mosqueId, canAccessFinance, canModifyData, formatCurrency } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const months = t("months_full") as readonly string[];

  if (!canAccessFinance()) return <Navigate to="/dashboard" />;

  const { data: jumuah } = useQuery({
    queryKey: ["jumuah-incomes", mosqueId, year, month],
    queryFn: async () => {
      const { data } = await supabase.from("jumuah_collections").select("*").eq("mosque_id", mosqueId!).eq("year", year).eq("month", month);
      return data ?? [];
    },
    enabled: !!mosqueId,
  });

  const upsertJumuah = useMutation({
    mutationFn: async ({ friday_number, amount: amt }: { friday_number: number; amount: number }) => {
      await supabase.from("jumuah_collections").upsert({ mosque_id: mosqueId!, year, month, friday_number, amount: amt }, { onConflict: "mosque_id,year,month,friday_number" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jumuah-incomes"] }),
  });

  const readOnly = !canModifyData();
  const prev = () => { if (month === 1) { setYear(y => y - 1); setMonth(12); } else setMonth(m => m - 1); };
  const next = () => { if (month === 12) { setYear(y => y + 1); setMonth(1); } else setMonth(m => m + 1); };
  const jumuahTotal = (jumuah ?? []).reduce((s, j) => s + Number(j.amount), 0);

  const [newIncomeConcept, setNewIncomeConcept] = useState("");
  const [newIncomeAmount, setNewIncomeAmount] = useState("");

  const { data: variableIncomes } = useQuery({
    queryKey: ["variable-incomes", mosqueId, year, month],
    queryFn: async () => {
      const { data } = await supabase.from("variable_incomes").select("*").eq("mosque_id", mosqueId!).eq("year", year).eq("month", month).order("entry_date", { ascending: false });
      return data ?? [];
    },
    enabled: !!mosqueId,
  });

  const addVariableIncome = useMutation({
    mutationFn: async () => {
      await supabase.from("variable_incomes").insert({
        mosque_id: mosqueId!,
        year,
        month,
        concept: newIncomeConcept,
        amount: Number(newIncomeAmount)
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["variable-incomes"] });
      setNewIncomeConcept("");
      setNewIncomeAmount("");
    }
  });

  const deleteVariableIncome = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("variable_incomes").delete().eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["variable-incomes"] })
  });

  const variableIncomesTotal = (variableIncomes ?? []).reduce((s, i) => s + Number(i.amount), 0);
  const totalIncomes = jumuahTotal + variableIncomesTotal;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-slide-up">
        <h1 className="text-2xl md:text-3xl font-display font-bold flex items-center gap-2.5">
          <Wallet className="h-7 w-7 text-primary" /> {t("incomes") as string}
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
        <Card className="p-4 text-center border-emerald-200 bg-emerald-50">
          <p className="text-xs text-emerald-700 font-medium mb-1">Total {t("incomes") as string}</p>
          <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalIncomes)}</p>
          {variableIncomesTotal > 0 && (
            <p className="text-[10px] text-emerald-600 mt-1">Jumuah: {formatCurrency(jumuahTotal)} | Otros: {formatCurrency(variableIncomesTotal)}</p>
          )}
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-5 animate-slide-up">
        {/* Jumuah Collections */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">{t("jumuah_collections") as string}</h3>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(fn => {
              const val = (jumuah ?? []).find(j => j.friday_number === fn);
              return (
                <div key={fn} className="flex items-center gap-2 p-2.5 bg-muted/30 rounded-xl">
                  <div className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">{fn}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-muted-foreground">Jumuah {fn}</p>
                    <input type="number" disabled={readOnly} value={val?.amount ?? ""} placeholder="0"
                      onChange={e => upsertJumuah.mutate({ friday_number: fn, amount: Number(e.target.value) })}
                      className="w-full text-sm font-medium bg-transparent border-none p-0 focus:ring-0 disabled:text-foreground" />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Otros Ingresos */}
        <Card className="p-4 flex flex-col">
          <h3 className="text-sm font-semibold mb-3">Otros Ingresos (Registros Varios)</h3>
          
          {!readOnly && (
            <div className="flex gap-2 mb-3 items-center">
              <input type="text" placeholder="Concepto (Ej. Donación)" value={newIncomeConcept} onChange={e => setNewIncomeConcept(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl border border-border bg-background text-sm min-w-0" />
              <input type="number" placeholder="Importe" value={newIncomeAmount} onChange={e => setNewIncomeAmount(e.target.value)}
                className="w-24 px-3 py-1.5 rounded-xl border border-border bg-background text-sm" />
              <Button size="sm" className="h-8" disabled={!newIncomeConcept || !newIncomeAmount} onClick={() => addVariableIncome.mutate()}>
                Añadir
              </Button>
            </div>
          )}

          <div className="flex-1 space-y-2 overflow-y-auto max-h-[300px]">
            {(variableIncomes ?? []).map(vi => (
              <div key={vi.id} className="flex items-center justify-between p-2.5 bg-muted/30 rounded-xl">
                <div>
                  <p className="text-sm font-medium">{vi.concept}</p>
                  <p className="text-[10px] text-muted-foreground">{vi.entry_date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-emerald-600">{formatCurrency(vi.amount)}</span>
                  {!readOnly && (
                    <button onClick={() => deleteVariableIncome.mutate(vi.id)} className="text-destructive hover:bg-destructive/10 p-1 rounded">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
            {(variableIncomes ?? []).length === 0 && (
              <p className="text-center text-xs text-muted-foreground py-4">No hay otros ingresos este mes.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
