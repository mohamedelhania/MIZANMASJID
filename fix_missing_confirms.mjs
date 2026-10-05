import fs from 'fs';

const files = [
  'src/routes/_app/alumnos.$studentId.tsx',
  'src/routes/_app/gastos.tsx',
  'src/routes/_app/mezquitas.$mosqueId.tsx',
  'src/routes/_app/shart.tsx'
];

for (const file of files) {
  let code = fs.readFileSync(file, 'utf8');

  // Ensure ConfirmDialogProvider is imported
  if (!code.includes('ConfirmDialogProvider')) {
    code = 'import { useConfirm } from "@/providers/ConfirmDialogProvider";\n' + code;
  }

  // Ensure const confirm = useConfirm(); is injected in the main component
  const funcMatch = code.match(/function\s+[A-Za-z0-9_]+\s*\([^)]*\)\s*\{/);
  if (funcMatch && !code.substring(funcMatch.index, funcMatch.index+200).includes('const confirm = useConfirm()')) {
    const insertPos = funcMatch.index + funcMatch[0].length;
    code = code.slice(0, insertPos) + '\n  const confirm = useConfirm();' + code.slice(insertPos);
  }
  
  // also inject in MosqueConfigManager if exists
  const funcMatch2 = code.match(/function\s+MosqueConfigManager\s*\(\{[^\}]*\}\)\s*\{/);
  if (funcMatch2 && !code.substring(funcMatch2.index, funcMatch2.index+200).includes('const confirm = useConfirm()')) {
    const insertPos = funcMatch2.index + funcMatch2[0].length;
    code = code.slice(0, insertPos) + '\n  const confirm = useConfirm();' + code.slice(insertPos);
  }

  // Replace missing confirms
  code = code.replace(/onClick=\{\(\) => deleteNote\.mutate\((.*?)\)\}/g, 'onClick={async () => { if (await confirm("¿Seguro que deseas eliminar esta nota?")) deleteNote.mutate($1); }}');
  code = code.replace(/onClick=\{\(\) => deleteVariableIncome\.mutate\((.*?)\)\}/g, 'onClick={async () => { if (await confirm("¿Borrar ingreso?")) deleteVariableIncome.mutate($1); }}');
  code = code.replace(/onClick=\{\(\) => deleteConfig\.mutate\((.*?)\)\}/g, 'onClick={async () => { if (await confirm("¿Eliminar configuración?")) deleteConfig.mutate($1); }}');
  code = code.replace(/onClick=\{\(\) => deleteEntry\.mutate\((.*?)\)\}/g, 'onClick={async () => { if (await confirm("¿Eliminar pago?")) deleteEntry.mutate($1); }}');

  fs.writeFileSync(file, code);
  console.log('Fixed', file);
}
