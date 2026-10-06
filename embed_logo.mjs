import fs from 'fs';

// 1. Generate Base64
const image = fs.readFileSync('src/assets/mizan_logo.jpg');
const base64 = image.toString('base64');
const fileContent = 'export const MIZAN_LOGO_BASE64 = "data:image/jpeg;base64,' + base64 + '";\n';
fs.writeFileSync('src/lib/logoBase64.ts', fileContent);

// 2. Patch alumnos.index.tsx
let alumnos = fs.readFileSync('src/routes/_app/alumnos.index.tsx', 'utf8');
alumnos = alumnos.replace(/import logoUrl from "@\/assets\/mizan_logo\.jpg";/, 'import { MIZAN_LOGO_BASE64 } from "@/lib/logoBase64";');

const oldFetchLogic = /try \{\s*const response = await fetch\(logoUrl\);[\s\S]*?if \(base64\) \{\s*doc\.addImage\(base64 as string, "JPEG", 14, 10, 50, 18\);\s*\}\s*\} catch \(e\) \{ console\.error\(e\); \}/;
alumnos = alumnos.replace(oldFetchLogic, 'doc.addImage(MIZAN_LOGO_BASE64, "JPEG", 14, 10, 50, 18);');
fs.writeFileSync('src/routes/_app/alumnos.index.tsx', alumnos);

// 3. Patch pdf.ts
let pdfTs = fs.readFileSync('src/lib/pdf.ts', 'utf8');
pdfTs = pdfTs.replace(/import logoUrl from "@\/assets\/mizan_logo\.jpg";/, 'import { MIZAN_LOGO_BASE64 } from "@/lib/logoBase64";');

const oldPdfFetchLogic = /async function getLogoBase64\(\): Promise<string \| null> \{[\s\S]*?return null;\s*\}\s*\}/;
pdfTs = pdfTs.replace(oldPdfFetchLogic, 'async function getLogoBase64(): Promise<string | null> {\n  return MIZAN_LOGO_BASE64;\n}');
fs.writeFileSync('src/lib/pdf.ts', pdfTs);

console.log('Logo directly embedded.');
