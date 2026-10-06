import fs from 'fs';
let code = fs.readFileSync('src/routes/_app/alumnos.index.tsx', 'utf8');

const regex = /const generatePdf = async \(\) => \{([\s\S]*?)setShowPdfDialog\(false\);\s*\};/;
const match = code.match(regex);
if (match) {
    const newBody = `const generatePdf = async () => {\n    try {\n` + match[1] + `\n      setShowPdfDialog(false);\n    } catch (e) {\n      console.error(e);\n      alert('Error: ' + e.message + '\\n' + e.stack);\n    }\n  };`;
    code = code.replace(regex, newBody);
    fs.writeFileSync('src/routes/_app/alumnos.index.tsx', code);
    console.log('try catch added');
} else {
    console.log('No match found');
}
