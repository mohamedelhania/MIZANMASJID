import fs from 'fs';

let code = fs.readFileSync('src/routes/_app/alumnos.index.tsx', 'utf8');

// 1. Add logoUrl import if missing
if (!code.includes('import logoUrl')) {
  code = code.replace('import { useState } from "react";', 'import { useState } from "react";\nimport logoUrl from "@/assets/logo.png";');
}

// 2. Update pdfFields state to include onlyDebtors
code = code.replace(
  /const \[pdfFields, setPdfFields\] = useState\(\{[\s\S]*?payments: (true|false)[\s\S]*?\}\);/,
  `const [pdfFields, setPdfFields] = useState({
    number: true,
    name: true,
    lastname: true,
    dni: true,
    classroom: true,
    fee: true,
    payments: false,
    onlyDebtors: false
  });`
);

// 3. Replace generatePdf function
const generatePdfRegex = /const generatePdf = \(\) => \{[\s\S]*?setShowPdfDialog\(false\);\s*\};/;
const newGeneratePdf = `const generatePdf = async () => {
    const isLandscape = pdfFields.payments;
    const doc = new jsPDF(isLandscape ? "landscape" : "portrait");
    
    // Fetch Mosque info
    const { data: mosque } = await supabase.from("mosques").select("*").eq("id", mosqueId).single();
    
    let headerY = 20;

    // Add Logo
    try {
      const response = await fetch(logoUrl);
      const blob = await response.blob();
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      if (base64) {
        doc.addImage(base64 as string, "PNG", 14, 10, 25, 25);
      }
    } catch (e) { console.error(e); }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(20, 163, 119); // MizanMasjid green
    doc.text(mosque?.name || "MizanMasjid", 45, 22);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text("Listado de Alumnos", 45, 30);

    headerY = 45;

    // Build headers
    const head = [];
    if (pdfFields.number) head.push("Nº");
    if (pdfFields.name) head.push("Nombre");
    if (pdfFields.lastname) head.push("Apellidos");
    if (pdfFields.dni) head.push("DNI");
    if (pdfFields.classroom) head.push("Aula");
    if (pdfFields.fee) head.push("Cuota");
    
    const monthNames = ["E", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
    if (pdfFields.payments) {
      head.push(...monthNames);
    }

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    let studentsToExport = filtered;
    
    if (pdfFields.onlyDebtors) {
      studentsToExport = filtered.filter(s => {
        const paidThisYear = (payments || []).filter(p => p.student_id === s.id && p.year === currentYear && p.paid);
        return paidThisYear.length < currentMonth; // Simple debtor logic
      });
    }

    const body = studentsToExport.map(s => {
      const row = [];
      if (pdfFields.number) row.push(s.enrollment_number || "-");
      if (pdfFields.name) row.push(s.first_name);
      if (pdfFields.lastname) row.push(s.last_name);
      if (pdfFields.dni) row.push(s.student_dni || "-");
      if (pdfFields.classroom) row.push(s.classrooms?.name || "-");
      if (pdfFields.fee) row.push(s.monthly_fee ? \`\${s.monthly_fee}€\` : "0€");
      
      if (pdfFields.payments) {
        const paidThisYear = (payments || []).filter(p => p.student_id === s.id && p.year === currentYear && p.paid).map(p => p.month);
        for (let i = 1; i <= 12; i++) {
          row.push(paidThisYear.includes(i) ? "Pagado" : "No");
        }
      }
      return row;
    });

    autoTable(doc, {
      startY: headerY,
      head: [head],
      body: body,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [20, 163, 119], halign: 'center' },
      didParseCell: (data) => {
        if (pdfFields.payments && data.section === 'body') {
          const colIndex = data.column.index;
          const monthsStartIndex = head.length - 12;
          if (colIndex >= monthsStartIndex) {
            data.cell.styles.halign = 'center';
            if (data.cell.raw === 'Pagado') {
              data.cell.text = [''];
              data.cell.styles.fillColor = [187, 247, 208];
            } else if (data.cell.raw === 'No') {
              data.cell.text = [''];
              data.cell.styles.fillColor = [254, 202, 202];
            }
          }
        }
      }
    });

    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      if (mosque?.bank_account) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(50);
        const bankText = \`Cuenta de la Mezquita: \${mosque.bank_account}\`;
        const textWidth = doc.getStringUnitWidth(bankText) * 11 / doc.internal.scaleFactor;
        const pageWidth = doc.internal.pageSize.width;
        doc.text(bankText, (pageWidth - textWidth) / 2, doc.internal.pageSize.height - 15);
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(\`Generado el \${new Date().toLocaleString("es-ES")} - MizanMasjid\`, 14, doc.internal.pageSize.height - 5);
    }

    doc.save("alumnos.pdf");
    setShowPdfDialog(false);
  };`;

if (code.match(generatePdfRegex)) {
  code = code.replace(generatePdfRegex, newGeneratePdf);
} else {
  // Try matching async version if it already was async somehow
  const generatePdfAsyncRegex = /const generatePdf = async \(\) => \{[\s\S]*?setShowPdfDialog\(false\);\s*\};/;
  code = code.replace(generatePdfAsyncRegex, newGeneratePdf);
}

// 4. Update the dialog UI
const dialogRegex = /<h3 className="text-lg font-bold mb-4">Opciones de Exportación<\/h3>[\s\S]*?<div className="flex gap-2">/;
const newDialogUI = `<h3 className="text-lg font-bold mb-4">Opciones de Exportación</h3>
            <div className="space-y-3 mb-6">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pdfFields.number} onChange={e => setPdfFields(f => ({...f, number: e.target.checked}))} /> Número de Alumno</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pdfFields.name} onChange={e => setPdfFields(f => ({...f, name: e.target.checked}))} /> Nombre</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pdfFields.lastname} onChange={e => setPdfFields(f => ({...f, lastname: e.target.checked}))} /> Apellidos</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pdfFields.dni} onChange={e => setPdfFields(f => ({...f, dni: e.target.checked}))} /> DNI</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pdfFields.classroom} onChange={e => setPdfFields(f => ({...f, classroom: e.target.checked}))} /> Aula</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pdfFields.fee} onChange={e => setPdfFields(f => ({...f, fee: e.target.checked}))} /> Cuota Mensual</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pdfFields.payments} onChange={e => setPdfFields(f => ({...f, payments: e.target.checked}))} /> Meses Pagados (Tabla de Colores)</label>
              
              <div className="h-px bg-border my-2"></div>
              
              <label className="flex items-center gap-2 text-sm font-semibold text-destructive"><input type="checkbox" checked={pdfFields.onlyDebtors} onChange={e => setPdfFields(f => ({...f, onlyDebtors: e.target.checked}))} /> Filtrar solo deudores (morosos)</label>
            </div>
            <div className="flex gap-2">`;
code = code.replace(dialogRegex, newDialogUI);

fs.writeFileSync('src/routes/_app/alumnos.index.tsx', code);
