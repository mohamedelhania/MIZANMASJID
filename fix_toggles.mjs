import fs from 'fs';

// 1. SHART.TSX
let shart = fs.readFileSync('src/routes/_app/shart.tsx', 'utf8');
const oldShartToggle = `mutationFn: async ({ id, paid }: { id: string; paid: boolean }) => {
      await supabase.from("shart_payments").update({ paid }).eq("id", id);
    },`;
const newShartToggle = `mutationFn: async ({ id, paid }: { id: string; paid: boolean }) => {
      const now = new Date();
      await supabase.from("shart_payments").update(
        paid ? { paid, payment_year: now.getFullYear(), payment_month: now.getMonth() + 1 } : { paid, payment_year: null, payment_month: null }
      ).eq("id", id);
    },`;
shart = shart.replace(oldShartToggle.replace(/\n/g, '\r\n'), newShartToggle.replace(/\n/g, '\r\n'));
shart = shart.replace(oldShartToggle, newShartToggle);
fs.writeFileSync('src/routes/_app/shart.tsx', shart);

// 2. ALUMNOS.INDEX.TSX
let alIndex = fs.readFileSync('src/routes/_app/alumnos.index.tsx', 'utf8');
const oldAlIndexToggle = `if (current) {
        await supabase.from("student_payments").delete().eq("student_id", studentId).eq("year", year).eq("month", month);
      } else {
        await supabase.from("student_payments").insert({ student_id: studentId, year, month, paid: true, amount: fee });
      }`;
const newAlIndexToggle = `if (current) {
        await supabase.from("student_payments").delete().eq("student_id", studentId).eq("year", year).eq("month", month);
      } else {
        const now = new Date();
        await supabase.from("student_payments").insert({ student_id: studentId, year, month, paid: true, amount: fee, payment_year: now.getFullYear(), payment_month: now.getMonth() + 1 });
      }`;
alIndex = alIndex.replace(oldAlIndexToggle.replace(/\n/g, '\r\n'), newAlIndexToggle.replace(/\n/g, '\r\n'));
alIndex = alIndex.replace(oldAlIndexToggle, newAlIndexToggle);
fs.writeFileSync('src/routes/_app/alumnos.index.tsx', alIndex);

// 3. ALUMNOS.$STUDENTID.TSX
let alId = fs.readFileSync('src/routes/_app/alumnos.$studentId.tsx', 'utf8');
const oldAlIdToggle = `await supabase.from("student_payments").upsert({ student_id: studentId, year, month, paid, amount }, { onConflict: "student_id,year,month" });`;
const newAlIdToggle = `const now = new Date();
      if (paid) {
        await supabase.from("student_payments").upsert({ student_id: studentId, year, month, paid, amount, payment_year: now.getFullYear(), payment_month: now.getMonth() + 1 }, { onConflict: "student_id,year,month" });
      } else {
        // Just delete or set null. Upserting with null is fine since it's paid=false
        await supabase.from("student_payments").upsert({ student_id: studentId, year, month, paid, amount, payment_year: null, payment_month: null }, { onConflict: "student_id,year,month" });
      }`;
alId = alId.replace(oldAlIdToggle.replace(/\n/g, '\r\n'), newAlIdToggle.replace(/\n/g, '\r\n'));
alId = alId.replace(oldAlIdToggle, newAlIdToggle);
fs.writeFileSync('src/routes/_app/alumnos.$studentId.tsx', alId);

console.log('done');
