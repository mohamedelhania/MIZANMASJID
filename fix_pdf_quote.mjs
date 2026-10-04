import fs from 'fs';
let code = fs.readFileSync('src/lib/pdf.ts', 'utf8');

const regex = /doc\.text\(".*?9:108", 14, headerY \+ 25, { maxWidth: 180, align: "right" }\);/s;

const newText = `doc.setFont("helvetica", "italic");
  doc.text('"En ella hay hombres que aman purificarse, y Dios ama a los que se purifican" (Corán 9:108)', 105, headerY + 25, { align: "center" });
  doc.setFont("helvetica", "normal");`;

code = code.replace(regex, newText);

fs.writeFileSync('src/lib/pdf.ts', code);
console.log('done');
