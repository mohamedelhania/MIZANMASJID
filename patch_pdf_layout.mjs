import fs from 'fs';
let code = fs.readFileSync('src/routes/_app/alumnos.index.tsx', 'utf8');

// 1. Portrait only
code = code.replace(
    /const isLandscape = pdfFields\.payments;\s*const doc = new jsPDF\(isLandscape \? "landscape" : "portrait"\);/, 
    'const doc = new jsPDF("portrait");'
);

// 2. Adjust Logo dimensions
code = code.replace(
    /doc\.addImage\(base64 as string, "PNG", 14, 10, 25, 25\);/, 
    'doc.addImage(base64 as string, "PNG", 14, 10, 50, 18);'
);

// 3. Move Mosque Name & Subtitle
code = code.replace(
    /doc\.text\(mosque\?\.name \|\| "MizanMasjid", 45, 22\);/, 
    'doc.text(mosque?.name || "MizanMasjid", 70, 18);'
);
code = code.replace(
    /doc\.text\("Listado de Alumnos", 45, 30\);/, 
    'doc.text("Listado de Alumnos", 70, 25);'
);

// 4. Update Styles for tight layout
code = code.replace(
    /styles: \{ fontSize: 8, cellPadding: 2 \}/, 
    'styles: { fontSize: pdfFields.payments ? 6 : 8, cellPadding: pdfFields.payments ? 0.8 : 2 }'
);

fs.writeFileSync('src/routes/_app/alumnos.index.tsx', code);
console.log('Done patching pdf orientation and logo');
