import fs from 'fs';

let code = fs.readFileSync('src/routes/_app/alumnos.index.tsx', 'utf8');

// Update mutationFn to accept arguments
const regex = /mutationFn: async \(\) => \{\s*console\.log\("Creando alumno\.\.\."\);\s*const \{ error, data: newStudent \} = await supabase\.from\("students"\)\.insert\(\{([\s\S]*?)\}\)\.select\(\)\.single\(\);/m;

const newCode = `mutationFn: async (vars: any) => {
      console.log("Creando alumno...");
      const { error, data: newStudent } = await supabase.from("students").insert({
        first_name: vars.firstName, 
        last_name: vars.lastName, 
        mosque_id: mosqueId!,
        date_of_birth: vars.birthDate || null,
        tutor_name: vars.tutorName || null,
        contact_phone: vars.contactPhone || null,
        classroom_id: vars.classroomId || null,
        monthly_fee: Number(vars.monthlyFee) || 0,
        student_dni: vars.studentDni || null,
        tutor_dni: vars.tutorDni || null
      }).select().single();`;

code = code.replace(regex, newCode);

// Update photoFile reference inside mutationFn
code = code.replace(/if \(photoFile && newStudent\)/g, 'if (vars.photoFile && newStudent)');
code = code.replace(/photoFile\.name/g, 'vars.photoFile.name');
code = code.replace(/upload\(path, photoFile/g, 'upload(path, vars.photoFile');

// Update mutate call
const mutateRegex = /addStudent\.mutate\(\);/g;
const mutateNew = `addStudent.mutate({ firstName, lastName, birthDate, tutorName, contactPhone, classroomId, monthlyFee, studentDni, tutorDni, photoFile });`;

code = code.replace(mutateRegex, mutateNew);

fs.writeFileSync('src/routes/_app/alumnos.index.tsx', code);
console.log('Fixed stale closure');
