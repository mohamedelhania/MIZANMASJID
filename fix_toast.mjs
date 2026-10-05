import fs from 'fs';

let code = fs.readFileSync('src/routes/_app/alumnos.index.tsx', 'utf8');

// Replace problematic toasts
code = code.replace(/toast\.success\([\s\S]*?\);/g, 'toast.success("Hecho");');

fs.writeFileSync('src/routes/_app/alumnos.index.tsx', code);
console.log('Fixed toasts');
