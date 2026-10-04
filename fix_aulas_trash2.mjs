import fs from 'fs';
let code = fs.readFileSync('src/routes/_app/aulas.tsx', 'utf8');

const target = '<Eye className="h-4 w-4" />\r\n                </Link>';
const fallback = '<Eye className="h-4 w-4" />\n                </Link>';

const newContent = `<Eye className="h-4 w-4" />
                </Link>
                {canModify && (
                  <button onClick={() => { if(confirm("¿Seguro que deseas retirar a este alumno del aula?")) removeStudent.mutate(s.id); }} className="p-2 hover:bg-muted rounded-full block text-destructive transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}`;

// Also make the container flex
code = code.replace('className="ml-auto"', 'className="ml-auto flex items-center"');

if (code.includes(target)) {
  code = code.replace(target, newContent.replace(/\n/g, '\r\n'));
} else {
  code = code.replace(fallback, newContent);
}

fs.writeFileSync('src/routes/_app/aulas.tsx', code);
console.log('done');
