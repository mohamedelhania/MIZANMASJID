import fs from 'fs';

let code = fs.readFileSync('src/routes/_app/alumnos.index.tsx', 'utf8');

const regex = /mutationFn: async \(\) => \{\s*const \{ error, data: newStudent \} = await supabase\.from\("students"\)\.insert\(\{([\s\S]*?)\}\)\.select\(\)\.single\(\);\s*if \(error\) throw error;\s*if \(photoFile && newStudent\) \{[\s\S]*?\}\s*\},\s*onSuccess/m;

const newCode = `mutationFn: async () => {
      console.log("Creando alumno...");
      const { error, data: newStudent } = await supabase.from("students").insert({$1}).select().single();
      
      if (error) {
        console.error("Error insert:", error);
        throw error;
      }
      
      console.log("Alumno creado:", newStudent);

      if (photoFile && newStudent) {
        console.log("Hay foto para subir:", photoFile.name);
        const ext = photoFile.name.split(".").pop();
        const path = \`\${mosqueId}/\${newStudent.id}.\${ext}\`;
        
        console.log("Subiendo foto a:", path);
        const { error: uploadError } = await supabase.storage.from("student-photos").upload(path, photoFile, { upsert: true });
        
        if (!uploadError) {
          console.log("Foto subida. Obteniendo URL...");
          const { data: { publicUrl } } = supabase.storage.from("student-photos").getPublicUrl(path);
          console.log("Public URL:", publicUrl);
          
          const { error: updateError } = await supabase.from("students").update({ photo_url: publicUrl }).eq("id", newStudent.id);
          if (updateError) {
            console.error("Error al actualizar la BD con la foto:", updateError);
          } else {
            console.log("BD actualizada con la foto!");
          }
        } else {
          console.error("Error al subir la foto:", uploadError);
        }
      }
    },
    onSuccess`;

code = code.replace(regex, newCode);

fs.writeFileSync('src/routes/_app/alumnos.index.tsx', code);
console.log('Added debug logs to addStudent');
