import fs from 'fs';

let code = fs.readFileSync('src/routes/_app/alumnos.index.tsx', 'utf8');

// 1. Add jspdf and jspdf-autotable imports
if (!code.includes('import jsPDF')) {
  code = `import jsPDF from "jspdf";\nimport autoTable from "jspdf-autotable";\n` + code;
}
if (!code.includes('import { Download,')) {
  code = code.replace('import {', 'import { Download, ');
}

// 2. Add PDF export states and dialog inside AlumnosIndexPage
const statesInjection = `
  const [showPdfDialog, setShowPdfDialog] = useState(false);
  const [pdfFields, setPdfFields] = useState({
    number: true,
    name: true,
    lastname: true,
    dni: true,
    classroom: true,
    fee: true,
    payments: false
  });

  const generatePdf = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Listado de Alumnos", 14, 20);

    const head = [];
    if (pdfFields.number) head.push("Nº");
    if (pdfFields.name) head.push("Nombre");
    if (pdfFields.lastname) head.push("Apellidos");
    if (pdfFields.dni) head.push("DNI");
    if (pdfFields.classroom) head.push("Aula");
    if (pdfFields.fee) head.push("Cuota");
    if (pdfFields.payments) head.push("Pagos (Este año)");

    const body = filtered.map(s => {
      const row = [];
      if (pdfFields.number) row.push(s.enrollment_number || "-");
      if (pdfFields.name) row.push(s.first_name);
      if (pdfFields.lastname) row.push(s.last_name);
      if (pdfFields.dni) row.push(s.student_dni || "-");
      if (pdfFields.classroom) row.push(s.classrooms?.name || "-");
      if (pdfFields.fee) row.push(s.monthly_fee ? \`\${s.monthly_fee}€\` : "0€");
      if (pdfFields.payments) {
        const currentYear = new Date().getFullYear();
        const paidThisYear = (payments || []).filter(p => p.student_id === s.id && p.year === currentYear && p.paid);
        row.push(paidThisYear.map(p => p.month).sort((a,b)=>a-b).join(", ") || "Ninguno");
      }
      return row;
    });

    autoTable(doc, {
      startY: 25,
      head: [head],
      body: body,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [20, 163, 119] }
    });

    doc.save("alumnos.pdf");
    setShowPdfDialog(false);
  };
`;
if (!code.includes('const generatePdf = () => {')) {
  code = code.replace(/const \[search, setSearch\] = useState\(""\);/g, `const [search, setSearch] = useState("");${statesInjection}`);
}

// 4. Add "Reset numbers" logic
const resetNumbersInjection = `
  const resetNumbers = useMutation({
    mutationFn: async () => {
      if (!students) return;
      const sortedStudents = [...students].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      for (let i = 0; i < sortedStudents.length; i++) {
        await supabase.from("students").update({ enrollment_number: i + 1 }).eq("id", sortedStudents[i].id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      toast.success("Numeración reiniciada correctamente");
    }
  });
`;
if (!code.includes('const resetNumbers = useMutation')) {
  code = code.replace(/const deleteStudent = useMutation/g, resetNumbersInjection + '\n  const deleteStudent = useMutation');
}

// 5. Add Export PDF and Reset Number buttons in header
const buttonsInjection = `className="flex gap-2 w-full md:w-auto">
          {role === 'super_admin' && (
            <Button variant="outline" className="text-xs text-amber-600 border-amber-200 hover:bg-amber-50" onClick={async () => {
              if (await confirm("¿Seguro que deseas reiniciar la numeración de todos los alumnos?")) {
                resetNumbers.mutate();
              }
            }}>
              Reiniciar Numeración
            </Button>
          )}
          <Button variant="outline" className="text-xs" onClick={() => setShowPdfDialog(true)}>
            <Download className="h-4 w-4 mr-2" /> Exportar PDF
          </Button>`;
code = code.replace('className="flex gap-2 w-full md:w-auto">', buttonsInjection);

// 6. Filter logic
code = code.replace(
  /const filtered = \(students \?\? \[\]\)\.filter\(s =>\s*`\$\{s\.first_name\} \$\{s\.last_name\}`\.toLowerCase\(\)\.includes\(search\.toLowerCase\(\)\)\s*\);/m,
  `const filtered = (students ?? []).filter(s =>
    \`\${s.first_name} \${s.last_name}\`.toLowerCase().includes(search.toLowerCase()) ||
    (s.enrollment_number && s.enrollment_number.toString() === search)
  );`
);

// 7. Add enrollment_number to insert
code = code.replace('first_name: vars.firstName,', 'enrollment_number: vars.nextNumber,\n          first_name: vars.firstName,');
code = code.replace(
  'addStudent.mutate({ firstName', 
  'const currentStudents = qc.getQueryData(["students", mosqueId]);\n                const nextNumber = Math.max(0, ...(currentStudents||[]).map(s => s.enrollment_number || 0)) + 1;\n                addStudent.mutate({ nextNumber, firstName'
);

// 8. Display it on the list
code = code.replace(
  /<p className="text-sm font-medium">\{s\.first_name\} \{s\.last_name\}<\/p>/g,
  `<p className="text-sm font-medium"><span className="text-muted-foreground mr-1 font-mono text-xs">#{s.enrollment_number || "-"}</span> {s.first_name} {s.last_name}</p>`
);

// 9. Add the PDF Dialog at the end of the return statement
const pdfDialogUI = `
      {/* PDF Export Dialog */}
      {showPdfDialog && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm p-5 animate-scale-in relative">
            <h3 className="text-lg font-bold mb-4">Opciones de Exportación</h3>
            <div className="space-y-3 mb-6">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pdfFields.number} onChange={e => setPdfFields(f => ({...f, number: e.target.checked}))} /> Número de Alumno</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pdfFields.name} onChange={e => setPdfFields(f => ({...f, name: e.target.checked}))} /> Nombre</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pdfFields.lastname} onChange={e => setPdfFields(f => ({...f, lastname: e.target.checked}))} /> Apellidos</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pdfFields.dni} onChange={e => setPdfFields(f => ({...f, dni: e.target.checked}))} /> DNI</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pdfFields.classroom} onChange={e => setPdfFields(f => ({...f, classroom: e.target.checked}))} /> Aula</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pdfFields.fee} onChange={e => setPdfFields(f => ({...f, fee: e.target.checked}))} /> Cuota Mensual</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pdfFields.payments} onChange={e => setPdfFields(f => ({...f, payments: e.target.checked}))} /> Pagos (Este Año)</label>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowPdfDialog(false)}>Cancelar</Button>
              <Button className="flex-1" onClick={generatePdf}>Descargar PDF</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
`;
code = code.replace(/<\/div>\s*<\/div>\s*\);\s*\}/, pdfDialogUI); // This depends on the exact file ending.
// Actually, safer: replace the last 3 lines
code = code.replace(/<\/div>\s*<\/div>\s*\);\s*\}\s*$/m, pdfDialogUI);

fs.writeFileSync('src/routes/_app/alumnos.index.tsx', code);
console.log('Done patching alumnos');
