import fs from 'fs';

let code = fs.readFileSync('src/routes/_app/alumnos.index.tsx', 'utf8');

// 1. Remove resetNumbers mutation
code = code.replace(/const resetNumbers = useMutation\(\{[\s\S]*?\}\);\s*/, '');

// 2. Remove "Reiniciar Numeración" button
const resetBtnRegex = /\{\s*role === 'super_admin'\s*&&\s*\(\s*<Button variant="outline" className="text-xs text-amber-600 border-amber-200 hover:bg-amber-50"[\s\S]*?<\/Button>\s*\)\s*\}/;
code = code.replace(resetBtnRegex, '');

// 3. Remove enrollment_number from insert payload
code = code.replace(/enrollment_number:\s*vars\.nextNumber,?\s*/, '');
code = code.replace(/const nextNumber = Math\.max\(0, \.\.\.\(currentStudents\|\|\[\]\)\.map\(s => s\.enrollment_number \|\| 0\)\) \+ 1;\s*/, '');
code = code.replace(/addStudent\.mutate\(\{ nextNumber, firstName/g, 'addStudent.mutate({ firstName');

// 4. Inject local numbering logic
// Find the filtered definition
const filterRegex = /const filtered = \(students \?\? \[\]\)\.filter\(s =>[\s\S]*?\);\s*/;
if (code.match(filterRegex)) {
  const customMapping = `
  const studentsWithNumber = React.useMemo(() => {
    if (!students) return [];
    return [...students].sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).map((s, idx) => ({ ...s, enrollment_number: idx + 1 }));
  }, [students]);

  const filtered = studentsWithNumber.filter(s =>
    \`\${s.first_name} \${s.last_name}\`.toLowerCase().includes(search.toLowerCase()) ||
    (s.enrollment_number && s.enrollment_number.toString() === search)
  );
`;
  code = code.replace(filterRegex, customMapping);
  
  if (!code.includes('import React')) {
    code = code.replace('import { useState', 'import React, { useState');
  }
}

fs.writeFileSync('src/routes/_app/alumnos.index.tsx', code);
