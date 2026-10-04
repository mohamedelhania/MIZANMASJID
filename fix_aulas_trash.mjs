import fs from 'fs';
let code = fs.readFileSync('src/routes/_app/aulas.tsx', 'utf8');

// 1. Update TabAlumnos call
code = code.replace(
  '{activeTab === "alumnos" && <TabAlumnos students={students} />}',
  '{activeTab === "alumnos" && <TabAlumnos students={students} qc={qc} canModify={canModifyData()} />}'
);

// 2. Update TabAlumnos definition
const oldTabAlumnosDef = `function TabAlumnos({ students }: { students: any[] }) {
  return (
    <Card className="p-4 animate-fade-in">`;

const newTabAlumnosDef = `function TabAlumnos({ students, qc, canModify }: { students: any[], qc: any, canModify: boolean }) {
  const removeStudent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("students").update({ classroom_id: null }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["classroom-students"] });
      toast.success("Alumno retirado del aula");
    }
  });

  return (
    <Card className="p-4 animate-fade-in">`;

code = code.replace(oldTabAlumnosDef.replace(/\n/g, '\r\n'), newTabAlumnosDef.replace(/\n/g, '\r\n'));
code = code.replace(oldTabAlumnosDef, newTabAlumnosDef);

// 3. Update the render logic inside TabAlumnos
const oldRender = `              <div className="ml-auto">
                <Link to="/alumnos/$studentId" params={{ studentId: s.id }} className="p-2 hover:bg-muted rounded-full block text-muted-foreground hover:text-primary transition-colors">
                  <Eye className="h-4 w-4" />
                </Link>
              </div>
            </div>`;

const newRender = `              <div className="ml-auto flex items-center">
                <Link to="/alumnos/$studentId" params={{ studentId: s.id }} className="p-2 hover:bg-muted rounded-full block text-muted-foreground hover:text-primary transition-colors">
                  <Eye className="h-4 w-4" />
                </Link>
                {canModify && (
                  <button onClick={() => { if(confirm("¿Seguro que deseas retirar a este alumno del aula?")) removeStudent.mutate(s.id); }} className="p-2 hover:bg-muted rounded-full block text-destructive transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>`;

code = code.replace(oldRender.replace(/\n/g, '\r\n'), newRender.replace(/\n/g, '\r\n'));
code = code.replace(oldRender, newRender);

fs.writeFileSync('src/routes/_app/aulas.tsx', code);
console.log('done');
