import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useMonthlyTotals(mosqueId: string | null, year: number, month: number) {
  return useQuery({
    queryKey: ["monthly-totals", mosqueId, year, month],
    queryFn: async () => {
      if (!mosqueId) return null;
      const [vx, ju, sp, shp, vi] = await Promise.all([
        supabase.from("variable_expenses").select("amount").eq("mosque_id", mosqueId).eq("year", year).eq("month", month),
        supabase.from("jumuah_collections").select("amount").eq("mosque_id", mosqueId).eq("year", year).eq("month", month),
        supabase.from("student_payments").select("amount, paid, students!inner(mosque_id)").eq("students.mosque_id", mosqueId).eq("payment_year", year).eq("payment_month", month).eq("paid", true),
        supabase.from("shart_payments").select("contributor_id, paid, shart_contributors!inner(monthly_amount, mosque_id)").eq("shart_contributors.mosque_id", mosqueId).eq("payment_month", month).eq("paid", true).eq("payment_year", year),
        supabase.from("variable_incomes").select("amount").eq("mosque_id", mosqueId).eq("year", year).eq("month", month),
      ]);
      const sum = (rows: { amount: number | string | null }[] | null) =>
        (rows ?? []).reduce((s, r) => s + Number(r.amount ?? 0), 0);

      const variableExpenses = sum(vx.data);
      const jumuah = sum(ju.data);
      const variableIncomes = sum(vi.data);
      const studentFees = sum(sp.data);
      const shartTotal = (shp.data ?? []).reduce((s, r) => {
        const c = r.shart_contributors as unknown as { monthly_amount: number | string } | null;
        return s + Number(c?.monthly_amount ?? 0);
      }, 0);

      const totalExpenses = variableExpenses;
      const totalIncomes = jumuah + studentFees + shartTotal + variableIncomes;
      return {
        variableExpenses, totalExpenses,
        jumuah, studentFees, shartTotal, variableIncomes, totalIncomes,
        net: totalIncomes - totalExpenses,
      };
    },
    enabled: !!mosqueId,
  });
}

export function useRollingBalance(mosqueId: string | null, initialBudget: number, year: number, month: number) {
  return useQuery({
    queryKey: ["rolling-balance", mosqueId, year, month],
    queryFn: async () => {
      if (!mosqueId) return { initial: initialBudget, previousBalance: initialBudget };

      const [vx, ju, sp, shp, vi] = await Promise.all([
        supabase.from("variable_expenses").select("year, month, amount").eq("mosque_id", mosqueId),
        supabase.from("jumuah_collections").select("year, month, amount").eq("mosque_id", mosqueId),
        supabase.from("student_payments").select("payment_year, payment_month, amount, paid, students!inner(mosque_id)").eq("students.mosque_id", mosqueId).eq("paid", true),
        supabase.from("shart_payments").select("payment_month, payment_year, paid, shart_contributors!inner(monthly_amount, mosque_id)").eq("shart_contributors.mosque_id", mosqueId).eq("paid", true),
        supabase.from("variable_incomes").select("year, month, amount").eq("mosque_id", mosqueId),
      ]);

      const isPrior = (y: number, m: number) => y < year || (y === year && m < month);
      const sumPrior = (rows: { year: number; month: number; amount: number | string | null }[] | null) =>
        (rows ?? []).filter(r => isPrior(r.year, r.month)).reduce((s, r) => s + Number(r.amount ?? 0), 0);

      const priorExpenses = sumPrior(vx.data);
      const priorIncomes =
        sumPrior(ju.data) + sumPrior(vi.data) +
        (sp.data ?? []).filter(r => isPrior(r.payment_year, r.payment_month)).reduce((s, r) => s + Number(r.amount ?? 0), 0) +
        (shp.data ?? []).filter(r => {
          return isPrior(r.payment_year, r.payment_month);
        }).reduce((s, r) => {
          const c = r.shart_contributors as unknown as { monthly_amount: number | string };
          return s + Number(c?.monthly_amount ?? 0);
        }, 0);

      const previousBalance = initialBudget + priorIncomes - priorExpenses;
      return { initial: initialBudget, previousBalance };
    },
    enabled: !!mosqueId,
  });
}
