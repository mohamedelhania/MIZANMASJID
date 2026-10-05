import fs from 'fs';

let code = fs.readFileSync('src/routes/_app/aulas.tsx', 'utf8');

const stateRegex = /const \[name, setName\] = useState\(""\);\s*const \[teacherId, setTeacherId\] = useState<string>\(""\);/;
const stateNew = `const [name, setName] = useState("");
  const [teacherId, setTeacherId] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");`;

code = code.replace(stateRegex, stateNew);

const insertRegex = /const \{ error \} = await supabase\.from\("classrooms"\)\.insert\(\{ \s*name, \s*mosque_id: mosqueId!,\s*teacher_id: teacherId \|\| null \s*\}\);/;
const insertNew = `const { error } = await supabase.from("classrooms").insert({ 
        name, 
        mosque_id: mosqueId!,
        teacher_id: teacherId || null,
        start_date: startDate || null,
        end_date: endDate || null
      });`;

code = code.replace(insertRegex, insertNew);

const onSuccessRegex = /setName\(""\); setTeacherId\(""\); setShowForm\(false\);/;
const onSuccessNew = `setName(""); setTeacherId(""); setStartDate(""); setEndDate(""); setShowForm(false);`;

code = code.replace(onSuccessRegex, onSuccessNew);

const formRegex = /<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">\s*<input placeholder=\{t\("classroom_name"\) as string\}[\s\S]*?<\/select>/;
const formNew = `<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <input placeholder={t("classroom_name") as string} value={name} onChange={e => setName(e.target.value)}
                className="px-3 py-2 rounded-xl border border-border bg-background text-sm" />
              
              <select value={teacherId} onChange={e => setTeacherId(e.target.value)}
                className="px-3 py-2 rounded-xl border border-border bg-background text-sm">
                <option value="">-- Seleccionar Profesor --</option>
                {(teachers ?? []).map((t: any) => (
                  <option key={t.user_id} value={t.user_id}>{t.profiles?.full_name || t.user_id}</option>
                ))}
              </select>

              <div className="flex flex-col">
                <label className="text-[10px] text-muted-foreground uppercase mb-1">Fecha Inicio (Ej. Sep 2026)</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-border bg-background text-sm" />
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] text-muted-foreground uppercase mb-1">Fecha Fin (Ej. Jul 2027)</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-border bg-background text-sm" />
              </div>`;

code = code.replace(formRegex, formNew);

// Add display of dates in the grid
const gridDisplayRegex = /<h3 className="font-semibold text-sm mb-2 flex items-center gap-2">\s*<BookOpen className="h-4 w-4 text-primary" \/> \{c\.name\}\s*<\/h3>/;
const gridDisplayNew = `<h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" /> {c.name}
                  </h3>
                  {(c.start_date || c.end_date) && (
                    <p className="text-[10px] text-muted-foreground mb-2 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {c.start_date ? new Date(c.start_date).toLocaleDateString() : '?'} - {c.end_date ? new Date(c.end_date).toLocaleDateString() : '?'}
                    </p>
                  )}`;

code = code.replace(gridDisplayRegex, gridDisplayNew);

// Update dates inside the detailed view
const headerRegex = /<h2 className="text-xl font-bold flex items-center gap-2">\s*\{currentAula\?\.name\}\s*<\/h2>/;
const headerNew = `<div className="flex flex-col">
              <h2 className="text-xl font-bold flex items-center gap-2">
                {currentAula?.name}
              </h2>
              {(currentAula?.start_date || currentAula?.end_date) && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Calendar className="h-3 w-3" />
                  {currentAula?.start_date ? new Date(currentAula.start_date).toLocaleDateString() : '?'} - {currentAula?.end_date ? new Date(currentAula.end_date).toLocaleDateString() : '?'}
                </p>
              )}
            </div>`;

code = code.replace(headerRegex, headerNew);


fs.writeFileSync('src/routes/_app/aulas.tsx', code);
console.log('aulas.tsx updated');
