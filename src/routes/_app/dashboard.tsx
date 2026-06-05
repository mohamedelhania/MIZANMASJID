import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useMonthlyTotals, useRollingBalance } from "@/lib/finance";
import { generateMonthlyReport } from "@/lib/pdf";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, TrendingUp, TrendingDown, Wallet, FileDown,
  ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight, AlertTriangle, ArrowRight
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export const Route = createFileRoute("/_app/dashboard")({ component: DashboardPage });

/** Compute the 6-month window ending at (year, month) */
function getMonthRange(year: number, month: number) {
  const result: { year: number; month: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    let m = month - i;
    let y = year;
    while (m <= 0) { m += 12; y -= 1; }
    result.push({ year: y, month: m });
  }
  return result;
}

function DashboardPage() {
  const { role, mosqueId, mosque, formatCurrency, isSuperAdmin, managingMosqueId } = useAuth();
  const { t } = useI18n();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const months = t("months_full") as readonly string[];
  const monthsShort = t("months") as readonly string[];

  const { data: totals, isLoading } = useMonthlyTotals(mosqueId, year, month);
  const { data: balance } = useRollingBalance(mosqueId, mosque?.initial_budget ?? 0, year, month);

  const currentBalance = (balance?.previousBalance ?? 0) + (totals?.net ?? 0);

  // Compute the 6-month range for the chart
  const monthRange = useMemo(() => getMonthRange(year, month), [year, month]);

  // Query real data for the 6-month chart
  const { data: chartData } = useQuery({
    queryKey: ["chart-6months", mosqueId, year, month],
    queryFn: async () => {
      if (!mosqueId) return [];

      const range = getMonthRange(year, month);
      const minYear = range[0].year;
      const maxYear = range[range.length - 1].year;

      // Fetch all data within the year range to cover the 6 months
      const [vxRes, juRes, spRes, shpRes] = await Promise.all([
        supabase.from("variable_expenses").select("year, month, amount").eq("mosque_id", mosqueId).gte("year", minYear).lte("year", maxYear),
        supabase.from("jumuah_collections").select("year, month, amount").eq("mosque_id", mosqueId).gte("year", minYear).lte("year", maxYear),
        supabase.from("student_payments").select("year, month, amount, paid, students!inner(mosque_id)").eq("students.mosque_id", mosqueId).eq("paid", true).gte("year", minYear).lte("year", maxYear),
        supabase.from("shart_payments").select("month, paid, shart_contributors!inner(year, monthly_amount, mosque_id)").eq("shart_contributors.mosque_id", mosqueId).eq("paid", true),
      ]);

      const vx = vxRes.data ?? [];
      const ju = juRes.data ?? [];
      const sp = spRes.data ?? [];
      const shp = shpRes.data ?? [];

      return range.map(({ year: y, month: m }) => {
        // Expenses
        const gastos = vx
          .filter(r => r.year === y && r.month === m)
          .reduce((s, r) => s + Number(r.amount ?? 0), 0);

        // Jumuah income
        const jumuah = ju
          .filter(r => r.year === y && r.month === m)
          .reduce((s, r) => s + Number(r.amount ?? 0), 0);

        // Student fees income
        const studentFees = sp
          .filter(r => r.year === y && r.month === m)
          .reduce((s, r) => s + Number(r.amount ?? 0), 0);

        // Shart income
        const shartTotal = shp
          .filter(r => {
            const c = r.shart_contributors as unknown as { year: number; monthly_amount: number };
            return c && c.year === y && r.month === m;
          })
          .reduce((s, r) => {
            const c = r.shart_contributors as unknown as { monthly_amount: number | string };
            return s + Number(c?.monthly_amount ?? 0);
          }, 0);

        const ingresos = jumuah + studentFees + shartTotal;

        return {
          name: monthsShort[m - 1],
          ingresos,
          gastos,
        };
      });
    },
    enabled: !!mosqueId,
  });

  const { data: unpaidStudents } = useQuery({
    queryKey: ["unpaid-students", mosqueId, year, month],
    queryFn: async () => {
      if (!mosqueId) return [];
      const { data: students } = await supabase.from("students").select("id, first_name, last_name, monthly_fee").eq("mosque_id", mosqueId);
      if (!students || students.length === 0) return [];
      const { data: payments } = await supabase.from("student_payments").select("student_id").eq("year", year).eq("month", month).eq("paid", true);
      const paidIds = new Set(payments?.map(p => p.student_id) || []);
      // Solo consideramos morosos a los alumnos que tienen una cuota mensual mayor a 0
      return students.filter(s => !paidIds.has(s.id) && (s.monthly_fee || 0) > 0);
    },
    enabled: !!mosqueId,
  });

  // Super admin redirect only if NOT managing a mosque
  if (isSuperAdmin() && !managingMosqueId) return <Navigate to="/mezquitas" />;
  if (!mosqueId || !mosque) return null;

  const prev = () => { if (month === 1) { setYear(y => y - 1); setMonth(12); } else setMonth(m => m - 1); };
  const next = () => { if (month === 12) { setYear(y => y + 1); setMonth(1); } else setMonth(m => m + 1); };

  const exportPDF = async () => {
    if (!totals || !balance || !mosque) return;

    // Fetch individual records to show detailed concepts in PDF
    const [vxRes, viRes] = await Promise.all([
      supabase.from("variable_expenses").select("concept, amount").eq("mosque_id", mosqueId).eq("year", year).eq("month", month),
      supabase.from("variable_incomes").select("concept, amount").eq("mosque_id", mosqueId).eq("year", year).eq("month", month)
    ]);

    const individualExpenses = (vxRes.data || []).map(x => ({ label: x.concept, amount: Number(x.amount) }));
    const individualIncomes = (viRes.data || []).map(x => ({ label: x.concept, amount: Number(x.amount) }));

    await generateMonthlyReport({
      mosque,
      monthLabel: months[month - 1],
      year,
      incomes: [
        { label: t("jumuah") as string, amount: totals.jumuah },
        { label: t("student_fees_total") as string, amount: totals.studentFees },
        { label: t("shart_total") as string, amount: totals.shartTotal },
        ...individualIncomes
      ].filter(i => i.amount > 0),
      expenses: individualExpenses.filter(e => e.amount > 0),
      totalIncomes: totals.totalIncomes,
      totalExpenses: totals.totalExpenses,
      monthlyNet: totals.net,
      previousBalance: balance.previousBalance,
      currentBalance,
    });
  };

  const isReadOnly = role === "supervisor";

  // Fallback empty chart data while loading
  const finalChartData = chartData ?? monthRange.map(({ month: m }) => ({
    name: monthsShort[m - 1],
    ingresos: 0,
    gastos: 0,
  }));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-slide-up">
        <div className="space-y-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold flex items-center gap-2.5">
              <LayoutDashboard className="h-7 w-7 text-primary" />
              {t("dashboard") as string}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">{mosque.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0 self-end sm:self-auto">
          <Button size="sm" variant="outline" onClick={prev}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm font-medium min-w-[120px] text-center">{months[month - 1]} {year}</span>
          <Button size="sm" variant="outline" onClick={next}><ChevronRight className="h-4 w-4" /></Button>
          <Button size="sm" variant="default" className="gap-1 text-xs" onClick={exportPDF}>
            <FileDown className="h-3.5 w-3.5" /> PDF
          </Button>
        </div>
      </div>

      {isReadOnly && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700 flex items-center gap-2">
          👁️ {t("read_only") as string}
        </div>
      )}

      {unpaidStudents && unpaidStudents.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in shadow-sm">
          <div className="flex items-start gap-3 text-red-800">
            <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-sm">Alerta de Morosidad</h3>
              <p className="text-xs opacity-90 mt-0.5">
                Hay {unpaidStudents.length} alumno(s) que aún no han abonado la cuota de {months[month - 1]} {year}.
              </p>
            </div>
          </div>
          <Link to="/alumnos" className="shrink-0">
            <Button size="sm" variant="outline" className="bg-white hover:bg-red-50 text-red-700 border-red-200 text-xs w-full sm:w-auto">
              Ver alumnos <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      )}

      {/* Summary cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-24 rounded-xl bg-muted/50 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-slide-up">
          <Card className="p-4 card-hover border-l-4 border-l-emerald-500">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{t("total_incomes") as string}</p>
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-xl font-bold text-emerald-600">{formatCurrency(totals?.totalIncomes ?? 0)}</p>
          </Card>
          <Card className="p-4 card-hover border-l-4 border-l-red-500">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{t("total_expenses") as string}</p>
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            </div>
            <p className="text-xl font-bold text-red-600">{formatCurrency(totals?.totalExpenses ?? 0)}</p>
          </Card>
          <Card className="p-4 card-hover border-l-4 border-l-primary">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{t("monthly_net") as string}</p>
              <Wallet className="h-4 w-4 text-primary" />
            </div>
            <p className={`text-xl font-bold ${(totals?.net ?? 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {formatCurrency(totals?.net ?? 0)}
            </p>
          </Card>
          <Card className="p-4 card-hover border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{t("current_balance") as string}</p>
              <TrendingUp className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-xl font-bold">{formatCurrency(currentBalance)}</p>
          </Card>
        </div>
      )}

      {/* Chart */}
      <Card className="p-4 animate-slide-up">
        <h3 className="text-sm font-semibold mb-3">{t("summary") as string}</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={finalChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ borderRadius: "12px", fontSize: "12px", border: "1px solid hsl(var(--border))" }}
              />
              <Legend />
              <Bar dataKey="ingresos" fill="hsl(145, 50%, 40%)" radius={[4, 4, 0, 0]} name={t("incomes") as string} />
              <Bar dataKey="gastos" fill="hsl(0, 50%, 50%)" radius={[4, 4, 0, 0]} name={t("expenses") as string} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Balance detail */}
      <Card className="p-4 animate-slide-up">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="p-3 bg-muted/30 rounded-xl">
            <p className="text-[11px] text-muted-foreground">{t("initial_balance") as string}</p>
            <p className="font-bold">{formatCurrency(mosque.initial_budget)}</p>
          </div>
          <div className="p-3 bg-muted/30 rounded-xl">
            <p className="text-[11px] text-muted-foreground">Saldo anterior</p>
            <p className="font-bold">{formatCurrency(balance?.previousBalance ?? 0)}</p>
          </div>
          <div className="p-3 bg-primary/5 rounded-xl border border-primary/20">
            <p className="text-[11px] text-primary">{t("current_balance") as string}</p>
            <p className="font-bold text-primary">{formatCurrency(currentBalance)}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
