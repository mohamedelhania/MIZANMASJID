import fs from 'fs';
import path from 'path';

// 1. Remove (Maktab)
let rm = fs.readFileSync('src/routes/registrar-mezquita.tsx', 'utf8');
rm = rm.replace('Clases gratuitas (Maktab)', 'Clases gratuitas');
fs.writeFileSync('src/routes/registrar-mezquita.tsx', rm);

// 2. Add Create Mosque Button
let mz = fs.readFileSync('src/routes/_app/mezquitas.tsx', 'utf8');
const createMosqueBtn = `{role === 'super_admin' && (
            <Link to="/registrar-mezquita" className="mr-3 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm hover:shadow-md transition-all">
              <Plus className="h-4 w-4" /> Añadir Mezquita
            </Link>
          )}
          <div className="flex bg-muted/50 p-1 rounded-xl">`;
mz = mz.replace('<div className="flex bg-muted/50 p-1 rounded-xl">', createMosqueBtn);
// Ensure Plus is imported if not
if (!mz.includes('Plus,')) {
  mz = mz.replace('List,', 'List, Plus,');
}
fs.writeFileSync('src/routes/_app/mezquitas.tsx', mz);

// 3. Update Bank Account in PDF
let pdf = fs.readFileSync('src/lib/pdf.ts', 'utf8');
const oldBank = `if (d.mosque.bank_account) {
    doc.text(\`Cuenta: \${d.mosque.bank_account}\`, 14, headerY + 15);
  }`;
const newBank = `if (d.mosque.bank_account) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(\`Cuenta: \${d.mosque.bank_account}\`, 14, headerY + 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
  }`;
pdf = pdf.replace(oldBank, newBank);
fs.writeFileSync('src/lib/pdf.ts', pdf);

// 4. Update viewport for zoom fix
let root = fs.readFileSync('src/routes/__root.tsx', 'utf8');
root = root.replace(
  '{ name: "viewport", content: "width=device-width, initial-scale=1" }',
  '{ name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" }'
);
fs.writeFileSync('src/routes/__root.tsx', root);

console.log('Setup script complete');
