import fs from 'fs';

// Patch alumnos.index.tsx
let alumnos = fs.readFileSync('src/routes/_app/alumnos.index.tsx', 'utf8');
alumnos = alumnos.replace(/import logoUrl from "@\/assets\/logo\.png";/g, 'import logoUrl from "@/assets/mizan_logo.jpg";');
alumnos = alumnos.replace(/doc\.addImage\(base64 as string, "PNG"/g, 'doc.addImage(base64 as string, "JPEG"');
fs.writeFileSync('src/routes/_app/alumnos.index.tsx', alumnos);

// Patch pdf.ts
let pdfTs = fs.readFileSync('src/lib/pdf.ts', 'utf8');
pdfTs = pdfTs.replace(/import logoUrl from "@\/assets\/logo\.png";/g, 'import logoUrl from "@/assets/mizan_logo.jpg";');
pdfTs = pdfTs.replace(/doc\.addImage\(base64, "PNG", 14, 15, 20, 20\);/g, 'doc.addImage(base64, "JPEG", 14, 15, 50, 18);');
// Move the header text for the monthly report so it doesn't overlap with the wider logo
pdfTs = pdfTs.replace(/doc\.text\(mosque\.name, 40, 25\);/g, 'doc.text(mosque.name, 70, 25);');
pdfTs = pdfTs.replace(/doc\.text\(`Informe de Gastos e Ingresos - \$\{monthLabel\} \$\{year\}`\, 40, 32\);/g, 'doc.text(`Informe de Gastos e Ingresos - ${monthLabel} ${year}`, 70, 32);');
fs.writeFileSync('src/lib/pdf.ts', pdfTs);

console.log('Done replacing logo path and type');
