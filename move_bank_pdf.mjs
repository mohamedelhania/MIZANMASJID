import fs from 'fs';

let pdfCode = fs.readFileSync('src/lib/pdf.ts', 'utf8');

const bankBlock = `if (d.mosque.bank_account) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(\`Cuenta: \${d.mosque.bank_account}\`, 14, headerY + 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
  }`;
pdfCode = pdfCode.replace(bankBlock, '');

const oldFooter = `// Footer
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text(\`Generado el \${new Date().toLocaleString("es-ES")} - MizanMasjid\`, 14, 285);`;

const newFooter = `// Footer
  if (d.mosque.bank_account) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(50);
    // Centered at bottom
    const bankText = \`Cuenta de la Mezquita: \${d.mosque.bank_account}\`;
    const textWidth = doc.getStringUnitWidth(bankText) * 12 / doc.internal.scaleFactor;
    const pageWidth = doc.internal.pageSize.width;
    doc.text(bankText, (pageWidth - textWidth) / 2, 275);
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text(\`Generado el \${new Date().toLocaleString("es-ES")} - MizanMasjid\`, 14, 285);`;

pdfCode = pdfCode.replace(oldFooter, newFooter);
fs.writeFileSync('src/lib/pdf.ts', pdfCode);
