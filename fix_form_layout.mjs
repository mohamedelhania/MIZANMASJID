import fs from 'fs';
let code = fs.readFileSync('src/routes/_app/alumnos.index.tsx', 'utf8');

const target = '</select>\n              </div>\n            </div>';
const replacement = `</select>
              </div>
              <div className="sm:col-span-2 md:col-span-3">
                <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">Foto del Alumno (Opcional)</label>
                <div className="flex items-center gap-2">
                  <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files?.[0] || null)} className="w-full px-3 py-1.5 rounded-xl border border-border bg-background text-sm" />
                </div>
              </div>
            </div>`;

code = code.replace(target, replacement);
fs.writeFileSync('src/routes/_app/alumnos.index.tsx', code);
console.log('done');
