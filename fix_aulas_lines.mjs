import fs from 'fs';
let code = fs.readFileSync('src/routes/_app/aulas.tsx', 'utf8');

const target = '<Eye className="h-4 w-4" />';
const lines = code.split('\n');

const newLines = [];
for (let i = 0; i < lines.length; i++) {
  newLines.push(lines[i]);
  if (lines[i].includes('</Link>') && lines[i-1].includes('<Eye')) {
    newLines.push('                {canModify && (');
    newLines.push('                  <button onClick={() => { if(confirm("¿Seguro que deseas retirar a este alumno del aula?")) removeStudent.mutate(s.id); }} className="p-2 hover:bg-muted rounded-full block text-destructive transition-colors">');
    newLines.push('                    <Trash2 className="h-4 w-4" />');
    newLines.push('                  </button>');
    newLines.push('                )}');
  }
}

fs.writeFileSync('src/routes/_app/aulas.tsx', newLines.join('\n'));
console.log('done');
