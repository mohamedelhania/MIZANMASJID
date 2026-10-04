import fs from 'fs';
let code = fs.readFileSync('src/routes/_app/alumnos.index.tsx', 'utf8');

const oldButtonClass = 'className="absolute top-4 right-4 h-8 w-8 bg-background/50 backdrop-blur-md rounded-full flex items-center justify-center text-foreground hover:bg-background transition-colors z-10 border border-border shadow-sm"';
const newButtonClass = 'className="fixed top-safe mt-4 right-4 md:top-6 md:right-6 h-10 w-10 md:h-12 md:w-12 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors z-[200] border border-white/20 shadow-lg"';

code = code.replace(oldButtonClass, newButtonClass);

fs.writeFileSync('src/routes/_app/alumnos.index.tsx', code);
console.log('done');
