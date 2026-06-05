import { useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Moon, Plus, Trash2, ChevronLeft, ChevronRight, Heart, Coins, ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/_app/ramadan")({ component: RamadanPage });

const KIND_ICONS: Record<string, React.ReactNode> = {
  donation: <Heart className="h-4 w-4 text-pink-500" />,
  collection: <Coins className="h-4 w-4 text-amber-500" />,
  expense: <ShoppingBag className="h-4 w-4 text-red-500" />,
};

function RamadanPage() {
  const { mosqueId, canAccessFinance, canModifyData, formatCurrency } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [year, setYear] = useState(new Date().getFullYear());
  const [concept, setConcept] = useState("");
  const [amount, setAmount] = useState("");
  const [kind, setKind] = useState<"donation" | "collection" | "expense">("donation");

  if (!canAccessFinance()) return <Navigate to="/dashboard" />;

  const { data: entries } = useQuery({
    queryKey: ["ramadan", mosqueId, year],
    queryFn: async () => {
      const { data } = await supabase.from("ramadan_entries").select("*").eq("mosque_id", mosqueId!).eq("year", year).order("entry_date", { ascending: false });
      return data ?? [];
    },
    enabled: !!mosqueId,
  });

  const addEntry = useMutation({
    mutationFn: async () => {
      await supabase.from("ramadan_entries").insert({ mosque_id: mosqueId!, year, kind, concept, amount: Number(amount) });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ramadan"] }); setConcept(""); setAmount(""); toast.success("✓"); },
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => { await supabase.from("ramadan_entries").delete().eq("id", id); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ramadan"] }); toast.success("✓"); },
  });

  const readOnly = !canModifyData();
  const donations = (entries ?? []).filter(e => e.kind === "donation").reduce((s, e) => s + Number(e.amount), 0);
  const collections = (entries ?? []).filter(e => e.kind === "collection").reduce((s, e) => s + Number(e.amount), 0);
  const expenses = (entries ?? []).filter(e => e.kind === "expense").reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-slide-up">
        <h1 className="text-2xl md:text-3xl font-display font-bold flex items-center gap-2.5">
          <Moon className="h-7 w-7 text-primary" /> {t("ramadan") as string}
        </h1>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setYear(y => y - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm font-medium">{year}</span>
          <Button size="sm" variant="outline" onClick={() => setYear(y => y + 1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      {readOnly && <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700">👁️ {t("read_only") as string}</div>}

      <div className="grid grid-cols-3 gap-3 animate-slide-up">
        <Card className="p-3 text-center border-l-4 border-l-pink-500"><p className="text-[10px] text-muted-foreground">{t("ramadan_donations") as string}</p><p className="text-lg font-bold text-pink-600">{formatCurrency(donations)}</p></Card>
        <Card className="p-3 text-center border-l-4 border-l-amber-500"><p className="text-[10px] text-muted-foreground">{t("ramadan_collections") as string}</p><p className="text-lg font-bold text-amber-600">{formatCurrency(collections)}</p></Card>
        <Card className="p-3 text-center border-l-4 border-l-red-500"><p className="text-[10px] text-muted-foreground">{t("ramadan_expenses") as string}</p><p className="text-lg font-bold text-red-600">{formatCurrency(expenses)}</p></Card>
      </div>

      {/* Add entry form */}
      {!readOnly && (
        <Card className="p-4 animate-slide-up">
          <div className="flex flex-wrap gap-2 mb-3">
            {(["donation", "collection", "expense"] as const).map(k => (
              <button key={k} onClick={() => setKind(k)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${kind === k ? "bg-primary/10 text-primary border border-primary" : "bg-muted/50 border border-transparent"}`}>
                {KIND_ICONS[k]} {t(k) as string}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input placeholder={t("concept") as string} value={concept} onChange={e => setConcept(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-sm" />
            <input type="number" placeholder={t("amount") as string} value={amount} onChange={e => setAmount(e.target.value)}
              className="w-28 px-3 py-2 rounded-xl border border-border bg-background text-sm" />
            <Button size="sm" className="text-xs" disabled={!concept || !amount} onClick={() => addEntry.mutate()}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </Card>
      )}

      {/* Entries list */}
      <Card className="p-4 animate-slide-up">
        <div className="space-y-1">
          {(entries ?? []).map(e => (
            <div key={e.id} className="flex items-center justify-between p-2.5 bg-muted/20 rounded-xl">
              <div className="flex items-center gap-2.5">
                {KIND_ICONS[e.kind]}
                <div><p className="text-sm font-medium">{e.concept}</p><p className="text-[10px] text-muted-foreground">{e.entry_date}</p></div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${e.kind === "expense" ? "text-red-600" : "text-emerald-600"}`}>
                  {e.kind === "expense" ? "-" : "+"}{formatCurrency(Number(e.amount))}
                </span>
                {!readOnly && <button onClick={() => deleteEntry.mutate(e.id)} className="text-destructive/50 hover:text-destructive"><Trash2 className="h-3 w-3" /></button>}
              </div>
            </div>
          ))}
          {(entries ?? []).length === 0 && <p className="text-center py-6 text-muted-foreground text-sm">{t("nothing_yet") as string}</p>}
        </div>
      </Card>
    </div>
  );
}
