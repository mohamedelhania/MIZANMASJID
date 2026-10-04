import fs from 'fs';
let code = fs.readFileSync('src/routes/_app/alumnos.index.tsx', 'utf8');

// 1. Add state
code = code.replace(
  'const [tutorDocType, setTutorDocType] = useState("DNI");',
  'const [tutorDocType, setTutorDocType] = useState("DNI");\n  const [photoFile, setPhotoFile] = useState<File | null>(null);'
);

// 2. Modify addStudent mutation start
code = code.replace(
  'const { error } = await supabase.from("students").insert({',
  'const { error, data: newStudent } = await supabase.from("students").insert({'
);

// 3. Modify addStudent mutation end
code = code.replace(
  '        });\r\n        if (error) throw error;\r\n      },\r\n      onSuccess: () => {',
  '        }).select().single();\r\n        if (error) throw error;\r\n\r\n        if (photoFile && newStudent) {\r\n          const ext = photoFile.name.split(".").pop();\r\n          const path = `${mosqueId}/${newStudent.id}.${ext}`;\r\n          const { error: uploadError } = await supabase.storage.from("student-photos").upload(path, photoFile, { upsert: true });\r\n          if (!uploadError) {\r\n             const { data: { publicUrl } } = supabase.storage.from("student-photos").getPublicUrl(path);\r\n             await supabase.from("students").update({ photo_url: publicUrl }).eq("id", newStudent.id);\r\n          }\r\n        }\r\n      },\r\n      onSuccess: () => {'
);
// Fallback if no \r
code = code.replace(
  '        });\n        if (error) throw error;\n      },\n      onSuccess: () => {',
  '        }).select().single();\n        if (error) throw error;\n\n        if (photoFile && newStudent) {\n          const ext = photoFile.name.split(".").pop();\n          const path = `${mosqueId}/${newStudent.id}.${ext}`;\n          const { error: uploadError } = await supabase.storage.from("student-photos").upload(path, photoFile, { upsert: true });\n          if (!uploadError) {\n             const { data: { publicUrl } } = supabase.storage.from("student-photos").getPublicUrl(path);\n             await supabase.from("students").update({ photo_url: publicUrl }).eq("id", newStudent.id);\n          }\n        }\n      },\n      onSuccess: () => {'
);

// 4. Modify form reset
code = code.replace(
  'setTutorDni(""); setShowForm(false);',
  'setTutorDni(""); setPhotoFile(null); setShowForm(false);'
);

// 5. Add input to form
const formTarget = '<option value="">-- Sin Aula --</option>';
const formReplace = '<option value="">-- Sin Aula --</option>';
const insertStr = `
              </div>
              <div className="sm:col-span-2 md:col-span-3">
                <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">Foto del Alumno (Opcional)</label>
                <div className="flex items-center gap-2">
                  <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files?.[0] || null)} className="w-full px-3 py-1.5 rounded-xl border border-border bg-background text-sm" />
                </div>`;
                
// Find `<option value="">-- Sin Aula --</option>` then look for `</div>\r\n            </div>` after it
const idx1 = code.indexOf(formTarget);
const idx2 = code.indexOf('</div>', idx1 + formTarget.length);
code = code.substring(0, idx2 + 6) + insertStr + code.substring(idx2 + 6);

fs.writeFileSync('src/routes/_app/alumnos.index.tsx', code);
console.log('done');
