import fs from 'fs';

let code = fs.readFileSync('src/routes/_app/alumnos.index.tsx', 'utf8');

const regex = /\{canModifyData\(\) && \(\s*<Button size="sm" className="gap-1 text-xs" onClick=\{\(\) => setShowForm\(true\)\}>\s*<Plus className="h-3\.5 w-3\.5" \/> \{t\("enroll_student"\) as string\}\s*<\/Button>\s*\)\}/;

const newHeader = `<div className="flex flex-wrap items-center gap-2 justify-end w-full md:w-auto mt-3 md:mt-0">
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
          </Button>
          {canModifyData() && (
            <Button size="sm" className="gap-1 text-xs" onClick={() => setShowForm(true)}>
              <Plus className="h-3.5 w-3.5" /> {t("enroll_student") as string}
            </Button>
          )}
        </div>`;

if (regex.test(code)) {
  code = code.replace(regex, newHeader);
  console.log("Match found and replaced!");
} else {
  console.log("No match found!");
}

// Ensure role is available if not already in useAuth destructure
if (!code.includes('const { mosqueId, canAccessStudents, canModifyData, role }')) {
  code = code.replace('const { mosqueId, canAccessStudents, canModifyData } = useAuth();', 'const { mosqueId, canAccessStudents, canModifyData, role } = useAuth();');
}

fs.writeFileSync('src/routes/_app/alumnos.index.tsx', code);
