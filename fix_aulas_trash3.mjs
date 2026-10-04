import fs from 'fs';
let code = fs.readFileSync('src/routes/_app/aulas.tsx', 'utf8');

const t1 = '<Eye className="h-4 w-4" />\r\n                </Link>';
const r1 = `<Eye className="h-4 w-4" />
                </Link>
                {canModify && (
                  <button onClick={() => { if(confirm("¿Seguro que deseas retirar a este alumno del aula?")) removeStudent.mutate(s.id); }} className="p-2 hover:bg-muted rounded-full block text-destructive transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}`;

const t2 = '<Eye className="h-4 w-4" />\n                </Link>';
const r2 = r1.replace(/\r\n/g, '\n');

code = code.replace(t1, r1);
code = code.replace(t2, r2);

fs.writeFileSync('src/routes/_app/aulas.tsx', code);
console.log('done');
