import fs from 'fs';

let code = fs.readFileSync('src/lib/finance.ts', 'utf8');

// Modify useMonthlyTotals
code = code.replace(
  'supabase.from("student_payments").select("amount, paid, students!inner(mosque_id)").eq("students.mosque_id", mosqueId).eq("year", year).eq("month", month).eq("paid", true),',
  'supabase.from("student_payments").select("amount, paid, students!inner(mosque_id)").eq("students.mosque_id", mosqueId).eq("payment_year", year).eq("payment_month", month).eq("paid", true),'
);

code = code.replace(
  'supabase.from("shart_payments").select("contributor_id, paid, shart_contributors!inner(monthly_amount, year, mosque_id)").eq("shart_contributors.mosque_id", mosqueId).eq("month", month).eq("paid", true).eq("shart_contributors.year", year),',
  'supabase.from("shart_payments").select("contributor_id, paid, shart_contributors!inner(monthly_amount, mosque_id)").eq("shart_contributors.mosque_id", mosqueId).eq("payment_month", month).eq("paid", true).eq("payment_year", year),'
);

// Modify useRollingBalance
code = code.replace(
  'supabase.from("student_payments").select("year, month, amount, paid, students!inner(mosque_id)").eq("students.mosque_id", mosqueId).eq("paid", true),',
  'supabase.from("student_payments").select("payment_year, payment_month, amount, paid, students!inner(mosque_id)").eq("students.mosque_id", mosqueId).eq("paid", true),'
);

code = code.replace(
  'supabase.from("shart_payments").select("month, paid, shart_contributors!inner(year, monthly_amount, mosque_id)").eq("shart_contributors.mosque_id", mosqueId).eq("paid", true),',
  'supabase.from("shart_payments").select("payment_month, payment_year, paid, shart_contributors!inner(monthly_amount, mosque_id)").eq("shart_contributors.mosque_id", mosqueId).eq("paid", true),'
);

// Update sumPrior for student payments (change r.year, r.month to r.payment_year, r.payment_month)
// BUT we can't easily replace inside the sumPrior logic if they map the same keys.
// Wait, the select changed to "payment_year, payment_month". But in JS it will be r.payment_year!
code = code.replace(
  'sumPrior(sp.data) +',
  '(sp.data ?? []).filter(r => isPrior(r.payment_year, r.payment_month)).reduce((s, r) => s + Number(r.amount ?? 0), 0) +'
);

// Shart rolling balance update
const oldShartRolling = `(shp.data ?? []).filter(r => {
          const c = r.shart_contributors as unknown as { year: number; monthly_amount: number };
          return c && isPrior(c.year, r.month);
        }).reduce((s, r) => {
          const c = r.shart_contributors as unknown as { monthly_amount: number | string };
          return s + Number(c.monthly_amount ?? 0);
        }, 0);`;

const newShartRolling = `(shp.data ?? []).filter(r => {
          return isPrior(r.payment_year, r.payment_month);
        }).reduce((s, r) => {
          const c = r.shart_contributors as unknown as { monthly_amount: number | string };
          return s + Number(c?.monthly_amount ?? 0);
        }, 0);`;

code = code.replace(oldShartRolling, newShartRolling);

fs.writeFileSync('src/lib/finance.ts', code);
console.log('done');
