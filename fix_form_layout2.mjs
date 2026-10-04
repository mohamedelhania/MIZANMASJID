import fs from 'fs';
let code = fs.readFileSync('src/routes/_app/alumnos.index.tsx', 'utf8');

const replacement = `                <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">Aula Asignada</label>
                <select value={classroomId} onChange={e => setClassroomId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm">
                  <option value="">-- Sin Aula --</option>
                  {(classrooms ?? []).map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2 md:col-span-3">
                <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">Foto del Alumno (Opcional)</label>
                <div className="flex items-center gap-2">
                  <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files?.[0] || null)} className="w-full px-3 py-1.5 rounded-xl border border-border bg-background text-sm" />
                </div>
              </div>
            </div>`;

const lines = code.split('\n');
const startIndex = lines.findIndex(l => l.includes('Aula Asignada')) - 1;
const endIndex = lines.findIndex((l, i) => i > startIndex && l.includes('</div>\r') && lines[i+1]?.includes('</div>\r'));

const updated = [...lines.slice(0, startIndex), replacement, ...lines.slice(endIndex + 2)].join('\n');
fs.writeFileSync('src/routes/_app/alumnos.index.tsx', updated);
console.log('done');
