import fs from 'fs';
let code = fs.readFileSync('src/routes/_app/alumnos.index.tsx', 'utf8');

code = code.replace(/toast\.success\("Numeraci.n reiniciada correctamente"\);\s*\}\s*\}\);\s*/, '');

fs.writeFileSync('src/routes/_app/alumnos.index.tsx', code);
