import fs from 'fs';
let code = fs.readFileSync('src/routes/_app/alumnos.index.tsx', 'utf8');

// 1. Add filter logic
code = code.replace(
  /const filtered = \(students \?\? \[\]\)\.filter\(s =>\s*`\$\{s\.first_name\} \$\{s\.last_name\}`\.toLowerCase\(\)\.includes\(search\.toLowerCase\(\)\)\s*\);/m,
  `const filtered = (students ?? []).filter(s =>
    \`\${s.first_name} \${s.last_name}\`.toLowerCase().includes(search.toLowerCase()) ||
    (s.enrollment_number && s.enrollment_number.toString().includes(search))
  );`
);

// 2. Add enrollment_number to insert
// We need to inject `enrollment_number: nextNumber` into the insert object.
// The `vars` are passed to `insert({ ... })`
// Let's find `first_name: vars.firstName,` and inject `enrollment_number: vars.nextNumber,`
code = code.replace('first_name: vars.firstName,', 'enrollment_number: vars.nextNumber,\n          first_name: vars.firstName,');

// Modify the mutate call
// `addStudent.mutate({ firstName, ... })`
// We need to calculate nextNumber before calling mutate
code = code.replace(
  'addStudent.mutate({ firstName', 
  'const nextNumber = Math.max(0, ...(students||[]).map(s => s.enrollment_number || 0)) + 1;\n                addStudent.mutate({ nextNumber, firstName'
);

// 3. Display it on the list
// Find `<p className="text-sm font-medium">{s.first_name} {s.last_name}</p>`
code = code.replace(
  /<p className="text-sm font-medium">\{s\.first_name\} \{s\.last_name\}<\/p>/g,
  `<p className="text-sm font-medium"><span className="text-muted-foreground mr-1">#{s.enrollment_number || "-"}</span> {s.first_name} {s.last_name}</p>`
);

// 4. Add "Reset numbers" logic
const resetNumbersInjection = `
  const resetNumbers = useMutation({
    mutationFn: async () => {
      if (!students) return;
      const sortedStudents = [...students].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      // Update one by one or in chunks
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

// 5. Add "Reset Numbers" button next to "Exportar PDF"
const resetBtn = `
            {canModifyData() && (
              <Button variant="outline" className="text-xs text-amber-600 border-amber-200 hover:bg-amber-50" onClick={async () => {
                if (await confirm("¿Seguro que deseas reiniciar la numeración de todos los alumnos? Se asignarán números secuenciales a partir del 1.")) {
                  resetNumbers.mutate();
                }
              }}>
                Reiniciar Numeración
              </Button>
            )}
`;
code = code.replace(/\{canModifyData\(\) && \(\s*<Button size="sm" className="text-xs gap-1"/g, resetBtn + '\n            {canModifyData() && (\n              <Button size="sm" className="text-xs gap-1"');

fs.writeFileSync('src/routes/_app/alumnos.index.tsx', code);
console.log('Enrollment number logic added');
