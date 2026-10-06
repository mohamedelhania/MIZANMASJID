import fs from 'fs';

let code = fs.readFileSync('src/routes/_app/alumnos.index.tsx', 'utf8');

const pdfDialogUI = `
      {/* PDF Export Dialog */}
      {showPdfDialog && (
        <div className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center p-4">
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

code = code.replace(/      \)\}\r?\n    <\/div>\r?\n  \);\r?\n\}\r?\n?$/, '      )}\n' + pdfDialogUI);

fs.writeFileSync('src/routes/_app/alumnos.index.tsx', code);
