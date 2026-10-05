import fs from 'fs';
import path from 'path';

const filesToPatch = [
  "src/routes/_app/alumnos.index.tsx",
  "src/routes/_app/aulas.tsx",
  "src/routes/_app/gastos.tsx",
  "src/routes/_app/mezquitas.$mosqueId.tsx",
  "src/routes/_app/mezquitas.tsx",
  "src/routes/_app/shart.tsx",
  "src/routes/_app/usuarios.tsx"
];

for (const file of filesToPatch) {
  let code = fs.readFileSync(file, 'utf8');

  if (code.includes('ConfirmDialogProvider')) continue;

  // 1. Add import
  code = `import { useConfirm } from "@/providers/ConfirmDialogProvider";\n` + code;

  // 2. Inject `const confirm = useConfirm();` inside the component
  // Find `function SomethingPage() {`
  const funcMatch = code.match(/function\s+[A-Za-z0-9_]+\s*\(\)\s*\{/);
  if (funcMatch) {
    const insertPos = funcMatch.index + funcMatch[0].length;
    code = code.slice(0, insertPos) + '\n  const confirm = useConfirm();' + code.slice(insertPos);
  } else {
    console.error("Could not find component function in", file);
  }

  // 3. Make onclick async and await confirm
  // e.g. onClick={() => { if (confirm(...)) ... }}
  code = code.replace(/onClick=\{\s*\(\)\s*=>\s*\{\s*if\s*\(\s*confirm\((.*?)\)\s*\)\s*(.*?);\s*\}\}/g, 'onClick={async () => { if (await confirm($1)) $2; }}');
  
  // Replace the aulas one manually
  code = code.replace(/onClick=\{\(\) => \{\s*if \(confirm\((.*?)\)\) \{\s*deleteClassroom\.mutate\(\);\s*\}\s*\}\}/g, 
  `onClick={async () => {\n                  if (await confirm($1)) {\n                    deleteClassroom.mutate();\n                  }\n                }}`);

  // Wait, in `shart.tsx` it's on a button, etc. Let's make a generic replace for any onClick with confirm
  // `onClick={() => { if (confirm(` -> `onClick={async () => { if (await confirm(`
  code = code.replace(/onClick=\{\s*\(\)\s*=>\s*\{(\s*)if\s*\(\s*confirm\(/g, 'onClick={async () => {$1if (await confirm(');
  // What if there is no space?
  
  // Let's do a more generic replacement:
  // ANY `confirm(` that is preceded by `if (` or `if(`
  // Wait, we already replaced `confirm(` locally! 
  
  // Let's just write a careful regex for async () =>
  // onClick={() => ... confirm(...)}
  // Just replace all `onClick={() => { if (confirm` with `onClick={async () => { if (await confirm`
  // Then we also need to fix `if (confirm` to `if (await confirm`.
  
  fs.writeFileSync(file, code);
  console.log("Patched", file);
}
