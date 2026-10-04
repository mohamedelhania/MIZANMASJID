import fs from 'fs';
let code = fs.readFileSync('src/routes/_app/alumnos.index.tsx', 'utf8');

// 1. Photo preview
code = code.replace(
  '<div className="flex items-center gap-2">\r\n                  <input type="file"',
  '<div className="flex items-center gap-4">\r\n                  {photoFile && <img src={URL.createObjectURL(photoFile)} alt="Preview" className="h-10 w-10 object-cover rounded-full" />}\r\n                  <input type="file"'
);
code = code.replace(
  '<div className="flex items-center gap-2">\n                  <input type="file"',
  '<div className="flex items-center gap-4">\n                  {photoFile && <img src={URL.createObjectURL(photoFile)} alt="Preview" className="h-10 w-10 object-cover rounded-full" />}\n                  <input type="file"'
);

// 2. Fix the fullscreen viewer X button
code = code.replace(
  'className="absolute top-4 right-4 text-white hover:text-gray-300 bg-black/50 rounded-full p-2"',
  'className="absolute top-6 right-6 md:top-8 md:right-8 z-[100] text-white hover:text-gray-300 bg-black/50 rounded-full p-4"'
);

fs.writeFileSync('src/routes/_app/alumnos.index.tsx', code);
console.log('done');
