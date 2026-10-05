import fs from 'fs';

let code = fs.readFileSync('src/lib/finance.ts', 'utf8');

// Update useMonthlyTotals to fetch and sum variable_incomes
code = code.replace(
  'const [vx, ju, sp, shp] = await Promise.all([',
  'const [vx, ju, sp, shp, vi] = await Promise.all(['
);
code = code.replace(
  'supabase.from("shart_payments").select("contributor_id, paid, shart_contributors!inner(monthly_amount, mosque_id)").eq("shart_contributors.mosque_id", mosqueId).eq("payment_month", month).eq("paid", true).eq("payment_year", year),',
  'supabase.from("shart_payments").select("contributor_id, paid, shart_contributors!inner(monthly_amount, mosque_id)").eq("shart_contributors.mosque_id", mosqueId).eq("payment_month", month).eq("paid", true).eq("payment_year", year),\n        supabase.from("variable_incomes").select("amount").eq("mosque_id", mosqueId).eq("year", year).eq("month", month),'
);
code = code.replace(
  'const jumuah = sum(ju.data);',
  'const jumuah = sum(ju.data);\n      const variableIncomes = sum(vi.data);'
);
code = code.replace(
  'const totalIncomes = jumuah + studentFees + shartTotal;',
  'const totalIncomes = jumuah + studentFees + shartTotal + variableIncomes;'
);
code = code.replace(
  'jumuah, studentFees, shartTotal, totalIncomes,',
  'jumuah, studentFees, shartTotal, variableIncomes, totalIncomes,'
);

// Update useRollingBalance to fetch and sum variable_incomes
code = code.replace(
  'const [vx, ju, sp, shp] = await Promise.all([',
  'const [vx, ju, sp, shp, vi] = await Promise.all(['
);
code = code.replace(
  'supabase.from("shart_payments").select("payment_month, payment_year, paid, shart_contributors!inner(monthly_amount, mosque_id)").eq("shart_contributors.mosque_id", mosqueId).eq("paid", true),',
  'supabase.from("shart_payments").select("payment_month, payment_year, paid, shart_contributors!inner(monthly_amount, mosque_id)").eq("shart_contributors.mosque_id", mosqueId).eq("paid", true),\n        supabase.from("variable_incomes").select("year, month, amount").eq("mosque_id", mosqueId),'
);
code = code.replace(
  'sumPrior(ju.data) +',
  'sumPrior(ju.data) + sumPrior(vi.data) +'
);

fs.writeFileSync('src/lib/finance.ts', code);
console.log('Finance.ts fixed');
