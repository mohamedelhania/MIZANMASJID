import fs from 'fs';
let code = fs.readFileSync('src/routes/_app/alumnos.index.tsx', 'utf8');

// Replace the supabase call with a safe one
code = code.replace(
  /const \{ data: mosque \} = await supabase\.from\("mosques"\)\.select\("\*"\)\.eq\("id", mosqueId\)\.single\(\);/,
  `let mosque = null;
      if (mosqueId) {
        const res = await supabase.from("mosques").select("*").eq("id", mosqueId).single();
        mosque = res.data;
      }`
);

fs.writeFileSync('src/routes/_app/alumnos.index.tsx', code);
console.log('Fixed mosque fetch');
