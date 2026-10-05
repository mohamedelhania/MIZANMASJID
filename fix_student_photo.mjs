import fs from 'fs';

let code = fs.readFileSync('src/routes/_app/alumnos.index.tsx', 'utf8');

const regex = /const addStudent = useMutation\(\{\s*mutationFn: async \(\) => \{\s*const \{ error, data: newStudent \} = await supabase\.from\("students"\)\.insert\(\{([\s\S]*?)\}\);\s*if \(error\) throw error;\s*\},\s*onSuccess: \(\) => \{/m;

const newCode = `const addStudent = useMutation({
    mutationFn: async () => {
      const { error, data: newStudent } = await supabase.from("students").insert({$1}).select().single();
      if (error) throw error;
      
      if (photoFile && newStudent) {
        const ext = photoFile.name.split(".").pop();
        const path = \`\${mosqueId}/\${newStudent.id}.\${ext}\`;
        const { error: uploadError } = await supabase.storage.from("student-photos").upload(path, photoFile, { upsert: true });
        
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from("student-photos").getPublicUrl(path);
          await supabase.from("students").update({ photo_url: publicUrl }).eq("id", newStudent.id);
        }
      }
    },
    onSuccess: () => {`;

code = code.replace(regex, newCode);

fs.writeFileSync('src/routes/_app/alumnos.index.tsx', code);
console.log('Fixed photo upload in addStudent');
