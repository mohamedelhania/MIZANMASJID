import fs from 'fs';

let code = fs.readFileSync('src/routes/_app/dashboard.tsx', 'utf8');

const oldRegex = /const \[vxRes, juRes, spRes, shpRes\] = await Promise\.all\(\[\s*supabase.*?\]\);\s*const vx = vxRes\.data \?\? \[\];\s*const ju = juRes\.data \?\? \[\];\s*const sp = spRes\.data \?\? \[\];\s*const shp = shpRes\.data \?\? \[\];\s*return range\.map\(\(\{\s*year: y, month: m\s*\}\) => \{.*?return \{\s*name: monthsShort\[m - 1\],\s*ingresos: jumuah \+ studentFees \+ shartTotal,\s*gastos,\s*\};\s*\}\);/s;

const newBlock = `const [vxRes, juRes, spRes, shpRes, viRes] = await Promise.all([
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
        const vi = viRes.data ?? [];

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
          };
        });`;

code = code.replace(oldRegex, newBlock);

fs.writeFileSync('src/routes/_app/dashboard.tsx', code);
console.log('Dashboard fixed with regex');
