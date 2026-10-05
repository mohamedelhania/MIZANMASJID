import fs from 'fs';

let code = fs.readFileSync('src/routes/_app/dashboard.tsx', 'utf8');

const oldQueryBlock = `        const [vxRes, juRes, spRes, shpRes] = await Promise.all([
          supabase.from("variable_expenses").select("year, month, amount").eq("mosque_id", mosqueId).gte("year", minYear).lte("year", maxYear),
          supabase.from("jumuah_collections").select("year, month, amount").eq("mosque_id", mosqueId).gte("year", minYear).lte("year", maxYear),
          supabase.from("student_payments").select("year, month, amount, paid, students!inner(mosque_id)").eq("students.mosque_id", mosqueId).eq("paid", true).gte("year", minYear).lte("year", maxYear),
          supabase.from("shart_payments").select("month, paid, shart_contributors!inner(year, monthly_amount, mosque_id)").eq("shart_contributors.mosque_id", mosqueId).eq("paid", true),
        ]);

        const vx = vxRes.data ?? [];
        const ju = juRes.data ?? [];
        const sp = spRes.data ?? [];
        const shp = shpRes.data ?? [];`;

const newQueryBlock = `        const [vxRes, juRes, spRes, shpRes, viRes] = await Promise.all([
          supabase.from("variable_expenses").select("year, month, amount").eq("mosque_id", mosqueId).gte("year", minYear).lte("year", maxYear),
          supabase.from("jumuah_collections").select("year, month, amount").eq("mosque_id", mosqueId).gte("year", minYear).lte("year", maxYear),
          supabase.from("student_payments").select("payment_year, payment_month, amount, paid, students!inner(mosque_id)").eq("students.mosque_id", mosqueId).eq("paid", true).gte("payment_year", minYear).lte("payment_year", maxYear),
          supabase.from("shart_payments").select("payment_year, payment_month, paid, shart_contributors!inner(monthly_amount, mosque_id)").eq("shart_contributors.mosque_id", mosqueId).eq("paid", true),
          supabase.from("variable_incomes").select("year, month, amount").eq("mosque_id", mosqueId).gte("year", minYear).lte("year", maxYear),
        ]);

        const vx = vxRes.data ?? [];
        const ju = juRes.data ?? [];
        const sp = spRes.data ?? [];
        const shp = shpRes.data ?? [];
        const vi = viRes.data ?? [];`;

code = code.replace(oldQueryBlock, newQueryBlock);

const oldReduceBlock = `          // Student fees income
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

          return {
            name: monthsShort[m - 1],
            ingresos: jumuah + studentFees + shartTotal,
            gastos,
          };`;

const newReduceBlock = `          // Student fees income
          const studentFees = sp
            .filter(r => r.payment_year === y && r.payment_month === m)
            .reduce((s, r) => s + Number(r.amount ?? 0), 0);

          // Shart income
          const shartTotal = shp
            .filter(r => r.payment_year === y && r.payment_month === m)
            .reduce((s, r) => {
              const c = r.shart_contributors as unknown as { monthly_amount: number | string };
              return s + Number(c?.monthly_amount ?? 0);
            }, 0);

          // Variable incomes
          const variableIncomes = vi
            .filter(r => r.year === y && r.month === m)
            .reduce((s, r) => s + Number(r.amount ?? 0), 0);

          return {
            name: monthsShort[m - 1],
            ingresos: jumuah + studentFees + shartTotal + variableIncomes,
            gastos,
          };`;

code = code.replace(oldReduceBlock, newReduceBlock);

fs.writeFileSync('src/routes/_app/dashboard.tsx', code);
console.log('Dashboard updated');
