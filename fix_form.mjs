import fs from 'fs';
let code = fs.readFileSync('src/routes/_app/alumnos.index.tsx', 'utf8');

code = code.replace(
  'const { error } = await supabase.from("students").insert({',
  'const { error, data: newStudent } = await supabase.from("students").insert({'
);
code = code.replace(
  '        });\n        if (error) throw error;\n      },\n      onSuccess: () => {',
  '        }).select().single();\n        if (error) throw error;\n\n        if (photoFile && newStudent) {\n          const ext = photoFile.name.split(".").pop();\n          const path = `${mosqueId}/${newStudent.id}.${ext}`;\n          const { error: uploadError } = await supabase.storage.from("student-photos").upload(path, photoFile, { upsert: true });\n          if (!uploadError) {\n             const { data: { publicUrl } } = supabase.storage.from("student-photos").getPublicUrl(path);\n             await supabase.from("students").update({ photo_url: publicUrl }).eq("id", newStudent.id);\n          }\n        }\n      },\n      onSuccess: () => {'
);
code = code.replace(
  'setTutorDni(""); setShowForm(false);',
  'setTutorDni(""); setPhotoFile(null); setShowForm(false);'
);

const photoInput = `
              <div>
                <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">Foto del Alumno</label>
                <div className="flex items-center gap-2">
                  <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files?.[0] || null)} className="w-full px-3 py-1.5 rounded-xl border border-border bg-background text-sm" />
                </div>
              </div>
`;
code = code.replace('</select>\n              </div>\n            </div>', '</select>\n              </div>\n' + photoInput + '            </div>');

fs.writeFileSync('src/routes/_app/alumnos.index.tsx', code);
console.log('done');
